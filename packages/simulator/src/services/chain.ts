import { ethers } from "ethers";
import { BatchData } from "./batcher";

// DataCommitment ABI (only what we need)
const COMMITMENT_ABI = [
  "function submitBatch(uint256 deviceId, uint256 windowStart, uint256 windowEnd, bytes32 dataRoot, string ipfsCid, uint256 avgOutput, uint256 uptimeBps) returns (uint256)",
  "event BatchSubmitted(uint256 indexed batchId, uint256 indexed deviceId, bytes32 dataRoot, string ipfsCid, uint256 avgOutput, uint256 uptimeBps)",
];

const TRIGGER_ABI = [
  "function evaluate(uint256 triggerId, uint256 batchId)",
  "function getTrigger(uint256 triggerId) view returns (tuple(address creator, address beneficiary, uint256 deviceId, uint8 triggerType, uint256 threshold, uint256 observationPeriod, uint256 requiredStreak, uint256 currentStreak, uint256 escrowedPayout, uint8 status, uint256 createdAt, uint256 expiresAt, uint256 lastEvaluatedBatch))",
  "function totalTriggers() view returns (uint256)",
  "event TriggerEvaluated(uint256 indexed triggerId, uint256 batchId, bool qualifying, uint256 currentStreak)",
  "event TriggerActivated(uint256 indexed triggerId, address indexed beneficiary, uint256 payout)",
];

const MARKETPLACE_ABI = [
  "function settleBatch(uint256 orderId, uint256 batchId)",
  "function getOrder(uint256 orderId) view returns (tuple(address buyer, uint8 deviceType, string region, uint256 minUptimeBps, uint256 minAvgOutput, uint256 duration, uint256 pricePerBatch, uint256 totalEscrow, uint256 remainingEscrow, uint256 createdAt, uint256 expiresAt, uint8 status))",
  "function getOrderDevices(uint256 orderId) view returns (uint256[])",
  "function totalOrders() view returns (uint256)",
  "function isBatchSettled(uint256 orderId, uint256 batchId) view returns (bool)",
  "event BatchSettled(uint256 indexed orderId, uint256 indexed batchId, uint256 payout)",
];

export class ChainSubmitter {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private commitment: ethers.Contract;
  private trigger: ethers.Contract;
  private marketplace: ethers.Contract;

  constructor(
    rpcUrl: string,
    privateKey: string,
    commitmentAddr: string,
    triggerAddr: string,
    marketplaceAddr: string
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.commitment = new ethers.Contract(commitmentAddr, COMMITMENT_ABI, this.wallet);
    this.trigger = new ethers.Contract(triggerAddr, TRIGGER_ABI, this.wallet);
    this.marketplace = new ethers.Contract(marketplaceAddr, MARKETPLACE_ABI, this.wallet);
  }

  async submitBatch(batch: BatchData, merkleRoot: string, ipfsCid: string): Promise<number> {
    console.log(`  [Chain] Submitting batch for device ${batch.deviceId}...`);
    const tx = await this.commitment.submitBatch(
      batch.deviceId,
      batch.windowStart,
      batch.windowEnd,
      merkleRoot,
      ipfsCid,
      batch.avgOutput,
      batch.uptimeBps
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find((l: any) => {
      try {
        return this.commitment.interface.parseLog(l)?.name === "BatchSubmitted";
      } catch {
        return false;
      }
    });

    const parsed = this.commitment.interface.parseLog(event);
    const batchId = Number(parsed!.args[0]);
    console.log(`  [Chain] Batch ${batchId} submitted (tx: ${receipt.hash})`);
    return batchId;
  }

  async evaluateTriggers(batchId: number, deviceId: number): Promise<void> {
    const totalTriggers = Number(await this.trigger.totalTriggers());

    for (let i = 0; i < totalTriggers; i++) {
      try {
        const t = await this.trigger.getTrigger(i);
        // Only evaluate active triggers for this device
        if (Number(t.status) === 0 && Number(t.deviceId) === deviceId) {
          console.log(`  [Chain] Evaluating trigger ${i} with batch ${batchId}...`);
          const tx = await this.trigger.evaluate(i, batchId);
          const receipt = await tx.wait();
          console.log(`  [Chain] Trigger ${i} evaluated (tx: ${receipt.hash})`);
        }
      } catch (err: any) {
        console.log(`  [Chain] Trigger ${i} evaluation skipped: ${err.message?.slice(0, 80)}`);
      }
    }
  }

  async settleOrders(batchId: number, deviceId: number): Promise<void> {
    const totalOrders = Number(await this.marketplace.totalOrders());

    for (let i = 0; i < totalOrders; i++) {
      try {
        const order = await this.marketplace.getOrder(i);
        // Only settle active orders
        if (Number(order.status) === 1) {
          const devices: bigint[] = await this.marketplace.getOrderDevices(i);
          if (devices.some((d: bigint) => Number(d) === deviceId)) {
            const isSettled = await this.marketplace.isBatchSettled(i, batchId);
            if (!isSettled) {
              console.log(`  [Chain] Settling batch ${batchId} for order ${i}...`);
              const tx = await this.marketplace.settleBatch(i, batchId);
              const receipt = await tx.wait();
              console.log(`  [Chain] Order ${i} settled (tx: ${receipt.hash})`);
            }
          }
        }
      } catch (err: any) {
        console.log(`  [Chain] Order ${i} settlement skipped: ${err.message?.slice(0, 80)}`);
      }
    }
  }
}
