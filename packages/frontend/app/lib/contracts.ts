// Contract addresses - set these after deployment
export const CONTRACTS = {
  accessControl: (process.env.NEXT_PUBLIC_ACCESS_CONTROL || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  deviceRegistry: (process.env.NEXT_PUBLIC_DEVICE_REGISTRY || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  dataCommitment: (process.env.NEXT_PUBLIC_DATA_COMMITMENT || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  dataMarketplace: (process.env.NEXT_PUBLIC_DATA_MARKETPLACE || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  financingTrigger: (process.env.NEXT_PUBLIC_FINANCING_TRIGGER || "0x0000000000000000000000000000000000000000") as `0x${string}`,
};

// ABIs
export const ACCESS_CONTROL_ABI = [
  { type: "function", name: "isAdmin", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "isOperator", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "isBuyer", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "isAuditor", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "grantOperatorRole", inputs: [{ name: "account", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "grantBuyerRole", inputs: [{ name: "account", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "grantAuditorRole", inputs: [{ name: "account", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "revokeOperatorRole", inputs: [{ name: "account", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "revokeBuyerRole", inputs: [{ name: "account", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "revokeAuditorRole", inputs: [{ name: "account", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "OPERATOR_ROLE", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "BUYER_ROLE", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "AUDITOR_ROLE", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
] as const;

export const DEVICE_REGISTRY_ABI = [
  { type: "function", name: "registerDevice", inputs: [{ name: "deviceType", type: "uint8" }, { name: "location", type: "string" }, { name: "region", type: "string" }, { name: "minOutput", type: "uint256" }, { name: "maxOutput", type: "uint256" }, { name: "samplingRateSeconds", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "setDeviceStatus", inputs: [{ name: "deviceId", type: "uint256" }, { name: "newStatus", type: "uint8" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "getDevice", inputs: [{ name: "deviceId", type: "uint256" }], outputs: [{ type: "tuple", name: "", components: [{ name: "deviceType", type: "uint8" }, { name: "status", type: "uint8" }, { name: "location", type: "string" }, { name: "region", type: "string" }, { name: "minOutput", type: "uint256" }, { name: "maxOutput", type: "uint256" }, { name: "samplingRateSeconds", type: "uint256" }, { name: "operator", type: "address" }, { name: "registeredAt", type: "uint256" }] }], stateMutability: "view" },
  { type: "function", name: "getDevicesByOperator", inputs: [{ name: "operator", type: "address" }], outputs: [{ type: "uint256[]" }], stateMutability: "view" },
  { type: "function", name: "totalDevices", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "ownerOf", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "event", name: "DeviceRegistered", inputs: [{ name: "deviceId", type: "uint256", indexed: true }, { name: "operator", type: "address", indexed: true }, { name: "deviceType", type: "uint8", indexed: false }, { name: "region", type: "string", indexed: false }] },
] as const;

export const DATA_COMMITMENT_ABI = [
  { type: "function", name: "submitBatch", inputs: [{ name: "deviceId", type: "uint256" }, { name: "windowStart", type: "uint256" }, { name: "windowEnd", type: "uint256" }, { name: "dataRoot", type: "bytes32" }, { name: "ipfsCid", type: "string" }, { name: "avgOutput", type: "uint256" }, { name: "uptimeBps", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "getBatch", inputs: [{ name: "batchId", type: "uint256" }], outputs: [{ type: "tuple", name: "", components: [{ name: "deviceId", type: "uint256" }, { name: "windowStart", type: "uint256" }, { name: "windowEnd", type: "uint256" }, { name: "dataRoot", type: "bytes32" }, { name: "ipfsCid", type: "string" }, { name: "avgOutput", type: "uint256" }, { name: "uptimeBps", type: "uint256" }, { name: "submitter", type: "address" }, { name: "submittedAt", type: "uint256" }] }], stateMutability: "view" },
  { type: "function", name: "getDeviceSLA", inputs: [{ name: "deviceId", type: "uint256" }], outputs: [{ type: "tuple", name: "", components: [{ name: "totalBatches", type: "uint256" }, { name: "cumulativeUptime", type: "uint256" }, { name: "cumulativeOutput", type: "uint256" }, { name: "freshnessPenalties", type: "uint256" }, { name: "lastSubmission", type: "uint256" }] }], stateMutability: "view" },
  { type: "function", name: "getDeviceBatches", inputs: [{ name: "deviceId", type: "uint256" }, { name: "offset", type: "uint256" }, { name: "limit", type: "uint256" }], outputs: [{ type: "uint256[]" }], stateMutability: "view" },
  { type: "function", name: "getDeviceBatchCount", inputs: [{ name: "deviceId", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalBatches", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "maxSubmissionDelay", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "event", name: "BatchSubmitted", inputs: [{ name: "batchId", type: "uint256", indexed: true }, { name: "deviceId", type: "uint256", indexed: true }, { name: "dataRoot", type: "bytes32", indexed: false }, { name: "ipfsCid", type: "string", indexed: false }, { name: "avgOutput", type: "uint256", indexed: false }, { name: "uptimeBps", type: "uint256", indexed: false }] },
] as const;

export const DATA_MARKETPLACE_ABI = [
  { type: "function", name: "createOrder", inputs: [{ name: "deviceType", type: "uint8" }, { name: "region", type: "string" }, { name: "minUptimeBps", type: "uint256" }, { name: "minAvgOutput", type: "uint256" }, { name: "duration", type: "uint256" }, { name: "pricePerBatch", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "payable" },
  { type: "function", name: "matchDevice", inputs: [{ name: "orderId", type: "uint256" }, { name: "deviceId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "settleBatch", inputs: [{ name: "orderId", type: "uint256" }, { name: "batchId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "cancelOrder", inputs: [{ name: "orderId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "getOrder", inputs: [{ name: "orderId", type: "uint256" }], outputs: [{ type: "tuple", name: "", components: [{ name: "buyer", type: "address" }, { name: "deviceType", type: "uint8" }, { name: "region", type: "string" }, { name: "minUptimeBps", type: "uint256" }, { name: "minAvgOutput", type: "uint256" }, { name: "duration", type: "uint256" }, { name: "pricePerBatch", type: "uint256" }, { name: "totalEscrow", type: "uint256" }, { name: "remainingEscrow", type: "uint256" }, { name: "createdAt", type: "uint256" }, { name: "expiresAt", type: "uint256" }, { name: "status", type: "uint8" }] }], stateMutability: "view" },
  { type: "function", name: "getOrderDevices", inputs: [{ name: "orderId", type: "uint256" }], outputs: [{ type: "uint256[]" }], stateMutability: "view" },
  { type: "function", name: "isBatchSettled", inputs: [{ name: "orderId", type: "uint256" }, { name: "batchId", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "totalOrders", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "event", name: "OrderCreated", inputs: [{ name: "orderId", type: "uint256", indexed: true }, { name: "buyer", type: "address", indexed: true }, { name: "escrow", type: "uint256", indexed: false }] },
  { type: "event", name: "DeviceMatched", inputs: [{ name: "orderId", type: "uint256", indexed: true }, { name: "deviceId", type: "uint256", indexed: true }, { name: "operator", type: "address", indexed: true }] },
  { type: "event", name: "BatchSettled", inputs: [{ name: "orderId", type: "uint256", indexed: true }, { name: "batchId", type: "uint256", indexed: true }, { name: "payout", type: "uint256", indexed: false }] },
] as const;

export const FINANCING_TRIGGER_ABI = [
  { type: "function", name: "createTrigger", inputs: [{ name: "beneficiary", type: "address" }, { name: "deviceId", type: "uint256" }, { name: "triggerType", type: "uint8" }, { name: "threshold", type: "uint256" }, { name: "observationPeriod", type: "uint256" }, { name: "requiredStreak", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "payable" },
  { type: "function", name: "evaluate", inputs: [{ name: "triggerId", type: "uint256" }, { name: "batchId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "cancelTrigger", inputs: [{ name: "triggerId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "getTrigger", inputs: [{ name: "triggerId", type: "uint256" }], outputs: [{ type: "tuple", name: "", components: [{ name: "creator", type: "address" }, { name: "beneficiary", type: "address" }, { name: "deviceId", type: "uint256" }, { name: "triggerType", type: "uint8" }, { name: "threshold", type: "uint256" }, { name: "observationPeriod", type: "uint256" }, { name: "requiredStreak", type: "uint256" }, { name: "currentStreak", type: "uint256" }, { name: "escrowedPayout", type: "uint256" }, { name: "status", type: "uint8" }, { name: "createdAt", type: "uint256" }, { name: "expiresAt", type: "uint256" }, { name: "lastEvaluatedBatch", type: "uint256" }] }], stateMutability: "view" },
  { type: "function", name: "totalTriggers", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "event", name: "TriggerCreated", inputs: [{ name: "triggerId", type: "uint256", indexed: true }, { name: "creator", type: "address", indexed: true }, { name: "deviceId", type: "uint256", indexed: true }, { name: "payout", type: "uint256", indexed: false }] },
  { type: "event", name: "TriggerEvaluated", inputs: [{ name: "triggerId", type: "uint256", indexed: true }, { name: "batchId", type: "uint256", indexed: false }, { name: "qualifying", type: "bool", indexed: false }, { name: "currentStreak", type: "uint256", indexed: false }] },
  { type: "event", name: "TriggerActivated", inputs: [{ name: "triggerId", type: "uint256", indexed: true }, { name: "beneficiary", type: "address", indexed: true }, { name: "payout", type: "uint256", indexed: false }] },
] as const;

// Enum helpers
export const DEVICE_TYPES = ["Solar Array", "Wind Turbine", "Hydro Turbine", "Smart Meter"] as const;
export const DEVICE_STATUSES = ["Pending", "Active", "Suspended", "Decommissioned"] as const;
export const ORDER_STATUSES = ["Open", "Active", "Completed", "Cancelled"] as const;
export const TRIGGER_TYPES = ["Generation Above", "Generation Below", "Capacity Factor Above", "Capacity Factor Below"] as const;
export const TRIGGER_STATUSES = ["Active", "Triggered", "Expired", "Cancelled"] as const;
