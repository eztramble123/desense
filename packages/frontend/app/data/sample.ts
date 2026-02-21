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
  deviceType: number;        // 0 = Residential, 1 = Commercial
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
  assetsByType: { Residential: number; Commercial: number };
  last24h: { batchesSubmitted: number; generationKwh: number; verificationsPerformed: number };
}

// ─── Shared window ────────────────────────────────────────────────────────────

const WINDOW_START = 1740441600; // 2025-02-25 00:00 UTC
const WINDOW_END   = WINDOW_START + 48 * 1800;

// ─── Deterministic seeds (one per asset) ─────────────────────────────────────

const SEEDS: Record<number, number[]> = {
  0: [0.82,0.17,0.55,0.91,0.33,0.78,0.44,0.66,0.29,0.95,0.11,0.73,0.88,0.42,0.61,0.37,0.99,0.24,0.56,0.83,0.14,0.70,0.48,0.92,0.35,0.67,0.22,0.79,0.53,0.41,0.86,0.19,0.74,0.62,0.08,0.97,0.31,0.58,0.85,0.26,0.72,0.49,0.93,0.16,0.64,0.38,0.77,0.05],
  1: [0.54,0.71,0.38,0.62,0.89,0.43,0.76,0.51,0.33,0.68,0.92,0.27,0.59,0.84,0.16,0.74,0.41,0.95,0.23,0.66,0.48,0.81,0.37,0.55,0.79,0.12,0.94,0.63,0.28,0.87,0.45,0.72,0.19,0.96,0.34,0.58,0.83,0.25,0.70,0.47,0.91,0.36,0.61,0.88,0.21,0.53,0.78,0.42],
  2: [0.35,0.62,0.48,0.77,0.29,0.91,0.54,0.38,0.83,0.16,0.70,0.45,0.92,0.61,0.27,0.86,0.43,0.68,0.31,0.95,0.52,0.74,0.19,0.88,0.41,0.65,0.28,0.97,0.57,0.34,0.79,0.53,0.22,0.84,0.47,0.73,0.36,0.91,0.25,0.66,0.82,0.44,0.59,0.17,0.94,0.38,0.71,0.56],
  3: [0.61,0.44,0.78,0.32,0.55,0.83,0.27,0.69,0.91,0.38,0.72,0.49,0.86,0.23,0.67,0.94,0.41,0.58,0.75,0.19,0.88,0.34,0.62,0.47,0.81,0.26,0.93,0.53,0.70,0.37,0.64,0.82,0.29,0.96,0.44,0.68,0.51,0.77,0.35,0.92,0.48,0.73,0.28,0.89,0.56,0.43,0.79,0.65],
  4: [0.72,0.65,0.58,0.80,0.45,0.93,0.37,0.69,0.52,0.88,0.41,0.76,0.29,0.95,0.63,0.47,0.84,0.31,0.71,0.56,0.92,0.38,0.67,0.83,0.24,0.74,0.49,0.91,0.35,0.62,0.87,0.43,0.78,0.26,0.97,0.53,0.69,0.42,0.85,0.30,0.76,0.59,0.94,0.47,0.72,0.36,0.81,0.55],
  5: [0.38,0.81,0.24,0.67,0.93,0.51,0.76,0.19,0.88,0.43,0.62,0.97,0.35,0.74,0.28,0.85,0.47,0.91,0.56,0.33,0.79,0.64,0.22,0.96,0.41,0.58,0.83,0.17,0.72,0.95,0.39,0.66,0.82,0.25,0.54,0.78,0.46,0.89,0.31,0.70,0.57,0.92,0.36,0.61,0.84,0.27,0.73,0.48],
  6: [0.55,0.42,0.88,0.31,0.76,0.63,0.19,0.94,0.47,0.72,0.28,0.85,0.61,0.36,0.79,0.53,0.97,0.24,0.68,0.43,0.81,0.57,0.34,0.92,0.49,0.74,0.26,0.87,0.41,0.65,0.96,0.38,0.71,0.54,0.82,0.29,0.67,0.93,0.45,0.78,0.32,0.89,0.56,0.23,0.84,0.61,0.47,0.91],
};

// ─── Reading generators ───────────────────────────────────────────────────────

// Residential: morning + evening peaks (occupants home), midday dip
function residential(seed: number[], capacityWh: number, utcOffsetH: number): Reading[] {
  return seed.map((r, i) => {
    const ts = WINDOW_START + i * 1800;
    const h = (new Date(ts * 1000).getUTCHours() + utcOffsetH) % 24;
    const load =
      0.15 +
      0.55 * Math.exp(-((h - 7.5) ** 2) / 4) +   // morning peak 7:30
      0.45 * Math.exp(-((h - 20.5) ** 2) / 5);    // evening peak 20:30
    return {
      timestamp: ts,
      output: Math.round(capacityWh * Math.min(1, load) * (0.82 + r * 0.22)),
      uptime: r > 0.03,
    };
  });
}

// Commercial: business hours curve, flat nights/weekends
function commercial(seed: number[], capacityWh: number, utcOffsetH: number): Reading[] {
  return seed.map((r, i) => {
    const ts = WINDOW_START + i * 1800;
    const h = (new Date(ts * 1000).getUTCHours() + utcOffsetH) % 24;
    let load = 0.08;
    if (h >= 8 && h <= 19)
      load = 0.45 + 0.5 * Math.sin(((h - 8) / 11) * Math.PI);
    return {
      timestamp: ts,
      output: Math.round(capacityWh * load * (0.85 + r * 0.18)),
      uptime: r > 0.02,
    };
  });
}

