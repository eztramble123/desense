import { Router, Request, Response } from "express";
import { getNetworkStats } from "../db/queries";
import { DEVICE_TYPE_LABELS } from "../config";

const router = Router();

// GET /api/stats
router.get("/", async (req: Request, res: Response) => {
  try {
    const { assetStats, batchStats, assetsByType, last24h } = getNetworkStats();

    const typeMap: Record<string, number> = {};
    for (const row of assetsByType) {
      const label = DEVICE_TYPE_LABELS[row.device_type] || "Unknown";
      typeMap[label] = row.count;
    }

    const totalBatches = batchStats.total_batches || 0;
    const avgUptimeBps = batchStats.avg_uptime_bps || 0;

    res.json({
      totalAssets: assetStats.total_assets || 0,
      activeAssets: assetStats.active_assets || 0,
      totalBatches,
      totalGenerationKwh: batchStats.total_generation || 0,
      avgUptime: Math.round(avgUptimeBps) / 100,
      disputedBatches: batchStats.disputed_batches || 0,
      assetsByType: typeMap,
      last24h: {
        batchesSubmitted: last24h.batches_submitted || 0,
        generationKwh: last24h.generation_kwh || 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, code: "INTERNAL_ERROR" });
  }
});

export default router;
