import "dotenv/config";
import { generateReadings } from "./generators";
import { createBatch } from "./services/batcher";
import { computeMerkleRoot } from "./services/merkle";
import { pinToIPFS } from "./services/ipfs";
import { ChainSubmitter } from "./services/chain";

const RPC_URL = process.env.RPC_URL || "https://rpc.ab.testnet.adifoundation.ai/";
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const COMMITMENT_ADDR = process.env.NEXT_PUBLIC_DATA_COMMITMENT!;
const TRIGGER_ADDR = process.env.NEXT_PUBLIC_FINANCING_TRIGGER!;
const MARKETPLACE_ADDR = process.env.NEXT_PUBLIC_DATA_MARKETPLACE!;

// Devices to simulate (populated during seed)
const DEVICES = [
  { id: 0, type: 0, name: "Solar Panel #1" },
  { id: 1, type: 1, name: "Power Meter #1" },
  { id: 2, type: 2, name: "Transformer #1" },
  { id: 3, type: 3, name: "Wind Turbine #1" },
];

const BATCH_INTERVAL_MS = 30_000; // 30 seconds for demo
const READINGS_PER_BATCH = 10;
const READING_INTERVAL_SECONDS = 3; // 10 readings * 3s = 30s window

async function runBatchCycle(submitter: ChainSubmitter) {
  console.log(`\n=== Batch Cycle @ ${new Date().toISOString()} ===`);

  for (const device of DEVICES) {
    try {
      console.log(`\n[${device.name}]`);

      // 1. Generate readings
      const readings = generateReadings(device.type, READINGS_PER_BATCH, READING_INTERVAL_SECONDS);
      console.log(`  Generated ${readings.length} readings`);

      // 2. Create batch
      const batch = createBatch(device.id, readings);
      console.log(`  Batch: avg=${batch.avgOutput}, uptime=${batch.uptimeBps}bps`);

      // 3. Compute Merkle root
      const merkle = computeMerkleRoot(readings);
      console.log(`  Merkle root: ${merkle.root.slice(0, 18)}...`);

      // 4. Pin to IPFS
      const ipfsCid = await pinToIPFS(batch, merkle);
      console.log(`  IPFS CID: ${ipfsCid}`);

      // 5. Submit onchain
      const batchId = await submitter.submitBatch(batch, merkle.root, ipfsCid);

      // 6. Evaluate triggers & settle orders
      await submitter.evaluateTriggers(batchId, device.id);
      await submitter.settleOrders(batchId, device.id);

    } catch (err: any) {
      console.error(`  ERROR: ${err.message}`);
    }
  }
}

async function main() {
  console.log("DeSense Simulator Starting...");
  console.log(`RPC: ${RPC_URL}`);
  console.log(`Commitment: ${COMMITMENT_ADDR}`);
  console.log(`Trigger: ${TRIGGER_ADDR}`);
  console.log(`Marketplace: ${MARKETPLACE_ADDR}`);

  if (!PRIVATE_KEY) {
    console.error("PRIVATE_KEY not set");
    process.exit(1);
  }

  const submitter = new ChainSubmitter(
    RPC_URL,
    PRIVATE_KEY,
    COMMITMENT_ADDR,
    TRIGGER_ADDR,
    MARKETPLACE_ADDR
  );

  // Run first cycle immediately
  await runBatchCycle(submitter);

  // Then run on interval
  console.log(`\nScheduling batches every ${BATCH_INTERVAL_MS / 1000}s...`);
  setInterval(() => runBatchCycle(submitter), BATCH_INTERVAL_MS);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
