// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IDeviceRegistry.sol";

interface IDataMarketplace {
    enum OrderStatus { Open, Active, Completed, Cancelled }

    struct DataOrder {
        address buyer;
        IDeviceRegistry.DeviceType deviceType;
        string region;
        uint256 minUptimeBps;
        uint256 minAvgOutput;
        uint256 duration;           // in seconds
        uint256 pricePerBatch;      // ADI per qualifying batch
        uint256 totalEscrow;
        uint256 remainingEscrow;
        uint256 createdAt;
        uint256 expiresAt;
        OrderStatus status;
    }

    event OrderCreated(uint256 indexed orderId, address indexed buyer, uint256 escrow);
    event DeviceMatched(uint256 indexed orderId, uint256 indexed deviceId, address indexed operator);
    event BatchSettled(uint256 indexed orderId, uint256 indexed batchId, uint256 payout);
    event OrderCancelled(uint256 indexed orderId, uint256 refund);

    function createOrder(
        IDeviceRegistry.DeviceType deviceType,
        string calldata region,
        uint256 minUptimeBps,
        uint256 minAvgOutput,
        uint256 duration,
        uint256 pricePerBatch
    ) external payable returns (uint256 orderId);

    function matchDevice(uint256 orderId, uint256 deviceId) external;
    function settleBatch(uint256 orderId, uint256 batchId) external;
    function cancelOrder(uint256 orderId) external;
    function getOrder(uint256 orderId) external view returns (DataOrder memory);
    function getOrderDevices(uint256 orderId) external view returns (uint256[] memory);
    function totalOrders() external view returns (uint256);
}
