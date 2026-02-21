import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ADI");

  // 1. ZeusAccessControl
  console.log("\n[1/5] Deploying ZeusAccessControl...");
  const AccessControl = await ethers.getContractFactory("ZeusAccessControl");
  const accessControl = await AccessControl.deploy(deployer.address);
  await accessControl.waitForDeployment();
  const acAddr = await accessControl.getAddress();
  console.log("ZeusAccessControl deployed to:", acAddr);

  // 2. DeviceRegistry
  console.log("\n[2/5] Deploying DeviceRegistry...");
  const Registry = await ethers.getContractFactory("DeviceRegistry");
  const registry = await Registry.deploy(acAddr);
  await registry.waitForDeployment();
  const regAddr = await registry.getAddress();
  console.log("DeviceRegistry deployed to:", regAddr);

  // 3. DataCommitment
  console.log("\n[3/5] Deploying DataCommitment...");
  const Commitment = await ethers.getContractFactory("DataCommitment");
  const commitment = await Commitment.deploy(acAddr, regAddr);
  await commitment.waitForDeployment();
  const cmtAddr = await commitment.getAddress();
  console.log("DataCommitment deployed to:", cmtAddr);

  // 4. DataMarketplace
  console.log("\n[4/5] Deploying DataMarketplace...");
  const Marketplace = await ethers.getContractFactory("DataMarketplace");
  const marketplace = await Marketplace.deploy(acAddr, regAddr, cmtAddr);
  await marketplace.waitForDeployment();
  const mktAddr = await marketplace.getAddress();
  console.log("DataMarketplace deployed to:", mktAddr);

  // 5. FinancingTrigger
  console.log("\n[5/5] Deploying FinancingTrigger...");
  const Trigger = await ethers.getContractFactory("FinancingTrigger");
  const trigger = await Trigger.deploy(acAddr, cmtAddr);
  await trigger.waitForDeployment();
  const trgAddr = await trigger.getAddress();
  console.log("FinancingTrigger deployed to:", trgAddr);

  console.log("\n--- Deployment Summary ---");
  console.log(`NEXT_PUBLIC_ACCESS_CONTROL=${acAddr}`);
  console.log(`NEXT_PUBLIC_DEVICE_REGISTRY=${regAddr}`);
  console.log(`NEXT_PUBLIC_DATA_COMMITMENT=${cmtAddr}`);
  console.log(`NEXT_PUBLIC_DATA_MARKETPLACE=${mktAddr}`);
  console.log(`NEXT_PUBLIC_FINANCING_TRIGGER=${trgAddr}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Deploy failed:", err.message || err);
    process.exit(1);
  });
