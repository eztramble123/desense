// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IDataCommitment.sol";
import "../interfaces/IZeusAccessControl.sol";
import "../interfaces/IDeviceRegistry.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract DataCommitment is IDataCommitment {
    IZeusAccessControl public accessControl;
    IDeviceRegistry public deviceRegistry;

    uint256 public maxSubmissionDelay = 1 hours;

    // Start from 1 so batchId=0 is never valid (fixes FinancingTrigger guard)
    uint256 private _nextBatchId = 1;

    mapping(uint256 => Batch) private _batches;
    mapping(uint256 => DeviceSLAScore) private _slaScores;
    mapping(uint256 => uint256[]) private _deviceBatches;

    // deviceId => windowStart => true (duplicate window guard)
    mapping(uint256 => mapping(uint256 => bool)) private _windowUsed;

    modifier onlyAdmin() {
        require(accessControl.isAdmin(msg.sender), "DataCommitment: caller is not admin");
        _;
    }

    constructor(address _accessControl, address _deviceRegistry) {
        accessControl = IZeusAccessControl(_accessControl);
        deviceRegistry = IDeviceRegistry(_deviceRegistry);
    }

    function submitBatch(
        uint256 deviceId,
        uint256 windowStart,
        uint256 windowEnd,
        bytes32 dataRoot,
        string calldata ipfsCid,
        uint256 avgOutput,
        uint256 uptimeBps
    ) external returns (uint256 batchId) {
        require(accessControl.isOperator(msg.sender), "DataCommitment: caller is not operator");
        require(
            IERC721(address(deviceRegistry)).ownerOf(deviceId) == msg.sender,
            "DataCommitment: caller is not device owner"
        );

        IDeviceRegistry.DeviceMetadata memory device = deviceRegistry.getDevice(deviceId);
        require(device.status == IDeviceRegistry.DeviceStatus.Active, "DataCommitment: device not active");
        require(windowEnd > windowStart, "DataCommitment: invalid window");
        require(uptimeBps <= 10000, "DataCommitment: uptime exceeds 100%");
        require(dataRoot != bytes32(0), "DataCommitment: empty data root");

        // Duplicate window check
        require(!_windowUsed[deviceId][windowStart], "DataCommitment: duplicate window");
        _windowUsed[deviceId][windowStart] = true;

        batchId = _nextBatchId++;

        _batches[batchId] = Batch({
            deviceId: deviceId,
            windowStart: windowStart,
            windowEnd: windowEnd,
            dataRoot: dataRoot,
            ipfsCid: ipfsCid,
            avgOutput: avgOutput,
            uptimeBps: uptimeBps,
            submitter: msg.sender,
            submittedAt: block.timestamp,
            disputed: false,
            disputeReason: ""
        });

        _deviceBatches[deviceId].push(batchId);

        // Update SLA score
        DeviceSLAScore storage sla = _slaScores[deviceId];
        sla.totalBatches++;
        sla.cumulativeUptime += uptimeBps;
        sla.cumulativeOutput += avgOutput;
        sla.lastSubmission = block.timestamp;

        // Freshness penalty
        if (block.timestamp > windowEnd + maxSubmissionDelay) {
            sla.freshnessPenalties++;
            uint256 delay = block.timestamp - windowEnd;
            emit FreshnessPenalty(deviceId, batchId, delay);
        }

        emit BatchSubmitted(batchId, deviceId, dataRoot, ipfsCid, avgOutput, uptimeBps);
    }

    function verifyReading(
        uint256 batchId,
        bytes32[] calldata proof,
        bytes32 leaf
    ) external view returns (bool) {
        require(batchId > 0 && batchId < _nextBatchId, "DataCommitment: batch does not exist");
        Batch storage batch = _batches[batchId];
        return MerkleProof.verify(proof, batch.dataRoot, leaf);
    }

    function disputeBatch(uint256 batchId, string calldata reason) external {
        require(accessControl.isAuditor(msg.sender), "DataCommitment: caller is not auditor");
        require(batchId > 0 && batchId < _nextBatchId, "DataCommitment: batch does not exist");

        Batch storage batch = _batches[batchId];
        require(!batch.disputed, "DataCommitment: already disputed");

        batch.disputed = true;
        batch.disputeReason = reason;

        // Revert SLA contribution
        DeviceSLAScore storage sla = _slaScores[batch.deviceId];
        if (sla.totalBatches > 0) {
            sla.totalBatches--;
            sla.cumulativeUptime -= batch.uptimeBps;
            sla.cumulativeOutput -= batch.avgOutput;
        }

        emit BatchDisputed(batchId, msg.sender, reason);
    }

    function setMaxSubmissionDelay(uint256 _delay) external onlyAdmin {
        maxSubmissionDelay = _delay;
    }

    function getBatch(uint256 batchId) external view returns (Batch memory) {
        require(batchId > 0 && batchId < _nextBatchId, "DataCommitment: batch does not exist");
        return _batches[batchId];
    }

    function getDeviceSLA(uint256 deviceId) external view returns (DeviceSLAScore memory) {
        return _slaScores[deviceId];
    }

    function getDeviceBatches(uint256 deviceId, uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] storage allBatches = _deviceBatches[deviceId];
        uint256 total = allBatches.length;

        if (offset >= total) {
            return new uint256[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256[] memory result = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = allBatches[i];
        }
        return result;
    }

    function getDeviceBatchCount(uint256 deviceId) external view returns (uint256) {
        return _deviceBatches[deviceId].length;
    }

    function totalBatches() external view returns (uint256) {
        // Subtract 1 since _nextBatchId starts at 1
        return _nextBatchId - 1;
    }
}
