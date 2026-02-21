import { Router, Request, Response } from "express";
import { getAssets, getAssetById, getBatchesByDevice } from "../db/queries";
import { fetchSLAFromChain, fetchBatchFromChain } from "../services/chain";
import { DEVICE_TYPE_LABELS, DEVICE_STATUS_LABELS } from "../config";

const router = Router();

// GET /api/assets
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const type = req.query.type !== undefined ? Number(req.query.type) : undefined;
    const region = req.query.region as string | undefined;

    const { rows, total } = getAssets({ type, region, page, limit });

    const assets = (rows as any[]).map((row) => ({
      id: row.device_id,
      deviceType: row.device_type,
      deviceTypeLabel: DEVICE_TYPE_LABELS[row.device_type] || "Unknown",
      status: row.status,
      statusLabel: DEVICE_STATUS_LABELS[row.status] || "Unknown",
      location: row.location,
      region: row.region,
      latitude: row.latitude,
      longitude: row.longitude,
      capacity: row.capacity,
      capacityKw: row.capacity / 1000,
      minOutput: row.min_output,
      maxOutput: row.max_output,
      samplingRateSeconds: row.sampling_rate_seconds,
      operator: row.operator,
      registeredAt: row.registered_at,
    }));

    res.json({ assets, total, page, limit });
  } catch (err: any) {
    res.status(500).json({ error: err.message, code: "INTERNAL_ERROR" });
  }
});

// GET /api/assets/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const deviceId = Number(req.params.id);
    const row = getAssetById(deviceId) as any;

    if (!row) {
      res.status(404).json({ error: "Asset not found", code: "ASSET_NOT_FOUND" });
      return;
    }

    // Get SLA from chain
    let sla = { totalBatches: 0, avgUptime: 0, avgOutput: 0, freshnessPenalties: 0, lastSubmission: 0 };
    try {
      const chainSla = await fetchSLAFromChain(deviceId);
      sla = {
        totalBatches: chainSla.totalBatches,
        avgUptime: chainSla.totalBatches > 0
          ? Math.round(chainSla.cumulativeUptime / chainSla.totalBatches) / 100
          : 0,
        avgOutput: chainSla.totalBatches > 0
          ? Math.round((chainSla.cumulativeOutput / chainSla.totalBatches) * 10) / 10
          : 0,
        freshnessPenalties: chainSla.freshnessPenalties,
        lastSubmission: chainSla.lastSubmission,
      };
    } catch { /* chain unavailable, use defaults */ }

    // Get latest batch from DB
    const { rows: batchRows } = getBatchesByDevice(deviceId, 1, 1);
    let latestBatch = null;
    if (batchRows.length > 0) {
      const b = batchRows[0] as any;
      latestBatch = {
        batchId: b.batch_id,
        windowStart: b.window_start,
        windowEnd: b.window_end,
        avgOutput: b.avg_output,
        uptimeBps: b.uptime_bps,
        uptimePercent: b.uptime_bps / 100,
        ipfsCid: b.ipfs_cid,
        submittedAt: b.submitted_at,
        txHash: b.tx_hash,
      };
    }

    res.json({
      id: row.device_id,
      deviceType: row.device_type,
      deviceTypeLabel: DEVICE_TYPE_LABELS[row.device_type] || "Unknown",
      status: row.status,
      statusLabel: DEVICE_STATUS_LABELS[row.status] || "Unknown",
      location: row.location,
      region: row.region,
      latitude: row.latitude,
      longitude: row.longitude,
      capacity: row.capacity,
      capacityKw: row.capacity / 1000,
      minOutput: row.min_output,
      maxOutput: row.max_output,
      samplingRateSeconds: row.sampling_rate_seconds,
      operator: row.operator,
      registeredAt: row.registered_at,
      sla,
      latestBatch,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, code: "INTERNAL_ERROR" });
  }
});

// GET /api/assets/:id/batches
router.get("/:id/batches", async (req: Request, res: Response) => {
  try {
    const deviceId = Number(req.params.id);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const { rows, total } = getBatchesByDevice(deviceId, page, limit);

    const batches = (rows as any[]).map((b) => ({
      batchId: b.batch_id,
      windowStart: b.window_start,
      windowEnd: b.window_end,
      dataRoot: b.data_root,
      ipfsCid: b.ipfs_cid,
      avgOutput: b.avg_output,
      uptimeBps: b.uptime_bps,
      uptimePercent: b.uptime_bps / 100,
      submitter: b.submitter,
      submittedAt: b.submitted_at,
      txHash: b.tx_hash,
      blockNumber: b.block_number,
      disputed: !!b.disputed,
    }));

    res.json({ assetId: deviceId, batches, total, page, limit });
  } catch (err: any) {
    res.status(500).json({ error: err.message, code: "INTERNAL_ERROR" });
  }
});

export default router;
