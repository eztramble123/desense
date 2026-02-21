// Types matching FRONTEND_API_SPEC.md

export interface Reading {
  timestamp: number;
  output: number; // watt-hours (Wh)
  uptime: boolean;
}

export interface Batch {
  batchId: number;
  windowStart: number;
  windowEnd: number;
  dataRoot: string;
  ipfsCid: string;
  avgOutput: number; // kWh
  uptimeBps: number;
  uptimePercent: number;
  submitter: string;
  submittedAt: number;
  txHash: string;
  blockNumber: number;
  disputed: boolean;
}

export interface Asset {
  id: number;
  deviceType: number;
  deviceTypeLabel: string;
  status: number;
  statusLabel: string;
  location: string;
  region: string;
  latitude: number;
  longitude: number;
  capacityKw: number;
  operator: string;
  registeredAt: number;
  capacityFactor: number;
  totalGenerationKwh: number;
  sla: {
    totalBatches: number;
    avgUptime: number;
    avgOutput: number; // Wh
    freshnessPenalties: number;
    lastSubmission: number;
  };
  latestBatch: Batch;
}

export interface NetworkStats {
  totalAssets: number;
  activeAssets: number;
  totalBatches: number;
  totalGenerationKwh: number;
  avgCapacityFactor: number;
  avgUptime: number;
  disputedBatches: number;
  assetsByType: { SolarArray: number; WindTurbine: number; HydroTurbine: number; SmartMeter: number };
  last24h: { batchesSubmitted: number; generationKwh: number; verificationsPerformed: number };
}

// 48 readings × 30 min = 24h window starting 2025-02-25 00:00 UTC
const WINDOW_START = 1740441600;
const WINDOW_END = WINDOW_START + 48 * 1800;

// Deterministic noise values
const SEED = [0.82, 0.17, 0.55, 0.91, 0.33, 0.78, 0.44, 0.66, 0.29, 0.95,
              0.11, 0.73, 0.88, 0.42, 0.61, 0.37, 0.99, 0.24, 0.56, 0.83,
              0.14, 0.70, 0.48, 0.92, 0.35, 0.67, 0.22, 0.79, 0.53, 0.41,
              0.86, 0.19, 0.74, 0.62, 0.08, 0.97, 0.31, 0.58, 0.85, 0.26,
              0.72, 0.49, 0.93, 0.16, 0.64, 0.38, 0.77, 0.05];

// 100 kW array, 30-min interval → theoretical max 50,000 Wh; peak ~47,000 Wh
export const SAMPLE_READINGS: Reading[] = SEED.map((r, i) => {
  const ts = WINDOW_START + i * 1800;
  const localHour = (new Date(ts * 1000).getUTCHours() + 4) % 24;
  let base = 0;
  if (localHour >= 6 && localHour <= 18) {
    base = Math.sin(((localHour - 6) / 12) * Math.PI) * 47000;
  }
  const output = Math.round(Math.max(0, base * (0.90 + r * 0.15)));
  return { timestamp: ts, output, uptime: r > 0.03 };
});

const totalWh = SAMPLE_READINGS.reduce((s, r) => s + r.output, 0);
const uptimeCount = SAMPLE_READINGS.filter((r) => r.uptime).length;
const uptimeBps = Math.round((uptimeCount / 48) * 10000);

export const SAMPLE_BATCH: Batch = {
  batchId: 567,
  windowStart: WINDOW_START,
  windowEnd: WINDOW_END,
  dataRoot: "0xa3f2e1d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2",
  ipfsCid: "QmX7k2nR4j5m8pQ3vL9wK6xY1zA2bC3dE4fG5hI6jK7lM8",
  avgOutput: Math.round(totalWh / 48 / 1000 * 100) / 100,
  uptimeBps,
  uptimePercent: uptimeBps / 100,
  submitter: "0x4A2B8f3C1d9E7a5B2c4D6e8F0a1B3c5D7e9F1a2B",
  submittedAt: WINDOW_END + 42,
  txHash: "0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1",
  blockNumber: 12345,
  disputed: false,
};

export const SAMPLE_ASSET: Asset = {
  id: 0,
  deviceType: 0,
  deviceTypeLabel: "Solar Array",
  status: 1,
  statusLabel: "Active",
  location: "Dubai Solar Park, Block A",
  region: "MENA-UAE",
  latitude: 25.2048,
  longitude: 55.2708,
  capacityKw: 100,
  operator: "0x4A2B8f3C1d9E7a5B2c4D6e8F0a1B3c5D7e9F1a2B",
  registeredAt: 1708400000,
  capacityFactor: 23.5,
  totalGenerationKwh: 34200,
  sla: {
    totalBatches: 142,
    avgUptime: uptimeBps / 100,
    avgOutput: Math.round(totalWh / 48),
    freshnessPenalties: 3,
    lastSubmission: SAMPLE_BATCH.submittedAt,
  },
  latestBatch: SAMPLE_BATCH,
};

export const SAMPLE_STATS: NetworkStats = {
  totalAssets: 48,
  activeAssets: 45,
  totalBatches: 2340,
  totalGenerationKwh: 1250000,
  avgCapacityFactor: 22.1,
  avgUptime: 96.3,
  disputedBatches: 2,
  assetsByType: { SolarArray: 20, WindTurbine: 12, HydroTurbine: 8, SmartMeter: 8 },
  last24h: { batchesSubmitted: 192, generationKwh: 52000, verificationsPerformed: 15 },
};
