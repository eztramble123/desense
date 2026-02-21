// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IFinancingTrigger {
    enum TriggerType { OutputAbove, OutputBelow, UptimeAbove, UptimeBelow }
    enum TriggerStatus { Active, Triggered, Expired, Cancelled }

    struct Trigger {
        address creator;
        address beneficiary;
        uint256 deviceId;
        TriggerType triggerType;
        uint256 threshold;
        uint256 observationPeriod;  // seconds
        uint256 requiredStreak;     // consecutive qualifying batches
        uint256 currentStreak;
        uint256 escrowedPayout;
        TriggerStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        uint256 lastEvaluatedBatch;
    }

    event TriggerCreated(uint256 indexed triggerId, address indexed creator, uint256 indexed deviceId, uint256 payout);
    event TriggerEvaluated(uint256 indexed triggerId, uint256 batchId, bool qualifying, uint256 currentStreak);
    event TriggerActivated(uint256 indexed triggerId, address indexed beneficiary, uint256 payout);
    event TriggerExpired(uint256 indexed triggerId, uint256 refund);
    event TriggerCancelled(uint256 indexed triggerId, uint256 refund);

    function createTrigger(
        address beneficiary,
        uint256 deviceId,
        TriggerType triggerType,
        uint256 threshold,
        uint256 observationPeriod,
        uint256 requiredStreak
    ) external payable returns (uint256 triggerId);

    function evaluate(uint256 triggerId, uint256 batchId) external;
    function cancelTrigger(uint256 triggerId) external;
    function getTrigger(uint256 triggerId) external view returns (Trigger memory);
    function totalTriggers() external view returns (uint256);
}
