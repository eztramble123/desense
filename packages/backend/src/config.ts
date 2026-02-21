import "dotenv/config";

export const config = {
  rpcUrl: process.env.RPC_URL || "https://rpc.ab.testnet.adifoundation.ai/",
  privateKey: process.env.PRIVATE_KEY || "",
  chainId: Number(process.env.CHAIN_ID || 99999),

  contracts: {
    accessControl: process.env.ACCESS_CONTROL_ADDRESS || process.env.NEXT_PUBLIC_ACCESS_CONTROL || "",
    deviceRegistry: process.env.DEVICE_REGISTRY_ADDRESS || process.env.NEXT_PUBLIC_DEVICE_REGISTRY || "",
    dataCommitment: process.env.DATA_COMMITMENT_ADDRESS || process.env.NEXT_PUBLIC_DATA_COMMITMENT || "",
    dataMarketplace: process.env.DATA_MARKETPLACE_ADDRESS || process.env.NEXT_PUBLIC_DATA_MARKETPLACE || "",
    financingTrigger: process.env.FINANCING_TRIGGER_ADDRESS || process.env.NEXT_PUBLIC_FINANCING_TRIGGER || "",
  },

  pinataApiKey: process.env.PINATA_API_KEY || "",
  pinataSecret: process.env.PINATA_SECRET || "",

  port: Number(process.env.PORT || 3001),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  dbPath: process.env.DB_PATH || "./zeus.db",
};

export const DEVICE_TYPE_LABELS: Record<number, string> = {
  0: "Solar Array",
  1: "Wind Turbine",
  2: "Hydro Turbine",
  3: "Smart Meter",
};

export const DEVICE_STATUS_LABELS: Record<number, string> = {
  0: "Pending",
  1: "Active",
  2: "Suspended",
  3: "Decommissioned",
};
