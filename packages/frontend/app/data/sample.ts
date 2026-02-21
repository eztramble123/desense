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

// ─── Shared window ───────────────────────────────────────────────────────────

const WINDOW_START = 1740441600; // 2025-02-25 00:00 UTC
const WINDOW_END   = WINDOW_START + 48 * 1800;

// ─── Reading generators ───────────────────────────────────────────────────────

const SEEDS: Record<number, number[]> = {
  0: [0.82,0.17,0.55,0.91,0.33,0.78,0.44,0.66,0.29,0.95,0.11,0.73,0.88,0.42,0.61,0.37,0.99,0.24,0.56,0.83,0.14,0.70,0.48,0.92,0.35,0.67,0.22,0.79,0.53,0.41,0.86,0.19,0.74,0.62,0.08,0.97,0.31,0.58,0.85,0.26,0.72,0.49,0.93,0.16,0.64,0.38,0.77,0.05],
  1: [0.54,0.71,0.38,0.62,0.89,0.43,0.76,0.51,0.33,0.68,0.92,0.27,0.59,0.84,0.16,0.74,0.41,0.95,0.23,0.66,0.48,0.81,0.37,0.55,0.79,0.12,0.94,0.63,0.28,0.87,0.45,0.72,0.19,0.96,0.34,0.58,0.83,0.25,0.70,0.47,0.91,0.36,0.61,0.88,0.21,0.53,0.78,0.42],
  2: [0.93,0.91,0.95,0.88,0.97,0.90,0.86,0.94,0.92,0.89,0.96,0.87,0.93,0.91,0.98,0.85,0.94,0.92,0.90,0.96,0.88,0.93,0.91,0.97,0.89,0.95,0.92,0.88,0.96,0.90,0.94,0.87,0.93,0.91,0.98,0.86,0.95,0.92,0.89,0.97,0.90,0.94,0.88,0.96,0.91,0.93,0.87,0.95],
  3: [0.61,0.44,0.78,0.32,0.55,0.83,0.27,0.69,0.91,0.38,0.72,0.49,0.86,0.23,0.67,0.94,0.41,0.58,0.75,0.19,0.88,0.34,0.62,0.47,0.81,0.26,0.93,0.53,0.70,0.37,0.64,0.82,0.29,0.96,0.44,0.68,0.51,0.77,0.35,0.92,0.48,0.73,0.28,0.89,0.56,0.43,0.79,0.65],
  4: [0.72,0.65,0.58,0.80,0.45,0.93,0.37,0.69,0.52,0.88,0.41,0.76,0.29,0.95,0.63,0.47,0.84,0.31,0.71,0.56,0.92,0.38,0.67,0.83,0.24,0.74,0.49,0.91,0.35,0.62,0.87,0.43,0.78,0.26,0.97,0.53,0.69,0.42,0.85,0.30,0.76,0.59,0.94,0.47,0.72,0.36,0.81,0.55],
  5: [0.38,0.81,0.24,0.67,0.93,0.51,0.76,0.19,0.88,0.43,0.62,0.97,0.35,0.74,0.28,0.85,0.47,0.91,0.56,0.33,0.79,0.64,0.22,0.96,0.41,0.58,0.83,0.17,0.72,0.95,0.39,0.66,0.82,0.25,0.54,0.78,0.46,0.89,0.31,0.70,0.57,0.92,0.36,0.61,0.84,0.27,0.73,0.48],
  6: [0.55,0.42,0.88,0.31,0.76,0.63,0.19,0.94,0.47,0.72,0.28,0.85,0.61,0.36,0.79,0.53,0.97,0.24,0.68,0.43,0.81,0.57,0.34,0.92,0.49,0.74,0.26,0.87,0.41,0.65,0.96,0.38,0.71,0.54,0.82,0.29,0.67,0.93,0.45,0.78,0.32,0.89,0.56,0.23,0.84,0.61,0.47,0.91],
};

function solar(seed: number[], utcOffsetH: number, peakWh: number): Reading[] {
  return seed.map((r, i) => {
    const ts = WINDOW_START + i * 1800;
    const localHour = (new Date(ts * 1000).getUTCHours() + utcOffsetH) % 24;
    let base = 0;
    if (localHour >= 6 && localHour <= 18)
      base = Math.sin(((localHour - 6) / 12) * Math.PI) * peakWh;
    return { timestamp: ts, output: Math.round(Math.max(0, base * (0.88 + r * 0.16))), uptime: r > 0.04 };
  });
}

function wind(seed: number[], capacityWh: number): Reading[] {
  return seed.map((r, i) => {
    const ts = WINDOW_START + i * 1800;
    // Smooth wind curve using multiple sine harmonics + noise
    const t = i / 48;
    const base = (0.35 + 0.25 * Math.sin(t * Math.PI * 2) + 0.15 * Math.sin(t * Math.PI * 5)) * capacityWh;
    return { timestamp: ts, output: Math.round(Math.max(0, base * (0.75 + r * 0.5))), uptime: r > 0.02 };
  });
}

function hydro(seed: number[], capacityWh: number): Reading[] {
  return seed.map((r, i) => {
    const ts = WINDOW_START + i * 1800;
    // Hydro is very steady — small variation around 88% load
    return { timestamp: ts, output: Math.round(capacityWh * (0.84 + r * 0.08)), uptime: r > 0.01 };
  });
}

