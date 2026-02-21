import { ethers } from "ethers";
import { getProvider, getRegistry, getCommitment, getTrigger, getMarketplace, fetchDeviceFromChain } from "./chain";
import { upsertAsset, upsertBatch, markBatchDisputed, getIndexerState, setIndexerState } from "../db/queries";

const POLL_INTERVAL_MS = 10_000; // 10 seconds
const BATCH_SIZE = 500; // blocks per query

let polling = false;

export async function startIndexer() {
  console.log("[Indexer] Starting event indexer...");

  // Backfill from last indexed block
  await backfill();

  // Start polling for new events
  polling = true;
  pollLoop();
}

export function stopIndexer() {
  polling = false;
}

async function pollLoop() {
  while (polling) {
    try {
      await backfill();
    } catch (err: any) {
      console.error("[Indexer] Poll error:", err.message);
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

async function backfill() {
  const provider = getProvider();
  const currentBlock = await provider.getBlockNumber();
  const lastIndexed = Number(getIndexerState("lastBlock") || "0");

  if (lastIndexed >= currentBlock) return;

  let fromBlock = lastIndexed + 1;

  while (fromBlock <= currentBlock) {
    const toBlock = Math.min(fromBlock + BATCH_SIZE - 1, currentBlock);

    await Promise.all([
      indexDeviceEvents(fromBlock, toBlock),
      indexBatchEvents(fromBlock, toBlock),
      indexDisputeEvents(fromBlock, toBlock),
    ]);

    setIndexerState("lastBlock", toBlock.toString());
    fromBlock = toBlock + 1;
  }

  console.log(`[Indexer] Indexed up to block ${currentBlock}`);
}

async function indexDeviceEvents(fromBlock: number, toBlock: number) {
  const registry = getRegistry();
  const filter = registry.filters.DeviceRegistered();
  const events = await registry.queryFilter(filter, fromBlock, toBlock);

  for (const event of events) {
    const log = event as ethers.EventLog;
    const deviceId = Number(log.args[0]);

    try {
      const device = await fetchDeviceFromChain(deviceId);
      upsertAsset({
        ...device,
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
      });
      console.log(`[Indexer] Indexed device ${deviceId}`);
    } catch (err: any) {
      console.error(`[Indexer] Failed to index device ${deviceId}:`, err.message);
    }
  }
}

async function indexBatchEvents(fromBlock: number, toBlock: number) {
  const commitment = getCommitment();
  const filter = commitment.filters.BatchSubmitted();
  const events = await commitment.queryFilter(filter, fromBlock, toBlock);

  for (const event of events) {
    const log = event as ethers.EventLog;
    const batchId = Number(log.args[0]);
    const deviceId = Number(log.args[1]);
    const dataRoot = log.args[2] as string;
    const ipfsCid = log.args[3] as string;
    const avgOutput = Number(log.args[4]);
    const uptimeBps = Number(log.args[5]);

    // Get block timestamp for submittedAt
    const block = await log.getBlock();
    const submittedAt = block?.timestamp || Math.floor(Date.now() / 1000);

    upsertBatch({
      batchId,
      deviceId,
      windowStart: 0, // Not in event, will be enriched from chain if needed
      windowEnd: 0,
      dataRoot,
      ipfsCid,
      avgOutput,
      uptimeBps,
      submitter: log.transactionHash ? (await log.getTransaction())?.from || "" : "",
      submittedAt,
      blockNumber: log.blockNumber,
      txHash: log.transactionHash,
    });
    console.log(`[Indexer] Indexed batch ${batchId} for device ${deviceId}`);
  }
}

async function indexDisputeEvents(fromBlock: number, toBlock: number) {
  const commitment = getCommitment();
  const filter = commitment.filters.BatchDisputed();
  const events = await commitment.queryFilter(filter, fromBlock, toBlock);

  for (const event of events) {
    const log = event as ethers.EventLog;
    const batchId = Number(log.args[0]);
    const reason = log.args[2] as string;

    markBatchDisputed(batchId, reason);
    console.log(`[Indexer] Batch ${batchId} disputed`);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
