// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IEntryPoint
 * @notice Minimal interface for ERC-4337 EntryPoint v0.7
 */
interface IEntryPoint {
    struct PackedUserOperation {
        address sender;
        uint256 nonce;
        bytes initCode;
        bytes callData;
        bytes32 accountGasLimits;
        uint256 preVerificationGas;
        bytes32 gasFees;
        bytes paymasterAndData;
        bytes signature;
    }

    function handleOps(PackedUserOperation[] calldata ops, address payable beneficiary) external;
    function getUserOpHash(PackedUserOperation calldata userOp) external view returns (bytes32);
    function balanceOf(address account) external view returns (uint256);
    function depositTo(address account) external payable;
    function getNonce(address sender, uint192 key) external view returns (uint256);
}

/**
 * @title IAccount
 * @notice Minimal ERC-4337 account interface
 */
interface IAccount {
    function validateUserOp(
        IEntryPoint.PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);
}

/**
 * @title IPaymaster
 * @notice ERC-4337 v0.7 Paymaster interface
 */
interface IPaymaster {
    function validatePaymasterUserOp(
        IEntryPoint.PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external returns (bytes memory context, uint256 validationData);

    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external;

    enum PostOpMode {
        opSucceeded,
        opReverted,
        postOpReverted
    }
}

/**
 * @title BasePaymaster
 * @notice Abstract base paymaster with EntryPoint integration
 */
abstract contract BasePaymaster is IPaymaster, Ownable {
    IEntryPoint public immutable entryPoint;

    constructor(address _entryPoint, address _owner) Ownable(_owner) {
        entryPoint = IEntryPoint(_entryPoint);
    }

    // --- EntryPoint stake management ---

    function deposit() external payable {
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    function withdrawTo(address payable to, uint256 amount) external onlyOwner {
        (bool success, ) = address(entryPoint).call(
            abi.encodeWithSignature("withdrawTo(address,uint256)", to, amount)
        );
        require(success, "BasePaymaster: withdraw failed");
    }

    function getDeposit() public view returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    // --- IPaymaster implementation ---

    function validatePaymasterUserOp(
        IEntryPoint.PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external override returns (bytes memory context, uint256 validationData) {
        require(msg.sender == address(entryPoint), "BasePaymaster: not from EntryPoint");
        return _validatePaymasterUserOp(userOp, userOpHash, maxCost);
    }

    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external override {
        require(msg.sender == address(entryPoint), "BasePaymaster: not from EntryPoint");
        _postOp(mode, context, actualGasCost, actualUserOpFeePerGas);
    }

    // --- Virtual functions for subclasses ---

    function _validatePaymasterUserOp(
        IEntryPoint.PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal virtual returns (bytes memory context, uint256 validationData);

    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) internal virtual {
        // Default: no-op
    }

    receive() external payable {
        // Allow receiving native tokens for deposits
    }
}
