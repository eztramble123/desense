const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

export interface ApiAsset {
  id: number;
  deviceType: number;
  deviceTypeLabel: string;
  status: number;
  statusLabel: string;
  location: string;
  region: string;
  latitude: number;
  longitude: number;
  capacity: number;
  capacityKw: number;
  operator: string;
  registeredAt: number;
}

export interface AssetDetail extends ApiAsset {
  sla: {
    totalBatches: number;
    avgUptime: number;
    avgOutput: number; // kWh
    freshnessPenalties: number;
    lastSubmission: number;
  };
  latestBatch: Batch | null;
}

export interface MapAsset {
  id: number;
  deviceType: number;
  deviceTypeLabel: string;
  status: number;
  statusLabel: string;
  latitude: number;
  longitude: number;
  capacityKw: number;
  region: string;
  operator: string;
  latestGeneration: {
    avgOutput: number;
    uptimePercent: number;
    capacityFactor: number;
    lastUpdated: number;
  } | null;
}

export interface Batch {
  batchId: number;
  deviceId?: number;
  windowStart: number;
  windowEnd: number;
  dataRoot: string;
  ipfsCid: string;
  avgOutput: number;
  uptimeBps: number;
  uptimePercent: number;
  submitter: string;
  submittedAt: number;
  txHash: string;
  blockNumber: number;
  disputed: boolean;
  disputeReason?: string | null;
}

export interface NetworkStats {
  totalAssets: number;
  activeAssets: number;
  totalBatches: number;
  totalGenerationKwh: number;
  avgUptime: number;
  disputedBatches: number;
  assetsByType: Record<string, number>;
  last24h: { batchesSubmitted: number; generationKwh: number };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json();
}

export interface IngestResult {
  accepted: boolean;
  deviceId: number;
  readingsReceived: number;
  batchId: number;
  dataRoot: string;
  ipfsCid: string;
  txHash: string;
}

export const api = {
  stats: () => get<NetworkStats>("/stats"),
  assets: (page = 1, limit = 200) =>
    get<{ assets: ApiAsset[]; total: number }>(`/assets?page=${page}&limit=${limit}`),
  asset: (id: number) => get<AssetDetail>(`/assets/${id}`),
  assetBatches: (id: number, limit = 50) =>
    get<{ batches: Batch[]; total: number }>(`/assets/${id}/batches?limit=${limit}`),
  mapAssets: () => get<{ assets: MapAsset[] }>("/map/assets"),
  batches: (limit = 100) =>
    get<{ batches: Batch[]; total: number }>(`/batches?limit=${limit}`),
  ingest: (deviceId: number, readings: { timestamp: number; output: number; uptime: boolean }[]) =>
    post<IngestResult>("/ingest/readings", { deviceId, readings, source: "frontend" }),
};
