import { ethers } from "ethers";
import { config } from "../config";

// ABIs — only the functions we need
const REGISTRY_ABI = [
  "function getDevice(uint256 deviceId) view returns (tuple(uint8 deviceType, uint8 status, string location, string region, uint256 minOutput, uint256 maxOutput, uint256 samplingRateSeconds, address operator, uint256 registeredAt, uint256 capacity, int256 latitude, int256 longitude))",
  "function totalDevices() view returns (uint256)",
  "function getDevicesByOperator(address) view returns (uint256[])",
  "event DeviceRegistered(uint256 indexed deviceId, address indexed operator, uint8 deviceType, string region)",
  "event DeviceStatusChanged(uint256 indexed deviceId, uint8 oldStatus, uint8 newStatus)",
];

const COMMITMENT_ABI = [
  "function getBatch(uint256 batchId) view returns (tuple(uint256 deviceId, uint256 windowStart, uint256 windowEnd, bytes32 dataRoot, string ipfsCid, uint256 avgOutput, uint256 uptimeBps, address submitter, uint256 submittedAt, bool disputed, string disputeReason))",
  "function getDeviceSLA(uint256 deviceId) view returns (tuple(uint256 totalBatches, uint256 cumulativeUptime, uint256 cumulativeOutput, uint256 freshnessPenalties, uint256 lastSubmission))",
  "function totalBatches() view returns (uint256)",
  "function getDeviceBatchCount(uint256 deviceId) view returns (uint256)",
  "function verifyReading(uint256 batchId, bytes32[] proof, bytes32 leaf) view returns (bool)",
  "function submitBatch(uint256 deviceId, uint256 windowStart, uint256 windowEnd, bytes32 dataRoot, string ipfsCid, uint256 avgOutput, uint256 uptimeBps) returns (uint256)",
  "event BatchSubmitted(uint256 indexed batchId, uint256 indexed deviceId, bytes32 dataRoot, string ipfsCid, uint256 avgOutput, uint256 uptimeBps)",
  "event FreshnessPenalty(uint256 indexed deviceId, uint256 indexed batchId, uint256 delay)",
  "event BatchDisputed(uint256 indexed batchId, address indexed auditor, string reason)",
];

const TRIGGER_ABI = [
  "function getTrigger(uint256 triggerId) view returns (tuple(address creator, address beneficiary, uint256 deviceId, uint8 triggerType, uint256 threshold, uint256 observationPeriod, uint256 requiredStreak, uint256 currentStreak, uint256 escrowedPayout, uint8 status, uint256 createdAt, uint256 expiresAt, uint256 lastEvaluatedBatch))",
  "function totalTriggers() view returns (uint256)",
  "function evaluate(uint256 triggerId, uint256 batchId)",
  "event TriggerCreated(uint256 indexed triggerId, address indexed creator, uint256 indexed deviceId, uint256 payout)",
  "event TriggerEvaluated(uint256 indexed triggerId, uint256 batchId, bool qualifying, uint256 currentStreak)",
  "event TriggerActivated(uint256 indexed triggerId, address indexed beneficiary, uint256 payout)",
];

const MARKETPLACE_ABI = [
  "function getOrder(uint256 orderId) view returns (tuple(address buyer, uint8 deviceType, string region, uint256 minUptimeBps, uint256 minAvgOutput, uint256 duration, uint256 pricePerBatch, uint256 totalEscrow, uint256 remainingEscrow, uint256 createdAt, uint256 expiresAt, uint8 status))",
  "function totalOrders() view returns (uint256)",
  "function settleBatch(uint256 orderId, uint256 batchId)",
  "function getOrderDevices(uint256 orderId) view returns (uint256[])",
  "function isBatchSettled(uint256 orderId, uint256 batchId) view returns (bool)",
  "event OrderCreated(uint256 indexed orderId, address indexed buyer, uint256 escrow)",
  "event DeviceMatched(uint256 indexed orderId, uint256 indexed deviceId, address indexed operator)",
  "event BatchSettled(uint256 indexed orderId, uint256 indexed batchId, uint256 payout)",
];

let provider: ethers.JsonRpcProvider;
let wallet: ethers.Wallet;
let registry: ethers.Contract;
let commitment: ethers.Contract;
let trigger: ethers.Contract;
let marketplace: ethers.Contract;

export function initChain() {
  provider = new ethers.JsonRpcProvider(config.rpcUrl);

  if (config.privateKey) {
    wallet = new ethers.Wallet(config.privateKey, provider);
  }

  const signer = wallet || provider;
  registry = new ethers.Contract(config.contracts.deviceRegistry, REGISTRY_ABI, signer);
  commitment = new ethers.Contract(config.contracts.dataCommitment, COMMITMENT_ABI, signer);
  trigger = new ethers.Contract(config.contracts.financingTrigger, TRIGGER_ABI, signer);
  marketplace = new ethers.Contract(config.contracts.dataMarketplace, MARKETPLACE_ABI, signer);
}

export function getProvider() { return provider; }
export function getWallet() { return wallet; }
export function getRegistry() { return registry; }
export function getCommitment() { return commitment; }
export function getTrigger() { return trigger; }
export function getMarketplace() { return marketplace; }

// Read a device from chain
export async function fetchDeviceFromChain(deviceId: number) {
  const device = await registry.getDevice(deviceId);
  return {
    deviceId,
    deviceType: Number(device.deviceType),
    status: Number(device.status),
    location: device.location,
    region: device.region,
    minOutput: Number(device.minOutput),
    maxOutput: Number(device.maxOutput),
    samplingRateSeconds: Number(device.samplingRateSeconds),
    operator: device.operator,
    registeredAt: Number(device.registeredAt),
    capacity: Number(device.capacity),
    latitude: Number(device.latitude) / 1e6,
    longitude: Number(device.longitude) / 1e6,
  };
}

// Read a batch from chain
export async function fetchBatchFromChain(batchId: number) {
  const batch = await commitment.getBatch(batchId);
  return {
    batchId,
    deviceId: Number(batch.deviceId),
    windowStart: Number(batch.windowStart),
    windowEnd: Number(batch.windowEnd),
    dataRoot: batch.dataRoot,
    ipfsCid: batch.ipfsCid,
    avgOutput: Number(batch.avgOutput),
    uptimeBps: Number(batch.uptimeBps),
    submitter: batch.submitter,
    submittedAt: Number(batch.submittedAt),
    disputed: batch.disputed,
    disputeReason: batch.disputeReason,
  };
}

// Read SLA from chain
export async function fetchSLAFromChain(deviceId: number) {
  const sla = await commitment.getDeviceSLA(deviceId);
  return {
    totalBatches: Number(sla.totalBatches),
    cumulativeUptime: Number(sla.cumulativeUptime),
    cumulativeOutput: Number(sla.cumulativeOutput),
    freshnessPenalties: Number(sla.freshnessPenalties),
    lastSubmission: Number(sla.lastSubmission),
  };
}

// Verify reading on-chain
export async function verifyReadingOnChain(batchId: number, proof: string[], leaf: string): Promise<boolean> {
  return await commitment.verifyReading(batchId, proof, leaf);
}
