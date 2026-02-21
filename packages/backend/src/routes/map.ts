import { Router, Request, Response } from "express";
import { getMapAssets } from "../db/queries";
import { DEVICE_TYPE_LABELS, DEVICE_STATUS_LABELS } from "../config";

const router = Router();

// GET /api/map/assets
router.get("/assets", async (req: Request, res: Response) => {
  try {
    const rows = getMapAssets() as any[];

    const assets = rows.map((row) => {
      const capacityKw = row.capacity / 1000;
      const capacityFactor = capacityKw > 0 && row.latest_avg_output
        ? Math.round((row.latest_avg_output / capacityKw) * 10000) / 100
        : 0;

      return {
        id: row.device_id,
        deviceType: row.device_type,
        deviceTypeLabel: DEVICE_TYPE_LABELS[row.device_type] || "Unknown",
        status: row.status,
        statusLabel: DEVICE_STATUS_LABELS[row.status] || "Unknown",
        latitude: row.latitude,
        longitude: row.longitude,
        capacityKw,
        region: row.region,
        operator: row.operator,
        latestGeneration: row.latest_batch_id ? {
          avgOutput: row.latest_avg_output,
          uptimePercent: row.latest_uptime_bps / 100,
          capacityFactor,
          lastUpdated: row.latest_submitted_at,
        } : null,
      };
    });

    res.json({ assets });
  } catch (err: any) {
    res.status(500).json({ error: err.message, code: "INTERNAL_ERROR" });
  }
});

export default router;
