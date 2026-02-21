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
  totalGenerationKwh: number;
  sla: {
    totalBatches: number;
    avgUptime: number;
    avgOutput: number; // Wh per reading interval
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
  avgUptime: number;
  disputedBatches: number;
  assetsByType: { Residential: number; Commercial: number };
  last24h: { batchesSubmitted: number; generationKwh: number; verificationsPerformed: number };
}

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function mkRng(seed: number) {
  let s = (seed * 747796405 + 2891336453) >>> 0;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), s | 1) ^ (Math.imul(s ^ (s >>> 7), s | 61) + 1)) >>> 0;
    return s / 0x100000000;
  };
}

// ─── Window ───────────────────────────────────────────────────────────────────

const WINDOW_START = 1740441600; // 2025-02-25 00:00 UTC
const WINDOW_END   = WINDOW_START + 48 * 1800;

// ─── Reading generators ───────────────────────────────────────────────────────

function residential(rng: () => number, capacityWh: number, utcOffset: number): Reading[] {
  return Array.from({ length: 48 }, (_, i) => {
    const ts = WINDOW_START + i * 1800;
    const h = (new Date(ts * 1000).getUTCHours() + utcOffset + 48) % 24;
    const load = 0.15
      + 0.55 * Math.exp(-((h - 7.5) ** 2) / 4)
      + 0.45 * Math.exp(-((h - 20.5) ** 2) / 5);
    return {
      timestamp: ts,
      output: Math.round(capacityWh * Math.min(1, load) * (0.80 + rng() * 0.24)),
      uptime: rng() > 0.03,
    };
  });
}

function commercial(rng: () => number, capacityWh: number, utcOffset: number): Reading[] {
  return Array.from({ length: 48 }, (_, i) => {
    const ts = WINDOW_START + i * 1800;
    const h = (new Date(ts * 1000).getUTCHours() + utcOffset + 48) % 24;
    const load = (h >= 8 && h <= 19)
      ? 0.45 + 0.5 * Math.sin(((h - 8) / 11) * Math.PI)
      : 0.08;
    return {
      timestamp: ts,
      output: Math.round(capacityWh * load * (0.83 + rng() * 0.20)),
      uptime: rng() > 0.02,
    };
  });
}

// ─── Asset factory ────────────────────────────────────────────────────────────

function makeAsset(
  id: number, type: number, typeLabel: string,
  location: string, region: string, lat: number, lng: number,
  capacityKw: number, utcOffset: number,
): [Asset, Reading[]] {
  const rng      = mkRng(id);
  const capWh    = capacityKw * 500; // Wh per 30-min interval at full capacity
  const readings = type === 0
    ? residential(rng, capWh, utcOffset)
    : commercial(rng, capWh, utcOffset);

  const totalWh     = readings.reduce((s, r) => s + r.output, 0);
  const uptimeCount = readings.filter((r) => r.uptime).length;
  const uptimeBps   = Math.round((uptimeCount / 48) * 10000);
  const avgOutputWh = Math.round(totalWh / 48);
  const totalBatches = 80 + (id * 17) % 160;

  const batch: Batch = {
    batchId:      500 + id,
    windowStart:  WINDOW_START,
    windowEnd:    WINDOW_END,
    dataRoot:     `0x${id.toString(16).padStart(2,"0")}f2e1d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2`,
    ipfsCid:      `Qm${id.toString(36).padStart(2,"0")}7k2nR4j5m8pQ3vL9wK6xY1zA2bC3dE4fG5hI6jK7lM8`,
    avgOutput:    Math.round(avgOutputWh / 1000 * 100) / 100,
    uptimeBps,
    uptimePercent: uptimeBps / 100,
    submitter:    "0x4A2B8f3C1d9E7a5B2c4D6e8F0a1B3c5D7e9F1a2B",
    submittedAt:  WINDOW_END + 30 + id * 7,
    txHash:       `0x${id.toString(16).padStart(2,"0")}c123def456abc123def456abc123def456abc123def456abc123def456abc123`,
    blockNumber:  12000 + id * 11,
    disputed:     id % 47 === 0,
  };

  const asset: Asset = {
    id, deviceType: type, deviceTypeLabel: typeLabel,
    status: 1, statusLabel: "Active",
    location, region, latitude: lat, longitude: lng,
    capacityKw,
    operator: "0x4A2B8f3C1d9E7a5B2c4D6e8F0a1B3c5D7e9F1a2B",
    registeredAt: 1700000000 + id * 86400 * 14,
    totalGenerationKwh: Math.round(capacityKw * (1800 + (id * 137) % 2400)),
    sla: {
      totalBatches,
      avgUptime: uptimeBps / 100,
      avgOutput: avgOutputWh,
      freshnessPenalties: id % 5,
      lastSubmission: batch.submittedAt,
    },
    latestBatch: batch,
  };

  return [asset, readings];
}

