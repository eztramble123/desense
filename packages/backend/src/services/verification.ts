import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { ethers } from "ethers";
import { verifyReadingOnChain } from "./chain";
import { getBatchById } from "../db/queries";
import { config } from "../config";

export interface VerificationResult {
  verified: boolean;
  batchId: number;
  dataRoot?: string;
  proof?: string[];
  leaf?: { timestamp: number; output: number; uptime: boolean };
  onChainVerified?: boolean;
  error?: string;
}

export async function verifyReading(
  batchId: number,
  reading: { timestamp: number; output: number; uptime: boolean }
): Promise<VerificationResult> {
  // Get batch from DB
  const batch = getBatchById(batchId) as any;
  if (!batch) {
    return { verified: false, batchId, error: "Batch not found" };
  }

  // Fetch IPFS payload to reconstruct tree
  const ipfsData = await fetchIPFSPayload(batch.ipfs_cid);
  if (!ipfsData || !ipfsData.readings) {
    return { verified: false, batchId, error: "Could not fetch batch data from IPFS" };
  }

  // Reconstruct Merkle tree
  const values: [string, string, string][] = ipfsData.readings.map((r: any) => [
    r.timestamp.toString(),
    Math.round(r.output * 100).toString(),
    r.uptime ? "1" : "0",
  ]);

  const tree = StandardMerkleTree.of(values, ["string", "string", "string"]);

  // Find the reading in the tree
  const targetValue: [string, string, string] = [
    reading.timestamp.toString(),
    Math.round(reading.output * 100).toString(),
    reading.uptime ? "1" : "0",
  ];

  let proof: string[] | undefined;
  let leafHash: string | undefined;

  for (const [i, v] of tree.entries()) {
    if (v[0] === targetValue[0] && v[1] === targetValue[1] && v[2] === targetValue[2]) {
      proof = tree.getProof(i);
      leafHash = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32"],
          [ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(["string", "string", "string"], v)
          )]
        )
      );
      break;
    }
  }

  if (!proof || !leafHash) {
    return { verified: false, batchId, error: "Reading not found in batch Merkle tree" };
  }

  // Verify on-chain
  let onChainVerified = false;
  try {
    onChainVerified = await verifyReadingOnChain(batchId, proof, leafHash);
  } catch (err: any) {
    console.error("[Verification] On-chain verify failed:", err.message);
  }

  return {
    verified: true,
    batchId,
    dataRoot: batch.data_root,
    proof,
    leaf: reading,
    onChainVerified,
  };
}

async function fetchIPFSPayload(cid: string): Promise<any | null> {
  // Try Pinata gateway, then public IPFS gateway
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
  ];

  // Mock CIDs start with "QmZeus" or "QmDemo" — return null for those
  if (cid.startsWith("QmZeus") || cid.startsWith("QmDemo")) {
    console.log("[Verification] Mock CID detected, cannot verify readings");
    return null;
  }

  for (const url of gateways) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      continue;
    }
  }

  return null;
}