function meter(seed: number[], capacityWh: number): Reading[] {
  return seed.map((r, i) => {
    const ts = WINDOW_START + i * 1800;
    // Smart meter shows daily load curve — peaks morning and evening
    const h = new Date(ts * 1000).getUTCHours();
    const load = 0.3 + 0.4 * (Math.exp(-((h - 8) ** 2) / 8) + Math.exp(-((h - 20) ** 2) / 8));
    return { timestamp: ts, output: Math.round(capacityWh * load * (0.8 + r * 0.4)), uptime: r > 0.02 };
  });
}

// ─── Build all readings ───────────────────────────────────────────────────────

function makeBatch(id: number, batchId: number, readings: Reading[]): Batch {
  const totalWh = readings.reduce((s, r) => s + r.output, 0);
  const uptimeCount = readings.filter((r) => r.uptime).length;
  const uptimeBps = Math.round((uptimeCount / readings.length) * 10000);
  return {
    batchId,
    windowStart: WINDOW_START,
    windowEnd: WINDOW_END,
    dataRoot: `0xa${id}f2e1d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2`,
    ipfsCid: `Qm${id}7k2nR4j5m8pQ3vL9wK6xY1zA2bC3dE4fG5hI6jK7lM8`,
    avgOutput: Math.round((totalWh / readings.length / 1000) * 100) / 100,
    uptimeBps,
    uptimePercent: uptimeBps / 100,
    submitter: "0x4A2B8f3C1d9E7a5B2c4D6e8F0a1B3c5D7e9F1a2B",
    submittedAt: WINDOW_END + 30 + id * 7,
    txHash: `0x${id}bc123def456abc123def456abc123def456abc123def456abc123def456abc1`,
    blockNumber: 12345 + id * 12,
    disputed: false,
  };
}

function makeAsset(
  id: number, deviceType: number, deviceTypeLabel: string,
  location: string, region: string, lat: number, lng: number,
  capacityKw: number, totalGen: number, cf: number,
  readings: Reading[], batchId: number,
): Asset {
  const batch = makeBatch(id, batchId, readings);
  const uptimeCount = readings.filter((r) => r.uptime).length;
  return {
    id, deviceType, deviceTypeLabel,
    status: 1, statusLabel: "Active",
    location, region, latitude: lat, longitude: lng,
    capacityKw,
    operator: "0x4A2B8f3C1d9E7a5B2c4D6e8F0a1B3c5D7e9F1a2B",
    registeredAt: 1708400000 + id * 86400 * 30,
    capacityFactor: cf,
    totalGenerationKwh: totalGen,
    sla: {
      totalBatches: 120 + id * 22,
      avgUptime: Math.round((uptimeCount / readings.length) * 10000) / 100,
      avgOutput: Math.round(readings.reduce((s, r) => s + r.output, 0) / readings.length),
      freshnessPenalties: id % 4,
      lastSubmission: batch.submittedAt,
    },
    latestBatch: batch,
  };
}

// ─── Asset definitions ────────────────────────────────────────────────────────

const r0 = solar(SEEDS[0], 4,  47000); // Solar UAE      UTC+4  100 kW
const r1 = solar(SEEDS[1], 3,  42000); // Solar KSA      UTC+3   90 kW
const r2 = solar(SEEDS[2], 1,  38000); // Solar Spain    UTC+1   80 kW
const r3 = wind (SEEDS[3], 100000);    // Wind UAE       200 kW
const r4 = wind (SEEDS[4],  80000);    // Wind Germany   160 kW
const r5 = hydro(SEEDS[5], 250000);    // Hydro Germany  500 kW
const r6 = meter(SEEDS[6],  25000);    // Smart Meter ES  50 kW

export const SAMPLE_ASSET_READINGS: Record<number, Reading[]> = {
  0: r0, 1: r1, 2: r2, 3: r3, 4: r4, 5: r5, 6: r6,
};

export const SAMPLE_ASSETS: Asset[] = [
  makeAsset(0, 0, "Solar Array",   "Dubai Solar Park, Block A",       "MENA-UAE", 25.2048, 55.2708, 100, 34200, 23.5, r0, 567),
  makeAsset(1, 0, "Solar Array",   "Riyadh Energy Complex, Zone 3",   "MENA-KSA", 24.6877, 46.7219,  90, 28900, 21.8, r1, 568),
  makeAsset(2, 0, "Solar Array",   "Seville Photovoltaic Farm",       "EU-ES",    37.3891,  5.9845,  80, 24100, 20.4, r2, 569),
  makeAsset(3, 1, "Wind Turbine",  "Jebel Ali Offshore Array",        "MENA-UAE", 24.9857, 55.0711, 200, 61400, 22.1, r3, 570),
  makeAsset(4, 1, "Wind Turbine",  "North Sea Cluster, Platform B",   "EU-DE",    54.5260, 13.4050, 160, 49800, 24.7, r4, 571),
  makeAsset(5, 2, "Hydro Turbine", "Rhine Valley Hydrostation",       "EU-DE",    47.6779,  7.8734, 500, 98200, 26.3, r5, 572),
  makeAsset(6, 3, "Smart Meter",   "Barcelona Grid Substation 12",    "EU-ES",    41.3851,  2.1734,  50, 11200, 14.9, r6, 573),
];

// ─── Backward-compat exports for /data page ───────────────────────────────────

export const SAMPLE_ASSET    = SAMPLE_ASSETS[0];
export const SAMPLE_READINGS = r0;
export const SAMPLE_BATCH    = SAMPLE_ASSETS[0].latestBatch;

// ─── Network stats ────────────────────────────────────────────────────────────

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

// ─── Types re-exported for pages ─────────────────────────────────────────────

export type { Reading as SensorReading };
