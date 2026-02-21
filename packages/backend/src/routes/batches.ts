import { Router, Request, Response } from "express";
import { getBatches, getBatchById } from "../db/queries";
import { verifyReading } from "../services/verification";
import { DEVICE_TYPE_LABELS } from "../config";

const router = Router();

// GET /api/batches
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const deviceId = req.query.deviceId !== undefined ? Number(req.query.deviceId) : undefined;

    const { rows, total } = getBatches({ deviceId, page, limit });

    const batches = (rows as any[]).map((b) => ({
      batchId: b.batch_id,
      deviceId: b.device_id,
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

    res.json({ batches, total, page, limit });
  } catch (err: any) {
    res.status(500).json({ error: err.message, code: "INTERNAL_ERROR" });
  }
});

// GET /api/batches/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const batchId = Number(req.params.id);
    const b = getBatchById(batchId) as any;

    if (!b) {
      res.status(404).json({ error: "Batch not found", code: "BATCH_NOT_FOUND" });
      return;
    }

    res.json({
      batchId: b.batch_id,
      deviceId: b.device_id,
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
      disputeReason: b.dispute_reason,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, code: "INTERNAL_ERROR" });
  }
});

// POST /api/batches/:id/verify
router.post("/:id/verify", async (req: Request, res: Response) => {
  try {
    const batchId = Number(req.params.id);
    const { timestamp, output, uptime } = req.body;

    if (timestamp === undefined || output === undefined || uptime === undefined) {
      res.status(400).json({ error: "Missing required fields: timestamp, output, uptime", code: "BAD_REQUEST" });
      return;
    }

    const result = await verifyReading(batchId, {
      timestamp: Number(timestamp),
      output: Number(output),
      uptime: Boolean(uptime),
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message, code: "INTERNAL_ERROR" });
  }
});

export default router;
