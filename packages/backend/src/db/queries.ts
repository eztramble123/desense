import { getDb } from "./schema";

// ─── Assets ──────────────────────────────────────────────

export function upsertAsset(asset: {
  deviceId: number;
  deviceType: number;
  status: number;
  location: string;
  region: string;
  minOutput: number;
  maxOutput: number;
  samplingRateSeconds: number;
  operator: string;
  registeredAt: number;
  capacity: number;
  latitude: number;
  longitude: number;
  blockNumber?: number;
  txHash?: string;
}) {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO assets
    (device_id, device_type, status, location, region, min_output, max_output,
     sampling_rate_seconds, operator, registered_at, capacity, latitude, longitude,
     block_number, tx_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    asset.deviceId, asset.deviceType, asset.status, asset.location, asset.region,
    asset.minOutput, asset.maxOutput, asset.samplingRateSeconds, asset.operator,
    asset.registeredAt, asset.capacity, asset.latitude, asset.longitude,
    asset.blockNumber ?? null, asset.txHash ?? null
  );
}

export function getAssets(opts: { type?: number; region?: string; page: number; limit: number }) {
  const db = getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (opts.type !== undefined) {
    conditions.push("device_type = ?");
    params.push(opts.type);
  }
  if (opts.region) {
    conditions.push("region = ?");
    params.push(opts.region);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (opts.page - 1) * opts.limit;

  const total = db.prepare(`SELECT COUNT(*) as count FROM assets ${where}`).get(...params) as any;
  const rows = db.prepare(`SELECT * FROM assets ${where} ORDER BY device_id ASC LIMIT ? OFFSET ?`)
    .all(...params, opts.limit, offset);

  return { rows, total: total.count };
}

export function getAssetById(deviceId: number) {
  const db = getDb();
  return db.prepare("SELECT * FROM assets WHERE device_id = ?").get(deviceId);
}

// ─── Batches ─────────────────────────────────────────────

export function upsertBatch(batch: {
  batchId: number;
  deviceId: number;
  windowStart: number;
  windowEnd: number;
  dataRoot: string;
  ipfsCid: string;
  avgOutput: number;
  uptimeBps: number;
  submitter: string;
  submittedAt: number;
  disputed?: boolean;
  disputeReason?: string;
  blockNumber?: number;
  txHash?: string;
}) {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO batches
    (batch_id, device_id, window_start, window_end, data_root, ipfs_cid,
     avg_output, uptime_bps, submitter, submitted_at, disputed, dispute_reason,
     block_number, tx_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    batch.batchId, batch.deviceId, batch.windowStart, batch.windowEnd,
    batch.dataRoot, batch.ipfsCid, batch.avgOutput, batch.uptimeBps,
    batch.submitter, batch.submittedAt, batch.disputed ? 1 : 0,
    batch.disputeReason ?? null, batch.blockNumber ?? null, batch.txHash ?? null
  );
}

export function getBatches(opts: { deviceId?: number; page: number; limit: number }) {
  const db = getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (opts.deviceId !== undefined) {
    conditions.push("device_id = ?");
    params.push(opts.deviceId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (opts.page - 1) * opts.limit;

  const total = db.prepare(`SELECT COUNT(*) as count FROM batches ${where}`).get(...params) as any;
  const rows = db.prepare(`SELECT * FROM batches ${where} ORDER BY batch_id DESC LIMIT ? OFFSET ?`)
    .all(...params, opts.limit, offset);

  return { rows, total: total.count };
}

export function getBatchById(batchId: number) {
  const db = getDb();
  return db.prepare("SELECT * FROM batches WHERE batch_id = ?").get(batchId);
}

export function getBatchesByDevice(deviceId: number, page: number, limit: number) {
  const db = getDb();
  const offset = (page - 1) * limit;
  const total = db.prepare("SELECT COUNT(*) as count FROM batches WHERE device_id = ?").get(deviceId) as any;
  const rows = db.prepare("SELECT * FROM batches WHERE device_id = ? ORDER BY batch_id DESC LIMIT ? OFFSET ?")
    .all(deviceId, limit, offset);
  return { rows, total: total.count };
}

export function markBatchDisputed(batchId: number, reason: string) {
  const db = getDb();
  db.prepare("UPDATE batches SET disputed = 1, dispute_reason = ? WHERE batch_id = ?")
    .run(reason, batchId);
}

// ─── Stats ───────────────────────────────────────────────

export function getNetworkStats() {
  const db = getDb();

  const assetStats = db.prepare(`
    SELECT
      COUNT(*) as total_assets,
      SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active_assets
    FROM assets
  `).get() as any;

  const batchStats = db.prepare(`
    SELECT
      COUNT(*) as total_batches,
      SUM(avg_output) as total_generation,
      AVG(uptime_bps) as avg_uptime_bps,
      SUM(CASE WHEN disputed = 1 THEN 1 ELSE 0 END) as disputed_batches
    FROM batches
  `).get() as any;

  const assetsByType = db.prepare(`
    SELECT device_type, COUNT(*) as count FROM assets GROUP BY device_type
  `).all() as any[];

  const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;
  const last24h = db.prepare(`
    SELECT
      COUNT(*) as batches_submitted,
      COALESCE(SUM(avg_output), 0) as generation_kwh
    FROM batches WHERE submitted_at > ?
  `).get(oneDayAgo) as any;

  return { assetStats, batchStats, assetsByType, last24h };
}

// ─── Compliance ──────────────────────────────────────────

export function getComplianceData(deviceId: number, from: number, to: number) {
  const db = getDb();

  const asset = db.prepare("SELECT * FROM assets WHERE device_id = ?").get(deviceId) as any;

  const batches = db.prepare(`
    SELECT * FROM batches
    WHERE device_id = ? AND submitted_at >= ? AND submitted_at <= ?
    ORDER BY submitted_at ASC
  `).all(deviceId, from, to) as any[];

  const aggregates = db.prepare(`
    SELECT
      COUNT(*) as total_batches,
      SUM(avg_output) as total_generation,
      AVG(uptime_bps) as avg_uptime_bps,
      SUM(CASE WHEN disputed = 1 THEN 1 ELSE 0 END) as disputed_batches
    FROM batches
    WHERE device_id = ? AND submitted_at >= ? AND submitted_at <= ?
  `).get(deviceId, from, to) as any;

  return { asset, batches, aggregates };
}

// ─── Indexer State ───────────────────────────────────────

export function getIndexerState(key: string): string | undefined {
  const db = getDb();
  const row = db.prepare("SELECT value FROM indexer_state WHERE key = ?").get(key) as any;
  return row?.value;
}

export function setIndexerState(key: string, value: string) {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO indexer_state (key, value) VALUES (?, ?)").run(key, value);
}

// ─── Map ─────────────────────────────────────────────────

export function getMapAssets() {
  const db = getDb();
  return db.prepare(`
    SELECT
      a.*,
      b.avg_output as latest_avg_output,
      b.uptime_bps as latest_uptime_bps,
      b.submitted_at as latest_submitted_at,
      b.batch_id as latest_batch_id
    FROM assets a
    LEFT JOIN (
      SELECT device_id, avg_output, uptime_bps, submitted_at, batch_id,
        ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY batch_id DESC) as rn
      FROM batches WHERE disputed = 0
    ) b ON a.device_id = b.device_id AND b.rn = 1
  `).all();
}
