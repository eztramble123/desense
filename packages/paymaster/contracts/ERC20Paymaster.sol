// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./base/BasePaymaster.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ERC20Paymaster
 * @notice Accepts ERC20 tokens as gas payment. Users pay with tokens instead of native ADI.
 *
 * paymasterAndData layout:
 *   [0:20]   paymaster address (handled by EntryPoint)
 *   [20:52]  maxTokenCost (uint256, big-endian) — maximum tokens user agrees to pay
 *
 * Flow:
 *   1. validatePaymasterUserOp: transfers maxTokenCost from user to paymaster
 *   2. postOp: refunds excess tokens based on actual gas used
 */
contract ERC20Paymaster is BasePaymaster {
    using SafeERC20 for IERC20;

    IERC20 public token;
    uint256 public tokenPriceMarkup; // basis points (10000 = 1x, 12000 = 1.2x)
    uint256 public nativeToTokenRate; // how many token units per 1 native wei (scaled by 1e18)

    event TokenConfigured(address indexed token, uint256 rate, uint256 markup);

    constructor(
        address _entryPoint,
        address _owner,
        address _token
    ) BasePaymaster(_entryPoint, _owner) {
        token = IERC20(_token);
        tokenPriceMarkup = 12000; // 1.2x default markup
        nativeToTokenRate = 1e18; // 1:1 default (MVP)
    }

    // --- Configuration ---

    function setToken(address _token) external onlyOwner {
        token = IERC20(_token);
    }

    function setTokenPriceMarkup(uint256 _markup) external onlyOwner {
        require(_markup >= 10000, "ERC20Paymaster: markup too low");
        tokenPriceMarkup = _markup;
    }

    function setNativeToTokenRate(uint256 _rate) external onlyOwner {
        require(_rate > 0, "ERC20Paymaster: rate must be positive");
        nativeToTokenRate = _rate;
        emit TokenConfigured(address(token), _rate, tokenPriceMarkup);
    }

    // --- Price calculation ---

    function getTokenCostForGas(uint256 gasCost) public view returns (uint256) {
        return (gasCost * nativeToTokenRate * tokenPriceMarkup) / (1e18 * 10000);
    }

    // --- Paymaster validation ---

    function _validatePaymasterUserOp(
        IEntryPoint.PackedUserOperation calldata userOp,
        bytes32 /* userOpHash */,
        uint256 maxCost
    ) internal override returns (bytes memory context, uint256 validationData) {
        bytes calldata pData = userOp.paymasterAndData;
        require(pData.length >= 52, "ERC20Paymaster: invalid paymasterAndData length");

        uint256 maxTokenCost = uint256(bytes32(pData[20:52]));

        // Calculate required token cost based on max gas
        uint256 requiredTokenCost = getTokenCostForGas(maxCost);
        require(maxTokenCost >= requiredTokenCost, "ERC20Paymaster: maxTokenCost too low");

        // Check user has sufficient token balance
        uint256 userBalance = token.balanceOf(userOp.sender);
        require(userBalance >= requiredTokenCost, "ERC20Paymaster: insufficient token balance");

        // Check user has approved paymaster
        uint256 allowance = token.allowance(userOp.sender, address(this));
        require(allowance >= requiredTokenCost, "ERC20Paymaster: insufficient token allowance");

        // Transfer max tokens from user up front (refund in postOp)
        token.safeTransferFrom(userOp.sender, address(this), requiredTokenCost);

        // Context: encode sender, requiredTokenCost, maxCost for postOp refund
        context = abi.encode(userOp.sender, requiredTokenCost, maxCost);
        validationData = 0; // signature is valid, no time range

        return (context, validationData);
    }

    function _postOp(
        PostOpMode /* mode */,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 /* actualUserOpFeePerGas */
    ) internal override {
        (address sender, uint256 tokensPaid, ) = abi.decode(context, (address, uint256, uint256));

        // Calculate actual token cost
        uint256 actualTokenCost = getTokenCostForGas(actualGasCost);

        // Refund excess tokens
        if (tokensPaid > actualTokenCost) {
            token.safeTransfer(sender, tokensPaid - actualTokenCost);
        }
    }

    // --- Owner can withdraw collected tokens ---

    function withdrawTokens(address to, uint256 amount) external onlyOwner {
        token.safeTransfer(to, amount);
    }
}
