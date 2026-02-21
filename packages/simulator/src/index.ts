import "dotenv/config";
import { generateReadings } from "./generators";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

// Devices to simulate (populated during seed)
const DEVICES = [
  { id: 0, type: 0, name: "Solar Array #1" },
  { id: 1, type: 1, name: "Wind Turbine #1" },
  { id: 2, type: 2, name: "Hydro Turbine #1" },
  { id: 3, type: 3, name: "Smart Meter #1" },
];

const BATCH_INTERVAL_MS = 30_000; // 30 seconds for demo
const READINGS_PER_BATCH = 10;
const READING_INTERVAL_SECONDS = 3; // 10 readings * 3s = 30s window

async function submitToBackend(deviceId: number, readings: Array<{ timestamp: number; output: number; uptime: boolean }>) {
  const response = await fetch(`${BACKEND_URL}/api/ingest/readings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId,
      source: "simulator",
      readings,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Backend returned ${response.status}: ${body}`);
  }

  return await response.json() as {
    accepted: boolean;
    batchId: number;
    dataRoot: string;
    ipfsCid: string;
    txHash: string;
  };
}

async function runBatchCycle() {
  console.log(`\n=== Batch Cycle @ ${new Date().toISOString()} ===`);

  for (const device of DEVICES) {
    try {
      console.log(`\n[${device.name}]`);

      // 1. Generate readings
      const readings = generateReadings(device.type, READINGS_PER_BATCH, READING_INTERVAL_SECONDS);
      console.log(`  Generated ${readings.length} readings`);

      // 2. Submit to backend (handles Merkle, IPFS, chain, triggers, orders)
      const result = await submitToBackend(device.id, readings);
      console.log(`  Batch ${result.batchId} attested (tx: ${result.txHash})`);
      console.log(`  IPFS: ${result.ipfsCid}`);

    } catch (err: any) {
      console.error(`  ERROR: ${err.message}`);
    }
  }
}

async function main() {
  console.log("Zeus Simulator Starting...");
  console.log(`Backend: ${BACKEND_URL}`);

  // Run first cycle immediately
  await runBatchCycle();

  // Then run on interval
  console.log(`\nScheduling batches every ${BATCH_INTERVAL_MS / 1000}s...`);
  setInterval(() => runBatchCycle(), BATCH_INTERVAL_MS);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
