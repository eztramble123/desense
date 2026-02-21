// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title SponsorSigner
 * @notice EIP-712 typed data verification for sponsorship authorization
 */
library SponsorSigner {
    using ECDSA for bytes32;

    struct SponsorshipData {
        address sender;
        uint256 nonce;
        uint48 validUntil;
        uint48 validAfter;
    }

    bytes32 internal constant SPONSORSHIP_TYPEHASH =
        keccak256("SponsorshipData(address sender,uint256 nonce,uint48 validUntil,uint48 validAfter)");

    bytes32 internal constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    function domainSeparator(address verifyingContract) internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256("DeSensePaymaster"),
                keccak256("1"),
                block.chainid,
                verifyingContract
            )
        );
    }

    function hashSponsorshipData(SponsorshipData memory data) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                SPONSORSHIP_TYPEHASH,
                data.sender,
                data.nonce,
                data.validUntil,
                data.validAfter
            )
        );
    }

    function verifySponsorSignature(
        SponsorshipData memory data,
        bytes memory signature,
        address expectedSigner,
        address verifyingContract
    ) internal view returns (bool) {
        bytes32 digest = MessageHashUtils.toTypedDataHash(
            domainSeparator(verifyingContract),
            hashSponsorshipData(data)
        );
        address recovered = ECDSA.recover(digest, signature);
        return recovered == expectedSigner;
    }
}
