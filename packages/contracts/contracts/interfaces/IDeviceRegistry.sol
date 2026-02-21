// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDeviceRegistry {
    enum DeviceType { SolarPanel, PowerMeter, Transformer, WindTurbine }
    enum DeviceStatus { Pending, Active, Suspended, Decommissioned }

    struct DeviceMetadata {
        DeviceType deviceType;
        DeviceStatus status;
        string location;
        string region;
        uint256 minOutput;
        uint256 maxOutput;
        uint256 samplingRateSeconds;
        address operator;
        uint256 registeredAt;
    }

    event DeviceRegistered(uint256 indexed deviceId, address indexed operator, DeviceType deviceType, string region);
    event DeviceStatusChanged(uint256 indexed deviceId, DeviceStatus oldStatus, DeviceStatus newStatus);

    function registerDevice(
        DeviceType deviceType,
        string calldata location,
        string calldata region,
        uint256 minOutput,
        uint256 maxOutput,
        uint256 samplingRateSeconds
    ) external returns (uint256 deviceId);

    function setDeviceStatus(uint256 deviceId, DeviceStatus newStatus) external;
    function getDevice(uint256 deviceId) external view returns (DeviceMetadata memory);
    function getDevicesByOperator(address operator) external view returns (uint256[] memory);
    function totalDevices() external view returns (uint256);
}
