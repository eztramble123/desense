// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IDataMarketplace.sol";
import "../interfaces/IDeSenseAccessControl.sol";
import "../interfaces/IDeviceRegistry.sol";
import "../interfaces/IDataCommitment.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract DataMarketplace is IDataMarketplace {
    IDeSenseAccessControl public accessControl;
    IDeviceRegistry public deviceRegistry;
    IDataCommitment public dataCommitment;

    uint256 private _nextOrderId;

    mapping(uint256 => DataOrder) private _orders;
    mapping(uint256 => uint256[]) private _orderDevices;
    mapping(uint256 => mapping(uint256 => bool)) private _deviceInOrder;
    mapping(uint256 => mapping(uint256 => bool)) private _batchSettled; // orderId => batchId => settled

    modifier onlyBuyer() {
        require(accessControl.isBuyer(msg.sender), "DataMarketplace: caller is not buyer");
        _;
    }

    constructor(address _accessControl, address _deviceRegistry, address _dataCommitment) {
        accessControl = IDeSenseAccessControl(_accessControl);
        deviceRegistry = IDeviceRegistry(_deviceRegistry);
        dataCommitment = IDataCommitment(_dataCommitment);
    }

    function createOrder(
        IDeviceRegistry.DeviceType deviceType,
        string calldata region,
        uint256 minUptimeBps,
        uint256 minAvgOutput,
        uint256 duration,
        uint256 pricePerBatch
    ) external payable onlyBuyer returns (uint256 orderId) {
        require(msg.value > 0, "DataMarketplace: no escrow");
        require(duration > 0, "DataMarketplace: zero duration");
        require(pricePerBatch > 0, "DataMarketplace: zero price");
        require(minUptimeBps <= 10000, "DataMarketplace: invalid uptime threshold");

        orderId = _nextOrderId++;

        _orders[orderId] = DataOrder({
            buyer: msg.sender,
            deviceType: deviceType,
            region: region,
            minUptimeBps: minUptimeBps,
            minAvgOutput: minAvgOutput,
            duration: duration,
            pricePerBatch: pricePerBatch,
            totalEscrow: msg.value,
            remainingEscrow: msg.value,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + duration,
            status: OrderStatus.Open
        });

        emit OrderCreated(orderId, msg.sender, msg.value);
    }

    function matchDevice(uint256 orderId, uint256 deviceId) external {
        DataOrder storage order = _orders[orderId];
        require(order.status == OrderStatus.Open || order.status == OrderStatus.Active, "DataMarketplace: order not open");
        require(block.timestamp < order.expiresAt, "DataMarketplace: order expired");
        require(!_deviceInOrder[orderId][deviceId], "DataMarketplace: device already matched");

        require(
            IERC721(address(deviceRegistry)).ownerOf(deviceId) == msg.sender,
            "DataMarketplace: caller is not device owner"
        );
        require(accessControl.isOperator(msg.sender), "DataMarketplace: caller is not operator");

        IDeviceRegistry.DeviceMetadata memory device = deviceRegistry.getDevice(deviceId);
        require(device.status == IDeviceRegistry.DeviceStatus.Active, "DataMarketplace: device not active");
        require(device.deviceType == order.deviceType, "DataMarketplace: device type mismatch");
        require(
            keccak256(bytes(device.region)) == keccak256(bytes(order.region)),
            "DataMarketplace: region mismatch"
        );

        _orderDevices[orderId].push(deviceId);
        _deviceInOrder[orderId][deviceId] = true;

        if (order.status == OrderStatus.Open) {
            order.status = OrderStatus.Active;
        }

        emit DeviceMatched(orderId, deviceId, msg.sender);
    }

    function settleBatch(uint256 orderId, uint256 batchId) external {
        DataOrder storage order = _orders[orderId];
        require(order.status == OrderStatus.Active, "DataMarketplace: order not active");
        require(order.remainingEscrow >= order.pricePerBatch, "DataMarketplace: insufficient escrow");
        require(!_batchSettled[orderId][batchId], "DataMarketplace: batch already settled");

        IDataCommitment.Batch memory batch = dataCommitment.getBatch(batchId);

        require(_deviceInOrder[orderId][batch.deviceId], "DataMarketplace: device not in order");
        require(batch.uptimeBps >= order.minUptimeBps, "DataMarketplace: uptime below threshold");
        require(batch.avgOutput >= order.minAvgOutput, "DataMarketplace: output below threshold");

        _batchSettled[orderId][batchId] = true;

        order.remainingEscrow -= order.pricePerBatch;

        (bool success, ) = payable(batch.submitter).call{value: order.pricePerBatch}("");
        require(success, "DataMarketplace: payment failed");

        if (order.remainingEscrow < order.pricePerBatch || block.timestamp >= order.expiresAt) {
            order.status = OrderStatus.Completed;
        }

        emit BatchSettled(orderId, batchId, order.pricePerBatch);
    }

    function cancelOrder(uint256 orderId) external {
        DataOrder storage order = _orders[orderId];
        require(order.buyer == msg.sender, "DataMarketplace: caller is not buyer");
        require(order.status == OrderStatus.Open, "DataMarketplace: order not open");

        uint256 refund = order.remainingEscrow;
        order.remainingEscrow = 0;
        order.status = OrderStatus.Cancelled;

        (bool success, ) = payable(msg.sender).call{value: refund}("");
        require(success, "DataMarketplace: refund failed");

        emit OrderCancelled(orderId, refund);
    }

    function getOrder(uint256 orderId) external view returns (DataOrder memory) {
        return _orders[orderId];
    }

    function getOrderDevices(uint256 orderId) external view returns (uint256[] memory) {
        return _orderDevices[orderId];
    }

    function isBatchSettled(uint256 orderId, uint256 batchId) external view returns (bool) {
        return _batchSettled[orderId][batchId];
    }

    function totalOrders() external view returns (uint256) {
        return _nextOrderId;
    }
}
