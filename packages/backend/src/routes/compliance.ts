import { Router, Request, Response } from "express";
import { generateComplianceReport } from "../services/compliance";

const router = Router();

// GET /api/compliance/:assetId/report
router.get("/:assetId/report", async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.assetId);
    const now = Math.floor(Date.now() / 1000);

    const from = Number(req.query.from) || now - 86400 * 30; // default: last 30 days
    const to = Number(req.query.to) || now;

    const report = await generateComplianceReport(assetId, from, to);
    res.json(report);
  } catch (err: any) {
    if (err.message === "Asset not found") {
      res.status(404).json({ error: "Asset not found", code: "ASSET_NOT_FOUND" });
      return;
    }
    res.status(500).json({ error: err.message, code: "INTERNAL_ERROR" });
  }
});

export default router;
