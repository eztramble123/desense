// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "../interfaces/IDeviceRegistry.sol";
import "../interfaces/IZeusAccessControl.sol";

contract DeviceRegistry is ERC721Enumerable, IDeviceRegistry {
    IZeusAccessControl public accessControl;
    uint256 private _nextTokenId;

    mapping(uint256 => DeviceMetadata) private _devices;

    modifier onlyOperator() {
        require(accessControl.isOperator(msg.sender), "DeviceRegistry: caller is not operator");
        _;
    }

    modifier onlyAdmin() {
        require(accessControl.isAdmin(msg.sender), "DeviceRegistry: caller is not admin");
        _;
    }

    constructor(address _accessControl) ERC721("Zeus Energy Asset", "ZEUS") {
        accessControl = IZeusAccessControl(_accessControl);
    }

    function registerDevice(
        DeviceType deviceType,
        string calldata location,
        string calldata region,
        uint256 minOutput,
        uint256 maxOutput,
        uint256 samplingRateSeconds,
        uint256 capacity,
        int256 latitude,
        int256 longitude
    ) external onlyOperator returns (uint256 deviceId) {
        deviceId = _nextTokenId++;
        _mint(msg.sender, deviceId);

        _devices[deviceId] = DeviceMetadata({
            deviceType: deviceType,
            status: DeviceStatus.Active,
            location: location,
            region: region,
            minOutput: minOutput,
            maxOutput: maxOutput,
            samplingRateSeconds: samplingRateSeconds,
            operator: msg.sender,
            registeredAt: block.timestamp,
            capacity: capacity,
            latitude: latitude,
            longitude: longitude
        });

        emit DeviceRegistered(deviceId, msg.sender, deviceType, region);
    }

    function setDeviceStatus(uint256 deviceId, DeviceStatus newStatus) external onlyAdmin {
        require(_ownerOf(deviceId) != address(0), "DeviceRegistry: device does not exist");
        DeviceStatus oldStatus = _devices[deviceId].status;
        require(oldStatus != newStatus, "DeviceRegistry: same status");
        _devices[deviceId].status = newStatus;
        emit DeviceStatusChanged(deviceId, oldStatus, newStatus);
    }

    function getDevice(uint256 deviceId) external view returns (DeviceMetadata memory) {
        require(_ownerOf(deviceId) != address(0), "DeviceRegistry: device does not exist");
        return _devices[deviceId];
    }

    function getDevicesByOperator(address operator) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(operator);
        uint256[] memory devices = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            devices[i] = tokenOfOwnerByIndex(operator, i);
        }
        return devices;
    }

    function totalDevices() external view returns (uint256) {
        return totalSupply();
    }
}
