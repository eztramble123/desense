// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDataCommitment {
    struct Batch {
        uint256 deviceId;
        uint256 windowStart;
        uint256 windowEnd;
        bytes32 dataRoot;
        string ipfsCid;
        uint256 avgOutput;
        uint256 uptimeBps; // basis points 0-10000
        address submitter;
        uint256 submittedAt;
        bool disputed;
        string disputeReason;
    }

    struct DeviceSLAScore {
        uint256 totalBatches;
        uint256 cumulativeUptime;    // sum of uptimeBps
        uint256 cumulativeOutput;    // sum of avgOutput
        uint256 freshnessPenalties;
        uint256 lastSubmission;
    }

    event BatchSubmitted(
        uint256 indexed batchId,
        uint256 indexed deviceId,
        bytes32 dataRoot,
        string ipfsCid,
        uint256 avgOutput,
        uint256 uptimeBps
    );

    event FreshnessPenalty(uint256 indexed deviceId, uint256 indexed batchId, uint256 delay);

    event BatchDisputed(uint256 indexed batchId, address indexed auditor, string reason);

    event ReadingVerified(uint256 indexed batchId, bool valid);

    function submitBatch(
        uint256 deviceId,
        uint256 windowStart,
        uint256 windowEnd,
        bytes32 dataRoot,
        string calldata ipfsCid,
        uint256 avgOutput,
        uint256 uptimeBps
    ) external returns (uint256 batchId);

    function verifyReading(
        uint256 batchId,
        bytes32[] calldata proof,
        bytes32 leaf
    ) external view returns (bool);

    function disputeBatch(uint256 batchId, string calldata reason) external;

    function getBatch(uint256 batchId) external view returns (Batch memory);
    function getDeviceSLA(uint256 deviceId) external view returns (DeviceSLAScore memory);
    function getDeviceBatches(uint256 deviceId, uint256 offset, uint256 limit) external view returns (uint256[] memory);
    function getDeviceBatchCount(uint256 deviceId) external view returns (uint256);
    function totalBatches() external view returns (uint256);
    function maxSubmissionDelay() external view returns (uint256);
}