// ─── Asset definitions ────────────────────────────────────────────────────────
// [type, typeLabel, location, region, lat, lng, capacityKw, utcOffset]

type Def = [number, string, string, string, number, number, number, number];

const DEFS: Def[] = [
  // ── Middle East ──────────────────────────────────────────────────────────
  [0,"Residential","Al Barsha Apartments, Dubai",           "Middle East",  25.1124,  55.2012,  36, 4],
  [0,"Residential","Jumeirah Villa Complex, Dubai",          "Middle East",  25.2096,  55.2368,  28, 4],
  [0,"Residential","Downtown Residences, Dubai",             "Middle East",  25.1972,  55.2744,  45, 4],
  [0,"Residential","Al Nahyan Compound, Abu Dhabi",          "Middle East",  24.4539,  54.3773,  32, 4],
  [0,"Residential","Khalidiyah Residences, Abu Dhabi",       "Middle East",  24.4735,  54.3621,  24, 4],
  [0,"Residential","Al Olaya District, Riyadh",              "Middle East",  24.6877,  46.7219,  30, 3],
  [0,"Residential","Al Malqa Neighborhood, Riyadh",          "Middle East",  24.8019,  46.6369,  22, 3],
  [0,"Residential","Al Hamra District, Jeddah",              "Middle East",  21.5433,  39.1728,  26, 3],
  [0,"Residential","Lusail Residences, Doha",                "Middle East",  25.4338,  51.4911,  34, 3],
  [0,"Residential","The Pearl, Qatar",                       "Middle East",  25.3710,  51.5501,  42, 3],
  [0,"Residential","Salmiya Block, Kuwait City",             "Middle East",  29.3375,  48.0844,  28, 3],
  [0,"Residential","Al Rawda Complex, Ajman",                "Middle East",  25.4141,  55.5131,  20, 4],
  [0,"Residential","Mudon Community, Dubai",                 "Middle East",  25.0214,  55.2408,  38, 4],
  [0,"Residential","Al Raha Beach, Abu Dhabi",               "Middle East",  24.4257,  54.6272,  30, 4],
  [0,"Residential","Bahrain Harbour Residences, Manama",     "Middle East",  26.2318,  50.5878,  26, 3],
  [1,"Commercial", "DIFC Office Tower, Dubai",               "Middle East",  25.2183,  55.2796, 170, 4],
  [1,"Commercial", "Business Bay Complex, Dubai",            "Middle East",  25.1865,  55.2617, 220, 4],
  [1,"Commercial", "Dubai Mall Retail Zone",                 "Middle East",  25.1972,  55.2796, 350, 4],
  [1,"Commercial", "ADGM Square, Abu Dhabi",                 "Middle East",  24.4678,  54.3228, 180, 4],
  [1,"Commercial", "King Abdullah Financial District, Riyadh","Middle East", 24.7612,  46.6388, 300, 3],
  [1,"Commercial", "Jeddah Economic City",                   "Middle East",  22.6333,  39.1500, 240, 3],
  [1,"Commercial", "Lusail City Tower, Doha",                "Middle East",  25.4174,  51.4876, 195, 3],
  [1,"Commercial", "Al Hamra Tower, Kuwait City",            "Middle East",  29.3759,  47.9897, 160, 3],
  [1,"Commercial", "Sharjah Media City",                     "Middle East",  25.3463,  55.4209, 130, 4],
  [1,"Commercial", "Mall of Qatar, Doha",                    "Middle East",  25.2867,  51.4388, 280, 3],
  // ── Europe ──────────────────────────────────────────────────────────────
  [0,"Residential","Prenzlauer Berg, Berlin",                "Europe",       52.5378,  13.4246,  28, 1],
  [0,"Residential","Mitte District, Berlin",                 "Europe",       52.5200,  13.4050,  32, 1],
  [0,"Residential","Schwabing, Munich",                      "Europe",       48.1574,  11.5855,  24, 1],
  [0,"Residential","Sachsenhausen, Frankfurt",               "Europe",       50.0979,   8.6842,  20, 1],
  [0,"Residential","Eimsbüttel, Hamburg",                    "Europe",       53.5753,   9.9426,  22, 1],
  [0,"Residential","Le Marais, Paris",                       "Europe",       48.8566,   2.3522,  18, 1],
  [0,"Residential","Part-Dieu, Lyon",                        "Europe",       45.7640,   4.8357,  22, 1],
  [0,"Residential","Gràcia, Barcelona",                      "Europe",       41.4036,   2.1585,  26, 1],
  [0,"Residential","Chamberí, Madrid",                       "Europe",       40.4378,  -3.7014,  24, 1],
  [0,"Residential","Jordaan, Amsterdam",                     "Europe",       52.3740,   4.8897,  20, 1],
  [0,"Residential","Navigli, Milan",                         "Europe",       45.4495,   9.1727,  22, 1],
  [0,"Residential","Trastevere, Rome",                       "Europe",       41.8881,  12.4698,  18, 1],
  [0,"Residential","Södermalm, Stockholm",                   "Europe",       59.3127,  18.0657,  16, 1],
  [0,"Residential","Wiedikon, Zurich",                       "Europe",       47.3767,   8.5122,  30, 1],
  [0,"Residential","Fitzrovia, London",                      "Europe",       51.5195,  -0.1376,  24, 0],
  [0,"Residential","Hackney, London",                        "Europe",       51.5450,  -0.0553,  20, 0],
  [0,"Residential","Geneva Eaux-Vives",                      "Europe",       46.2044,   6.1432,  26, 1],
  [0,"Residential","Bruges Old Town",                        "Europe",       51.2093,   3.2247,  18, 1],
  [1,"Commercial", "La Défense, Paris",                      "Europe",       48.8924,   2.2368, 120, 1],
  [1,"Commercial", "Canary Wharf, London",                   "Europe",       51.5051,  -0.0235, 280, 0],
  [1,"Commercial", "Westend Tower, Frankfurt",               "Europe",       50.1109,   8.6821, 195, 1],
  [1,"Commercial", "Potsdamer Platz, Berlin",                "Europe",       52.5096,  13.3760, 160, 1],
  [1,"Commercial", "Olympia Tower, Munich",                  "Europe",       48.1735,  11.5561, 140, 1],
  [1,"Commercial", "Euronext HQ, Amsterdam",                 "Europe",       52.3792,   4.8994, 110, 1],
  [1,"Commercial", "CityLife Tower, Milan",                  "Europe",       45.4781,   9.1468, 130, 1],
  [1,"Commercial", "AZCA Complex, Madrid",                   "Europe",       40.4565,  -3.6901, 150, 1],
  [1,"Commercial", "Stockholm Waterfront",                   "Europe",       59.3328,  18.0562,  95, 1],
  [1,"Commercial", "Zurich Prime Tower",                     "Europe",       47.3897,   8.5167, 115, 1],
  [1,"Commercial", "Quartier Européen, Brussels",            "Europe",       50.8503,   4.3784, 140, 1],
  // ── North America ────────────────────────────────────────────────────────
  [0,"Residential","Williamsburg, New York",                 "North America", 40.7128, -73.9442,  32,-5],
  [0,"Residential","Upper West Side, New York",              "North America", 40.7851, -73.9754,  28,-5],
  [0,"Residential","Back Bay, Boston",                       "North America", 42.3505, -71.0810,  24,-5],
  [0,"Residential","Lincoln Park, Chicago",                  "North America", 41.9217, -87.6473,  26,-6],
  [0,"Residential","Logan Square, Chicago",                  "North America", 41.9216, -87.7055,  22,-6],
  [0,"Residential","Midtown, Toronto",                       "North America", 43.6710, -79.3888,  28,-5],
  [0,"Residential","The Beaches, Toronto",                   "North America", 43.6687, -79.2954,  24,-5],
  [0,"Residential","Liberty Village, Toronto",               "North America", 43.6382, -79.4197,  20,-5],
  [0,"Residential","Silver Lake, Los Angeles",               "North America", 34.0866,-118.2709,  30,-8],
  [0,"Residential","Mission District, San Francisco",        "North America", 37.7599,-122.4148,  26,-8],
  [0,"Residential","Capitol Hill, Seattle",                  "North America", 47.6230,-122.3211,  22,-8],
  [0,"Residential","Kitsilano, Vancouver",                   "North America", 49.2627,-123.1716,  20,-8],
  [0,"Residential","Brickell, Miami",                        "North America", 25.7617, -80.1918,  28,-5],
  [0,"Residential","Deep Ellum, Dallas",                     "North America", 32.7847, -96.7796,  24,-6],
  [0,"Residential","Montrose, Houston",                      "North America", 29.7497, -95.3995,  26,-6],
  [0,"Residential","Plateau, Montreal",                      "North America", 45.5250, -73.5849,  22,-5],
  [0,"Residential","Georgetown, Washington DC",              "North America", 38.9072, -77.0631,  30,-5],
  [1,"Commercial", "Bay Street Complex, Toronto",            "North America", 43.6487, -79.3789, 144,-5],
  [1,"Commercial", "Midtown Manhattan, New York",            "North America", 40.7549, -73.9840, 320,-5],
  [1,"Commercial", "Financial District, Boston",             "North America", 42.3572, -71.0554, 175,-5],
  [1,"Commercial", "Willis Tower, Chicago",                  "North America", 41.8789, -87.6359, 260,-6],
  [1,"Commercial", "Century City, Los Angeles",              "North America", 34.0559,-118.4165, 210,-8],
  [1,"Commercial", "Salesforce Tower, San Francisco",        "North America", 37.7895,-122.3969, 240,-8],
  [1,"Commercial", "Bellevue Downtown, Seattle",             "North America", 47.6101,-122.2015, 180,-8],
  [1,"Commercial", "Vancouver Convention Centre",            "North America", 49.2888,-123.1114, 190,-8],
  [1,"Commercial", "Complexe Desjardins, Montreal",          "North America", 45.5058, -73.5698, 145,-5],
  [1,"Commercial", "K Street, Washington DC",                "North America", 38.9019, -77.0369, 170,-5],
  [1,"Commercial", "Brickell Key, Miami",                    "North America", 25.7660, -80.1849, 155,-5],
  [1,"Commercial", "Uptown, Dallas",                         "North America", 32.7992, -96.8013, 135,-6],
  [1,"Commercial", "Greenway Plaza, Houston",                "North America", 29.7374, -95.4389, 160,-6],
  // ── Asia Pacific ─────────────────────────────────────────────────────────
  [0,"Residential","Marina Bay, Singapore",                  "Asia Pacific",   1.2847, 103.8610,  24, 8],
  [0,"Residential","Tanjong Pagar, Singapore",               "Asia Pacific",   1.2769, 103.8437,  20, 8],
  [0,"Residential","Causeway Bay, Hong Kong",                "Asia Pacific",  22.2783, 114.1825,  22, 8],
  [0,"Residential","Shibuya, Tokyo",                         "Asia Pacific",  35.6580, 139.7016,  18, 9],
  [0,"Residential","Shinjuku, Tokyo",                        "Asia Pacific",  35.6938, 139.7034,  22, 9],
  [0,"Residential","Gangnam, Seoul",                         "Asia Pacific",  37.5172, 127.0473,  26, 9],
  [0,"Residential","KLCC, Kuala Lumpur",                     "Asia Pacific",   3.1579, 101.7123,  20, 8],
  [0,"Residential","Sukhumvit, Bangkok",                     "Asia Pacific",  13.7307, 100.5674,  18, 7],
  [0,"Residential","Surry Hills, Sydney",                    "Asia Pacific", -33.8830, 151.2119,  22,10],
  [0,"Residential","Fitzroy, Melbourne",                     "Asia Pacific", -37.7963, 144.9762,  20,10],
  [1,"Commercial", "Raffles Place, Singapore",               "Asia Pacific",   1.2843, 103.8510, 220, 8],
  [1,"Commercial", "IFC Mall, Hong Kong",                    "Asia Pacific",  22.2855, 114.1577, 280, 8],
  [1,"Commercial", "Marunouchi, Tokyo",                      "Asia Pacific",  35.6812, 139.7671, 250, 9],
  [1,"Commercial", "COEX Centre, Seoul",                     "Asia Pacific",  37.5115, 127.0590, 190, 9],
  [1,"Commercial", "Barangaroo, Sydney",                     "Asia Pacific", -33.8615, 151.2013, 165,10],
];

