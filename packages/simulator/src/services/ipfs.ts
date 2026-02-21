import { BatchData } from "./batcher";
import { MerkleResult } from "./merkle";

export interface IPFSBatchPayload {
  deviceId: number;
  windowStart: number;
  windowEnd: number;
  avgOutput: number;
  uptimeBps: number;
  merkleRoot: string;
  readings: Array<{
    timestamp: number;
    output: number;
    uptime: boolean;
  }>;
}

// Pinata IPFS upload via REST API
export async function pinToIPFS(batch: BatchData, merkle: MerkleResult): Promise<string> {
  const payload: IPFSBatchPayload = {
    deviceId: batch.deviceId,
    windowStart: batch.windowStart,
    windowEnd: batch.windowEnd,
    avgOutput: batch.avgOutput,
    uptimeBps: batch.uptimeBps,
    merkleRoot: merkle.root,
    readings: batch.readings,
  };

  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecret = process.env.PINATA_SECRET;

  if (!pinataApiKey || !pinataSecret) {
    // Fallback: return a mock CID for demo without Pinata
    const mockCid = `QmDemo${batch.deviceId}_${batch.windowStart}_${Date.now().toString(36)}`;
    console.log(`  [IPFS] No Pinata keys, using mock CID: ${mockCid}`);
    return mockCid;
  }

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecret,
    },
    body: JSON.stringify({
      pinataContent: payload,
      pinataMetadata: {
        name: `zeus-attestation-${batch.deviceId}-${batch.windowStart}`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Pinata upload failed: ${response.statusText}`);
  }

  const data = (await response.json()) as { IpfsHash: string };
  return data.IpfsHash;
}
