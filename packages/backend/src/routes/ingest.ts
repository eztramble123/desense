import { Router, Request, Response } from "express";
import { attestReadings, SensorReading } from "../services/attestation";

const router = Router();

// POST /api/ingest/readings
router.post("/readings", async (req: Request, res: Response) => {
  try {
    const { deviceId, readings, source } = req.body;

    if (deviceId === undefined || !Array.isArray(readings) || readings.length === 0) {
      res.status(400).json({
        error: "Missing required fields: deviceId (number), readings (non-empty array)",
        code: "BAD_REQUEST",
      });
      return;
    }

    // Validate readings format
    const validReadings: SensorReading[] = readings.map((r: any) => {
      if (r.timestamp === undefined || r.output === undefined || r.uptime === undefined) {
        throw new Error("Each reading must have timestamp, output, and uptime fields");
      }
      return {
        timestamp: Number(r.timestamp),
        output: Number(r.output),
        uptime: Boolean(r.uptime),
      };
    });

    console.log(`[Ingest] Received ${validReadings.length} readings for device ${deviceId} (source: ${source || "unknown"})`);

    const result = await attestReadings(Number(deviceId), validReadings);

    res.json({
      accepted: true,
      deviceId: Number(deviceId),
      readingsReceived: validReadings.length,
      batchId: result.batchId,
      dataRoot: result.dataRoot,
      ipfsCid: result.ipfsCid,
      txHash: result.txHash,
    });
  } catch (err: any) {
    console.error("[Ingest] Error:", err.message);
    res.status(500).json({ error: err.message, code: "INGEST_ERROR" });
  }
});

export default router;
