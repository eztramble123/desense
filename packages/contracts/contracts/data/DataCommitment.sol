// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IDataCommitment.sol";
import "../interfaces/IDeSenseAccessControl.sol";
import "../interfaces/IDeviceRegistry.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract DataCommitment is IDataCommitment {
    IDeSenseAccessControl public accessControl;
    IDeviceRegistry public deviceRegistry;

    uint256 public maxSubmissionDelay = 1 hours;

    uint256 private _nextBatchId;

    mapping(uint256 => Batch) private _batches;
    mapping(uint256 => DeviceSLAScore) private _slaScores;
    mapping(uint256 => uint256[]) private _deviceBatches;

    modifier onlyAdmin() {
        require(accessControl.isAdmin(msg.sender), "DataCommitment: caller is not admin");
        _;
    }

    constructor(address _accessControl, address _deviceRegistry) {
        accessControl = IDeSenseAccessControl(_accessControl);
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
            submittedAt: block.timestamp
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
        }

        emit BatchSubmitted(batchId, deviceId, dataRoot, ipfsCid, avgOutput, uptimeBps);
    }

    function setMaxSubmissionDelay(uint256 _delay) external onlyAdmin {
        maxSubmissionDelay = _delay;
    }

    function getBatch(uint256 batchId) external view returns (Batch memory) {
        require(batchId < _nextBatchId, "DataCommitment: batch does not exist");
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
        return _nextBatchId;
    }
}
