import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { ethers } from "ethers";
import { getCommitment, getTrigger, getMarketplace } from "./chain";
import { upsertBatch } from "../db/queries";
import { config } from "../config";

export interface SensorReading {
  timestamp: number;
  output: number; // kWh
  uptime: boolean;
}

export interface AttestationResult {
  batchId: number;
  dataRoot: string;
  ipfsCid: string;
  txHash: string;
  tree: StandardMerkleTree<[string, string, string]>;
}

// Transaction mutex to prevent nonce conflicts when multiple ingests arrive concurrently
let txQueue: Promise<any> = Promise.resolve();

function withTxLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = txQueue.then(fn, fn); // run even if previous failed
  txQueue = result.catch(() => {}); // swallow to keep chain going
  return result;
}

export async function attestReadings(
  deviceId: number,
  readings: SensorReading[]
): Promise<AttestationResult> {
  if (readings.length === 0) {
    throw new Error("No readings to attest");
  }

  // Sort by timestamp
  readings.sort((a, b) => a.timestamp - b.timestamp);

  const windowStart = readings[0].timestamp;
  const windowEnd = readings[readings.length - 1].timestamp;

  // Compute averages
  const totalOutput = readings.reduce((sum, r) => sum + r.output, 0);
  const avgOutput = Math.round(totalOutput / readings.length);
  const uptimeCount = readings.filter((r) => r.uptime).length;
  const uptimeBps = Math.round((uptimeCount / readings.length) * 10000);

  // Build Merkle tree
  const values: [string, string, string][] = readings.map((r) => [
    r.timestamp.toString(),
    Math.round(r.output * 100).toString(),
    r.uptime ? "1" : "0",
  ]);

  const tree = StandardMerkleTree.of(values, ["string", "string", "string"]);
  const dataRoot = tree.root;

  // Pin to IPFS
  const ipfsCid = await pinToIPFS(deviceId, windowStart, windowEnd, avgOutput, uptimeBps, dataRoot, readings);

  // Submit on-chain (serialized to prevent nonce conflicts)
  const { batchId, receipt } = await withTxLock(async () => {
    const commitment = getCommitment();
    const tx = await commitment.submitBatch(
      deviceId,
      windowStart,
      windowEnd,
      dataRoot,
      ipfsCid,
      avgOutput,
      uptimeBps
    );

    const txReceipt = await tx.wait();

    // Parse batchId from event
    let parsedBatchId = 0;
    for (const log of txReceipt.logs) {
      try {
        const parsed = commitment.interface.parseLog(log);
        if (parsed?.name === "BatchSubmitted") {
          parsedBatchId = Number(parsed.args[0]);
          break;
        }
      } catch { /* skip non-matching logs */ }
    }

    return { batchId: parsedBatchId, receipt: txReceipt };
  });

  // Index locally
  upsertBatch({
    batchId,
    deviceId,
    windowStart,
    windowEnd,
    dataRoot,
    ipfsCid,
    avgOutput,
    uptimeBps,
    submitter: receipt.from,
    submittedAt: Math.floor(Date.now() / 1000),
    blockNumber: receipt.blockNumber,
    txHash: receipt.hash,
  });

  // Evaluate triggers & settle orders in background (also serialized)
  withTxLock(() => evaluateTriggersForBatch(batchId, deviceId)).catch((err) =>
    console.error("[Attestation] Trigger eval error:", err.message)
  );
  withTxLock(() => settleOrdersForBatch(batchId, deviceId)).catch((err) =>
    console.error("[Attestation] Order settle error:", err.message)
  );

  console.log(`[Attestation] Batch ${batchId} attested for device ${deviceId} (tx: ${receipt.hash})`);

  return { batchId, dataRoot, ipfsCid, txHash: receipt.hash, tree };
}

async function pinToIPFS(
  deviceId: number,
  windowStart: number,
  windowEnd: number,
  avgOutput: number,
  uptimeBps: number,
  merkleRoot: string,
  readings: SensorReading[]
): Promise<string> {
  const payload = { deviceId, windowStart, windowEnd, avgOutput, uptimeBps, merkleRoot, readings };

  if (!config.pinataApiKey || !config.pinataSecret) {
    const mockCid = `QmZeus${deviceId}_${windowStart}_${Date.now().toString(36)}`;
    console.log(`[IPFS] No Pinata keys, using mock CID: ${mockCid}`);
    return mockCid;
  }

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: config.pinataApiKey,
      pinata_secret_api_key: config.pinataSecret,
    },
    body: JSON.stringify({
      pinataContent: payload,
      pinataMetadata: { name: `zeus-attestation-${deviceId}-${windowStart}` },
    }),
  });

  if (!response.ok) {
    throw new Error(`Pinata upload failed: ${response.statusText}`);
  }

  const data = (await response.json()) as { IpfsHash: string };
  return data.IpfsHash;
}

async function evaluateTriggersForBatch(batchId: number, deviceId: number) {
  const triggerContract = getTrigger();
  const totalTriggers = Number(await triggerContract.totalTriggers());

  for (let i = 0; i < totalTriggers; i++) {
    try {
      const t = await triggerContract.getTrigger(i);
      if (Number(t.status) === 0 && Number(t.deviceId) === deviceId) {
        const tx = await triggerContract.evaluate(i, batchId);
        await tx.wait();
        console.log(`[Attestation] Trigger ${i} evaluated with batch ${batchId}`);
      }
    } catch (err: any) {
      // Skip — trigger may already be evaluated or expired
    }
  }
}

async function settleOrdersForBatch(batchId: number, deviceId: number) {
  const marketplaceContract = getMarketplace();
  const totalOrders = Number(await marketplaceContract.totalOrders());

  for (let i = 0; i < totalOrders; i++) {
    try {
      const order = await marketplaceContract.getOrder(i);
      if (Number(order.status) === 1) {
        const devices: bigint[] = await marketplaceContract.getOrderDevices(i);
        if (devices.some((d: bigint) => Number(d) === deviceId)) {
          const isSettled = await marketplaceContract.isBatchSettled(i, batchId);
          if (!isSettled) {
            const tx = await marketplaceContract.settleBatch(i, batchId);
            await tx.wait();
            console.log(`[Attestation] Order ${i} settled for batch ${batchId}`);
          }
        }
      }
    } catch (err: any) {
      // Skip — order may not qualify
    }
  }
}
