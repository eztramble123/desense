// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./base/BasePaymaster.sol";
import "./lib/SponsorSigner.sol";

/**
 * @title NativePaymaster
 * @notice Sponsors gas from native ADI balance using EIP-712 signed sponsorship approvals.
 *
 * paymasterAndData layout:
 *   [0:20]   paymaster address (handled by EntryPoint)
 *   [20:26]  validUntil (uint48, big-endian)
 *   [26:32]  validAfter  (uint48, big-endian)
 *   [32:97]  sponsor signature (65 bytes: r[32] + s[32] + v[1])
 */
contract NativePaymaster is BasePaymaster {
    using SponsorSigner for SponsorSigner.SponsorshipData;

    address public sponsorSigner;

    mapping(address => uint256) public senderSpendLimit;
    mapping(address => uint256) public senderSpent;

    event SponsorSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event SpendLimitSet(address indexed sender, uint256 limit);

    constructor(
        address _entryPoint,
        address _owner
    ) BasePaymaster(_entryPoint, _owner) {}

    // --- Configuration ---

    function setSponsorSigner(address _signer) external onlyOwner {
        emit SponsorSignerUpdated(sponsorSigner, _signer);
        sponsorSigner = _signer;
    }

    function setSpendLimit(address sender, uint256 limit) external onlyOwner {
        senderSpendLimit[sender] = limit;
        emit SpendLimitSet(sender, limit);
    }

    // --- Paymaster validation ---

    function _validatePaymasterUserOp(
        IEntryPoint.PackedUserOperation calldata userOp,
        bytes32 /* userOpHash */,
        uint256 maxCost
    ) internal view override returns (bytes memory context, uint256 validationData) {
        // Parse paymasterAndData (after the 20-byte address prefix stripped by EntryPoint)
        bytes calldata pData = userOp.paymasterAndData;
        require(pData.length >= 97, "NativePaymaster: invalid paymasterAndData length");

        // Skip first 20 bytes (paymaster address, included by convention)
        uint48 validUntil = uint48(bytes6(pData[20:26]));
        uint48 validAfter = uint48(bytes6(pData[26:32]));
        bytes calldata signature = pData[32:97];

        // Verify sponsorship signature
        SponsorSigner.SponsorshipData memory sponsorship = SponsorSigner.SponsorshipData({
            sender: userOp.sender,
            nonce: userOp.nonce,
            validUntil: validUntil,
            validAfter: validAfter
        });

        bool valid = SponsorSigner.verifySponsorSignature(
            sponsorship,
            signature,
            sponsorSigner,
            address(this)
        );
        require(valid, "NativePaymaster: invalid sponsor signature");

        // Check spend limits if set
        uint256 limit = senderSpendLimit[userOp.sender];
        if (limit > 0) {
            require(senderSpent[userOp.sender] + maxCost <= limit, "NativePaymaster: spend limit exceeded");
        }

        // Pack validation data: [validUntil (6B)][validAfter (6B)][authorizer (20B)]
        // authorizer = 0 means signature is valid
        validationData = (uint256(validUntil) << 160) | (uint256(validAfter) << 208);

        // Context: encode sender + maxCost for postOp accounting
        context = abi.encode(userOp.sender, maxCost);

        return (context, validationData);
    }

    function _postOp(
        PostOpMode /* mode */,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 /* actualUserOpFeePerGas */
    ) internal override {
        (address sender, ) = abi.decode(context, (address, uint256));
        senderSpent[sender] += actualGasCost;
    }
}
