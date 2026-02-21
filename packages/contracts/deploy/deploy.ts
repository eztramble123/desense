import { Deployer } from "@matterlabs/hardhat-zksync";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-ethers";

export default async function (hre: HardhatRuntimeEnvironment) {
  const wallet = new Wallet(process.env.PRIVATE_KEY!);
  const deployer = new Deployer(hre, wallet);

  console.log("Deploying with account:", wallet.address);

  // 1. Deploy AccessControl
  const accessControlArtifact = await deployer.loadArtifact("ZeusAccessControl");
  const accessControl = await deployer.deploy(accessControlArtifact, [wallet.address]);
  const accessControlAddr = await accessControl.getAddress();
  console.log("ZeusAccessControl deployed to:", accessControlAddr);

  // 2. Deploy DeviceRegistry
  const registryArtifact = await deployer.loadArtifact("DeviceRegistry");
  const registry = await deployer.deploy(registryArtifact, [accessControlAddr]);
  const registryAddr = await registry.getAddress();
  console.log("DeviceRegistry deployed to:", registryAddr);

  // 3. Deploy DataCommitment
  const commitmentArtifact = await deployer.loadArtifact("DataCommitment");
  const commitment = await deployer.deploy(commitmentArtifact, [accessControlAddr, registryAddr]);
  const commitmentAddr = await commitment.getAddress();
  console.log("DataCommitment deployed to:", commitmentAddr);

  // 4. Deploy DataMarketplace
  const marketplaceArtifact = await deployer.loadArtifact("DataMarketplace");
  const marketplace = await deployer.deploy(marketplaceArtifact, [accessControlAddr, registryAddr, commitmentAddr]);
  const marketplaceAddr = await marketplace.getAddress();
  console.log("DataMarketplace deployed to:", marketplaceAddr);

  // 5. Deploy FinancingTrigger
  const triggerArtifact = await deployer.loadArtifact("FinancingTrigger");
  const trigger = await deployer.deploy(triggerArtifact, [accessControlAddr, commitmentAddr]);
  const triggerAddr = await trigger.getAddress();
  console.log("FinancingTrigger deployed to:", triggerAddr);

  console.log("\n--- Deployment Summary ---");
  console.log(`NEXT_PUBLIC_ACCESS_CONTROL=${accessControlAddr}`);
  console.log(`NEXT_PUBLIC_DEVICE_REGISTRY=${registryAddr}`);
  console.log(`NEXT_PUBLIC_DATA_COMMITMENT=${commitmentAddr}`);
  console.log(`NEXT_PUBLIC_DATA_MARKETPLACE=${marketplaceAddr}`);
  console.log(`NEXT_PUBLIC_FINANCING_TRIGGER=${triggerAddr}`);

  return {
    accessControl: accessControlAddr,
    registry: registryAddr,
    commitment: commitmentAddr,
    marketplace: marketplaceAddr,
    trigger: triggerAddr,
  };
}