// ─── Build all assets + readings ──────────────────────────────────────────────

const _built = DEFS.map(([type, label, location, region, lat, lng, cap, utc], i) =>
  makeAsset(i, type, label, location, region, lat, lng, cap, utc)
);

export const SAMPLE_ASSETS: Asset[]                      = _built.map(([a]) => a);
export const SAMPLE_ASSET_READINGS: Record<number, Reading[]> = Object.fromEntries(
  _built.map(([a, r]) => [a.id, r])
);

// ─── Backward-compat exports (used by /data page) ────────────────────────────

export const SAMPLE_ASSET    = SAMPLE_ASSETS[0];
export const SAMPLE_READINGS = SAMPLE_ASSET_READINGS[0];
export const SAMPLE_BATCH    = SAMPLE_ASSETS[0].latestBatch;

// ─── Network stats ────────────────────────────────────────────────────────────

const _residential = SAMPLE_ASSETS.filter((a) => a.deviceType === 0).length;
const _commercial  = SAMPLE_ASSETS.filter((a) => a.deviceType === 1).length;

export const SAMPLE_STATS: NetworkStats = {
  totalAssets:        SAMPLE_ASSETS.length,
  activeAssets:       SAMPLE_ASSETS.length - 2,
  totalBatches:       SAMPLE_ASSETS.reduce((s, a) => s + a.sla.totalBatches, 0),
  totalGenerationKwh: SAMPLE_ASSETS.reduce((s, a) => s + a.totalGenerationKwh, 0),
  avgUptime:          Math.round(SAMPLE_ASSETS.reduce((s, a) => s + a.sla.avgUptime, 0) / SAMPLE_ASSETS.length * 10) / 10,
  disputedBatches:    SAMPLE_ASSETS.filter((a) => a.latestBatch.disputed).length,
  assetsByType:       { Residential: _residential, Commercial: _commercial },
  last24h: {
    batchesSubmitted:     SAMPLE_ASSETS.length * 2,
    generationKwh:        Math.round(SAMPLE_ASSETS.reduce((s, a) => s + a.sla.avgOutput * 48 / 1000, 0)),
    verificationsPerformed: 47,
  },
};