// ─── Asset factory helpers ────────────────────────────────────────────────────

function makeBatch(id: number, batchId: number, readings: Reading[]): Batch {
  const totalWh    = readings.reduce((s, r) => s + r.output, 0);
  const uptimeCount = readings.filter((r) => r.uptime).length;
  const uptimeBps  = Math.round((uptimeCount / readings.length) * 10000);
  return {
    batchId,
    windowStart: WINDOW_START,
    windowEnd:   WINDOW_END,
    dataRoot:    `0xa${id}f2e1d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2`,
    ipfsCid:     `Qm${id}7k2nR4j5m8pQ3vL9wK6xY1zA2bC3dE4fG5hI6jK7lM8`,
    avgOutput:   Math.round((totalWh / readings.length / 1000) * 100) / 100,
    uptimeBps,
    uptimePercent: uptimeBps / 100,
    submitter:   "0x4A2B8f3C1d9E7a5B2c4D6e8F0a1B3c5D7e9F1a2B",
    submittedAt: WINDOW_END + 30 + id * 7,
    txHash:      `0x${id}bc123def456abc123def456abc123def456abc123def456abc123def456abc1`,
    blockNumber: 12345 + id * 12,
    disputed:    false,
  };
}

function makeAsset(
  id: number, deviceType: number, deviceTypeLabel: string,
  location: string, region: string, lat: number, lng: number,
  capacityKw: number, totalGen: number, cf: number,
  readings: Reading[], batchId: number,
): Asset {
  const batch      = makeBatch(id, batchId, readings);
  const uptimeCount = readings.filter((r) => r.uptime).length;
  return {
    id, deviceType, deviceTypeLabel,
    status: 1, statusLabel: "Active",
    location, region, latitude: lat, longitude: lng,
    capacityKw,
    operator:   "0x4A2B8f3C1d9E7a5B2c4D6e8F0a1B3c5D7e9F1a2B",
    registeredAt: 1708400000 + id * 86400 * 30,
    capacityFactor: cf,
    totalGenerationKwh: totalGen,
    sla: {
      totalBatches:      120 + id * 22,
      avgUptime:         Math.round((uptimeCount / readings.length) * 10000) / 100,
      avgOutput:         Math.round(readings.reduce((s, r) => s + r.output, 0) / readings.length),
      freshnessPenalties: id % 4,
      lastSubmission:    batch.submittedAt,
    },
    latestBatch: batch,
  };
}

// ─── Generate readings ────────────────────────────────────────────────────────

const r0 = residential(SEEDS[0], 18000, 4);   // Residential · Middle East   · 36 kW peak
const r1 = residential(SEEDS[1], 14000, 1);   // Residential · Europe        · 28 kW peak
const r2 = residential(SEEDS[2], 16000, -5);  // Residential · North America · 32 kW peak
const r3 = commercial (SEEDS[3], 85000, 4);   // Commercial  · Middle East   · 170 kW peak
const r4 = commercial (SEEDS[4], 60000, 1);   // Commercial  · Europe        · 120 kW peak
const r5 = commercial (SEEDS[5], 72000, -5);  // Commercial  · North America · 144 kW peak
const r6 = residential(SEEDS[6], 12000, 8);   // Residential · Asia Pacific  · 24 kW peak

export const SAMPLE_ASSET_READINGS: Record<number, Reading[]> = {
  0: r0, 1: r1, 2: r2, 3: r3, 4: r4, 5: r5, 6: r6,
};

// ─── Assets ───────────────────────────────────────────────────────────────────

export const SAMPLE_ASSETS: Asset[] = [
  makeAsset(0, 0, "Residential", "Al Barsha Apartments, Dubai",       "Middle East",   25.1124, 55.2012, 36,  8400, 21.2, r0, 567),
  makeAsset(1, 0, "Residential", "Prenzlauer Berg Complex, Berlin",   "Europe",        52.5378, 13.4246, 28,  6100, 19.4, r1, 568),
  makeAsset(2, 0, "Residential", "Williamsburg Tower, New York",      "North America", 40.7128,-73.9442, 32,  7200, 20.8, r2, 569),
  makeAsset(3, 1, "Commercial",  "DIFC Office Tower, Dubai",          "Middle East",   25.2183, 55.2796, 170,41300, 27.5, r3, 570),
  makeAsset(4, 1, "Commercial",  "La Défense HQ, Paris",              "Europe",        48.8924,  2.2368, 120,29800, 24.1, r4, 571),
  makeAsset(5, 1, "Commercial",  "Bay Street Complex, Toronto",       "North America", 43.6487,-79.3789, 144,35600, 25.8, r5, 572),
  makeAsset(6, 0, "Residential", "Marina Bay Residences, Singapore",  "Asia Pacific",   1.2847, 103.8610, 24,  5300, 18.7, r6, 573),
];

// ─── Backward-compat exports (used by /data page) ────────────────────────────

export const SAMPLE_ASSET    = SAMPLE_ASSETS[0];
export const SAMPLE_READINGS = r0;
export const SAMPLE_BATCH    = SAMPLE_ASSETS[0].latestBatch;

// ─── Network stats ────────────────────────────────────────────────────────────

export const SAMPLE_STATS: NetworkStats = {
  totalAssets:        48,
  activeAssets:       45,
  totalBatches:      2340,
  totalGenerationKwh: 1250000,
  avgCapacityFactor:  22.1,
  avgUptime:          96.3,
  disputedBatches:     2,
  assetsByType: { Residential: 28, Commercial: 20 },
  last24h: { batchesSubmitted: 192, generationKwh: 52000, verificationsPerformed: 15 },
};
