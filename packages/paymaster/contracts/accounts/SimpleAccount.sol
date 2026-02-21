// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../base/BasePaymaster.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SimpleAccount
 * @notice Minimal ERC-4337 smart account — validates owner signature on UserOps
 */
contract SimpleAccount is IAccount, Initializable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public owner;
    IEntryPoint public entryPoint;

    event SimpleAccountInitialized(address indexed entryPoint, address indexed owner);

    modifier onlyOwnerOrEntryPoint() {
        require(
            msg.sender == owner || msg.sender == address(entryPoint),
            "SimpleAccount: not owner or EntryPoint"
        );
        _;
    }

    constructor(address _entryPoint) {
        entryPoint = IEntryPoint(_entryPoint);
        _disableInitializers();
    }

    function initialize(address _owner) external initializer {
        owner = _owner;
        emit SimpleAccountInitialized(address(entryPoint), _owner);
    }

    // --- ERC-4337 validation ---

    function validateUserOp(
        IEntryPoint.PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override returns (uint256 validationData) {
        require(msg.sender == address(entryPoint), "SimpleAccount: not from EntryPoint");

        // Verify owner signature
        bytes32 ethSignedHash = userOpHash.toEthSignedMessageHash();
        address recovered = ethSignedHash.recover(userOp.signature);

        if (recovered != owner) {
            return 1; // SIG_VALIDATION_FAILED
        }

        // Pay prefund if needed
        if (missingAccountFunds > 0) {
            (bool success, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            require(success, "SimpleAccount: prefund failed");
        }

        return 0; // validation success
    }

    // --- Execution ---

    function execute(address dest, uint256 value, bytes calldata data) external onlyOwnerOrEntryPoint {
        (bool success, bytes memory result) = dest.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    function executeBatch(
        address[] calldata dest,
        uint256[] calldata values,
        bytes[] calldata data
    ) external onlyOwnerOrEntryPoint {
        require(dest.length == values.length && dest.length == data.length, "SimpleAccount: length mismatch");
        for (uint256 i = 0; i < dest.length; i++) {
            (bool success, bytes memory result) = dest[i].call{value: values[i]}(data[i]);
            if (!success) {
                assembly {
                    revert(add(result, 32), mload(result))
                }
            }
        }
    }

    // --- Token approvals (helper for ERC20 paymaster) ---

    function approveToken(IERC20 token, address spender, uint256 amount) external onlyOwnerOrEntryPoint {
        token.approve(spender, amount);
    }

    // --- Receive native tokens ---

    receive() external payable {}
}
