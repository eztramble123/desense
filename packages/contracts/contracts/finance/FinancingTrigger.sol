// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IFinancingTrigger.sol";
import "../interfaces/IZeusAccessControl.sol";
import "../interfaces/IDataCommitment.sol";

contract FinancingTrigger is IFinancingTrigger {
    IZeusAccessControl public accessControl;
    IDataCommitment public dataCommitment;

    uint256 private _nextTriggerId;

    mapping(uint256 => Trigger) private _triggers;

    constructor(address _accessControl, address _dataCommitment) {
        accessControl = IZeusAccessControl(_accessControl);
        dataCommitment = IDataCommitment(_dataCommitment);
    }

    function createTrigger(
        address beneficiary,
        uint256 deviceId,
        TriggerType triggerType,
        uint256 threshold,
        uint256 observationPeriod,
        uint256 requiredStreak
    ) external payable returns (uint256 triggerId) {
        require(msg.value > 0, "FinancingTrigger: no payout escrowed");
        require(beneficiary != address(0), "FinancingTrigger: zero beneficiary");
        require(requiredStreak > 0, "FinancingTrigger: zero streak");
        require(observationPeriod > 0, "FinancingTrigger: zero observation period");

        triggerId = _nextTriggerId++;

        _triggers[triggerId] = Trigger({
            creator: msg.sender,
            beneficiary: beneficiary,
            deviceId: deviceId,
            triggerType: triggerType,
            threshold: threshold,
            observationPeriod: observationPeriod,
            requiredStreak: requiredStreak,
            currentStreak: 0,
            escrowedPayout: msg.value,
            status: TriggerStatus.Active,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + observationPeriod,
            lastEvaluatedBatch: 0
        });

        emit TriggerCreated(triggerId, msg.sender, deviceId, msg.value);
    }

    function evaluate(uint256 triggerId, uint256 batchId) external {
        Trigger storage trigger = _triggers[triggerId];
        require(trigger.status == TriggerStatus.Active, "FinancingTrigger: trigger not active");

        // Check expiration
        if (block.timestamp >= trigger.expiresAt) {
            trigger.status = TriggerStatus.Expired;
            uint256 refund = trigger.escrowedPayout;
            trigger.escrowedPayout = 0;

            (bool success, ) = payable(trigger.creator).call{value: refund}("");
            require(success, "FinancingTrigger: refund failed");

            emit TriggerExpired(triggerId, refund);
            return;
        }

        // batchId starts at 1 in DataCommitment, so this guard works correctly:
        // lastEvaluatedBatch=0 means no batch evaluated yet, any batchId >= 1 passes
        require(batchId > trigger.lastEvaluatedBatch,
            "FinancingTrigger: batch already evaluated");

        IDataCommitment.Batch memory batch = dataCommitment.getBatch(batchId);
        require(batch.deviceId == trigger.deviceId, "FinancingTrigger: wrong device");

        // Disputed batches don't count
        require(!batch.disputed, "FinancingTrigger: batch is disputed");

        trigger.lastEvaluatedBatch = batchId;

        bool qualifying = _isQualifying(trigger, batch);

        if (qualifying) {
            trigger.currentStreak++;
        } else {
            trigger.currentStreak = 0;
        }

        emit TriggerEvaluated(triggerId, batchId, qualifying, trigger.currentStreak);

        // Check if streak requirement met
        if (trigger.currentStreak >= trigger.requiredStreak) {
            trigger.status = TriggerStatus.Triggered;
            uint256 payout = trigger.escrowedPayout;
            trigger.escrowedPayout = 0;

            (bool success, ) = payable(trigger.beneficiary).call{value: payout}("");
            require(success, "FinancingTrigger: payout failed");

            emit TriggerActivated(triggerId, trigger.beneficiary, payout);
        }
    }

    function cancelTrigger(uint256 triggerId) external {
        Trigger storage trigger = _triggers[triggerId];
        require(trigger.creator == msg.sender, "FinancingTrigger: caller is not creator");
        require(trigger.status == TriggerStatus.Active, "FinancingTrigger: trigger not active");

        trigger.status = TriggerStatus.Cancelled;
        uint256 refund = trigger.escrowedPayout;
        trigger.escrowedPayout = 0;

        (bool success, ) = payable(msg.sender).call{value: refund}("");
        require(success, "FinancingTrigger: refund failed");

        emit TriggerCancelled(triggerId, refund);
    }

    function getTrigger(uint256 triggerId) external view returns (Trigger memory) {
        return _triggers[triggerId];
    }

    function totalTriggers() external view returns (uint256) {
        return _nextTriggerId;
    }

    function _isQualifying(Trigger storage trigger, IDataCommitment.Batch memory batch) internal view returns (bool) {
        if (trigger.triggerType == TriggerType.OutputAbove) {
            return batch.avgOutput >= trigger.threshold;
        } else if (trigger.triggerType == TriggerType.OutputBelow) {
            return batch.avgOutput <= trigger.threshold;
        } else if (trigger.triggerType == TriggerType.UptimeAbove) {
            return batch.uptimeBps >= trigger.threshold;
        } else {
            return batch.uptimeBps <= trigger.threshold;
        }
    }
}
