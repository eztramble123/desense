import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Seeding batches with wallet:", signer.address);

  const commitment = await ethers.getContractAt("DataCommitment", process.env.NEXT_PUBLIC_DATA_COMMITMENT!, signer);
  const marketplace = await ethers.getContractAt("DataMarketplace", process.env.NEXT_PUBLIC_DATA_MARKETPLACE!, signer);
  const trigger = await ethers.getContractAt("FinancingTrigger", process.env.NEXT_PUBLIC_FINANCING_TRIGGER!, signer);
  const registry = await ethers.getContractAt("DeviceRegistry", process.env.NEXT_PUBLIC_DEVICE_REGISTRY!, signer);

  const now = Math.floor(Date.now() / 1000);

  // Submit sample batches
  console.log("\n--- Submitting Sample Batches ---");
  for (let i = 0; i < 4; i++) {
    const dataRoot = ethers.keccak256(ethers.toUtf8Bytes(`demo-batch-device-${i}-${Date.now()}`));
    const windowStart = now - 600 - (i * 600);
    const windowEnd = windowStart + 300;
    const tx = await commitment.submitBatch(
      i,
      windowStart,
      windowEnd,
      dataRoot,
      `QmDemo${i}BatchCid${Date.now().toString(36)}`,
      50 + i * 10,
      9000 + i * 200,
    );
    await tx.wait();
    console.log(`Submitted batch for device ${i} (window: ${windowStart}-${windowEnd})`);
  }

  // Create a data order
  console.log("\n--- Creating Data Order ---");
  let tx = await marketplace.createOrder(
    0,
    "MENA-UAE",
    8000,
    30,
    86400 * 30,
    ethers.parseEther("0.01"),
    { value: ethers.parseEther("1") }
  );
  await tx.wait();
  console.log("Created order (Solar, MENA-UAE, 1 ADI escrow)");

  // Match device to order
  console.log("\n--- Matching Device to Order ---");
  tx = await marketplace.matchDevice(0, 0);
  await tx.wait();
  console.log("Matched device 0 to order 0");

  // Create financing trigger
  console.log("\n--- Creating Financing Trigger ---");
  tx = await trigger.createTrigger(
    signer.address,
    0,
    0,
    40,
    86400 * 7,
    3,
    { value: ethers.parseEther("0.5") }
  );
  await tx.wait();
  console.log("Created trigger (Solar > 40 kWh for 3 batches -> 0.5 ADI)");

  console.log("\n--- Seed Complete ---");
  console.log("Total devices:", (await registry.totalDevices()).toString());
  console.log("Total batches:", (await commitment.totalBatches()).toString());
  console.log("Total orders:", (await marketplace.totalOrders()).toString());
  console.log("Total triggers:", (await trigger.totalTriggers()).toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
