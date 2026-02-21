import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { SensorReading } from "../generators";
import { ethers } from "ethers";

export interface MerkleResult {
  root: string;
  leaves: string[];
  tree: StandardMerkleTree<[string, string, string]>;
}

export function computeMerkleRoot(readings: SensorReading[]): MerkleResult {
  // Each leaf is [timestamp, output, uptime]
  const values: [string, string, string][] = readings.map((r) => [
    r.timestamp.toString(),
    Math.round(r.output * 100).toString(), // 2 decimal precision as integer
    r.uptime ? "1" : "0",
  ]);

  const tree = StandardMerkleTree.of(values, ["string", "string", "string"]);
  const root = tree.root;

  const leaves = values.map((v) =>
    ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["string", "string", "string"], v))
  );

  return { root, leaves, tree };
}
