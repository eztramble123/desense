import { ethers } from "hardhat";
import { Wallet, Provider } from "zksync-ethers";
import "dotenv/config";

async function main() {
  const provider = new Provider("https://rpc.ab.testnet.adifoundation.ai/");
  const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);

  // Load contract addresses from env
  const addresses = {
    accessControl: process.env.NEXT_PUBLIC_ACCESS_CONTROL!,
    registry: process.env.NEXT_PUBLIC_DEVICE_REGISTRY!,
    commitment: process.env.NEXT_PUBLIC_DATA_COMMITMENT!,
    marketplace: process.env.NEXT_PUBLIC_DATA_MARKETPLACE!,
    trigger: process.env.NEXT_PUBLIC_FINANCING_TRIGGER!,
  };

  console.log("Seeding demo data with wallet:", wallet.address);

  // Get contract instances
  const accessControl = await ethers.getContractAt("DeSenseAccessControl", addresses.accessControl, wallet as any);
  const registry = await ethers.getContractAt("DeviceRegistry", addresses.registry, wallet as any);
  const commitment = await ethers.getContractAt("DataCommitment", addresses.commitment, wallet as any);
  const marketplace = await ethers.getContractAt("DataMarketplace", addresses.marketplace, wallet as any);
  const trigger = await ethers.getContractAt("FinancingTrigger", addresses.trigger, wallet as any);

  // 1. Grant roles
  console.log("\n--- Granting Roles ---");
  let tx = await accessControl.grantOperatorRole(wallet.address);
  await tx.wait();
  console.log("Granted OPERATOR_ROLE to deployer");

  tx = await accessControl.grantBuyerRole(wallet.address);
  await tx.wait();
  console.log("Granted BUYER_ROLE to deployer");

  // 2. Register devices
  console.log("\n--- Registering Devices ---");

  // Solar Panel
  tx = await registry.registerDevice(
    0, // SolarPanel
    "25.2048,55.2708", // Dubai coordinates
    "MENA-UAE",
    0,
    100, // max 100 kWh
    30
  );
  await tx.wait();
  console.log("Registered Solar Panel (device 0)");

  // Power Meter
  tx = await registry.registerDevice(
    1, // PowerMeter
    "25.1985,55.2796", // Dubai coordinates
    "MENA-UAE",
    0,
    500,
    60
  );
  await tx.wait();
  console.log("Registered Power Meter (device 1)");

  // Transformer
  tx = await registry.registerDevice(
    2, // Transformer
    "24.4539,54.3773", // Abu Dhabi
    "MENA-UAE",
    0,
    1000,
    60
  );
  await tx.wait();
  console.log("Registered Transformer (device 2)");

  // Wind Turbine
  tx = await registry.registerDevice(
    3, // WindTurbine
    "25.0657,55.1713", // Jebel Ali
    "MENA-UAE",
    0,
    200,
    30
  );
  await tx.wait();
  console.log("Registered Wind Turbine (device 3)");

  // 3. Submit sample batches
  console.log("\n--- Submitting Sample Batches ---");
  const now = Math.floor(Date.now() / 1000);

  for (let i = 0; i < 4; i++) {
    const dataRoot = ethers.keccak256(ethers.toUtf8Bytes(`demo-batch-device-${i}-${Date.now()}`));
    tx = await commitment.submitBatch(
      i, // deviceId
      now - 300, // 5 min ago
      now,
      dataRoot,
      `QmDemo${i}BatchCid${Date.now().toString(36)}`,
      50 + i * 10, // avg output
      9000 + i * 200, // uptime bps (90%+)
    );
    await tx.wait();
    console.log(`Submitted batch for device ${i}`);
  }

  // 4. Create a data order
  console.log("\n--- Creating Data Order ---");
  tx = await marketplace.createOrder(
    0, // SolarPanel
    "MENA-UAE",
    8000, // 80% min uptime
    30, // min 30 kWh avg output
    86400 * 30, // 30 day duration
    ethers.parseEther("0.01"), // 0.01 ADI per batch
    { value: ethers.parseEther("1") } // 1 ADI escrow
  );
  await tx.wait();
  console.log("Created order 0 (Solar, MENA-UAE, 1 ADI escrow)");

  // 5. Match device to order
  console.log("\n--- Matching Device to Order ---");
  tx = await marketplace.matchDevice(0, 0); // order 0, device 0
  await tx.wait();
  console.log("Matched device 0 to order 0");

  // 6. Create financing trigger
  console.log("\n--- Creating Financing Trigger ---");
  tx = await trigger.createTrigger(
    wallet.address, // beneficiary
    0, // deviceId (Solar Panel)
    0, // OutputAbove
    40, // threshold: 40 kWh
    86400 * 7, // 7 day observation
    3, // 3 consecutive qualifying batches
    { value: ethers.parseEther("0.5") } // 0.5 ADI payout
  );
  await tx.wait();
  console.log("Created trigger 0 (Solar Panel > 40 kWh for 3 batches -> 0.5 ADI)");

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
