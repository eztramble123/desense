import { Deployer } from "@matterlabs/hardhat-zksync";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-ethers";
import { ethers } from "ethers";

const ENTRYPOINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

export default async function (hre: HardhatRuntimeEnvironment) {
  const wallet = new Wallet(process.env.PRIVATE_KEY!);
  const deployer = new Deployer(hre, wallet);

  console.log("Deploying Paymaster contracts with account:", wallet.address);

  // 1. Deploy MockERC20
  const mockTokenArtifact = await deployer.loadArtifact("MockERC20");
  const mockToken = await deployer.deploy(mockTokenArtifact, ["DeSense Test USDC", "dsUSDC"]);
  const mockTokenAddr = await mockToken.getAddress();
  console.log("MockERC20 deployed to:", mockTokenAddr);

  // Mint test tokens to deployer
  const mintTx = await mockToken.mint(wallet.address, ethers.parseEther("1000000"));
  await mintTx.wait();
  console.log("Minted 1,000,000 dsUSDC to deployer");

  // 2. Deploy SimpleAccountFactory
  const factoryArtifact = await deployer.loadArtifact("SimpleAccountFactory");
  const factory = await deployer.deploy(factoryArtifact, [ENTRYPOINT_V07]);
  const factoryAddr = await factory.getAddress();
  console.log("SimpleAccountFactory deployed to:", factoryAddr);

  // 3. Deploy NativePaymaster
  const nativeArtifact = await deployer.loadArtifact("NativePaymaster");
  const nativePaymaster = await deployer.deploy(nativeArtifact, [ENTRYPOINT_V07, wallet.address]);
  const nativePaymasterAddr = await nativePaymaster.getAddress();
  console.log("NativePaymaster deployed to:", nativePaymasterAddr);

  // 4. Deploy ERC20Paymaster
  const erc20Artifact = await deployer.loadArtifact("ERC20Paymaster");
  const erc20Paymaster = await deployer.deploy(erc20Artifact, [ENTRYPOINT_V07, wallet.address, mockTokenAddr]);
  const erc20PaymasterAddr = await erc20Paymaster.getAddress();
  console.log("ERC20Paymaster deployed to:", erc20PaymasterAddr);

  // 5. Configure: set sponsor signer on NativePaymaster
  console.log("\nConfiguring...");
  const setSignerTx = await nativePaymaster.setSponsorSigner(wallet.address);
  await setSignerTx.wait();
  console.log("NativePaymaster sponsor signer set to deployer:", wallet.address);

  // 6. Configure: set token rate on ERC20Paymaster (1:1 for MVP)
  const setRateTx = await erc20Paymaster.setNativeToTokenRate(ethers.parseEther("1"));
  await setRateTx.wait();
  console.log("ERC20Paymaster token rate set to 1:1");

  // 7. Fund: deposit native ADI to EntryPoint for both paymasters
  console.log("\nFunding paymasters...");
  const depositAmount = ethers.parseEther("0.5");

  const depositNativeTx = await nativePaymaster.deposit({ value: depositAmount });
  await depositNativeTx.wait();
  console.log(`NativePaymaster funded with ${ethers.formatEther(depositAmount)} ADI`);

  const depositErc20Tx = await erc20Paymaster.deposit({ value: depositAmount });
  await depositErc20Tx.wait();
  console.log(`ERC20Paymaster funded with ${ethers.formatEther(depositAmount)} ADI`);

  // Print summary
  console.log("\n--- Paymaster Deployment Summary ---");
  console.log(`PAYMASTER_MOCK_TOKEN=${mockTokenAddr}`);
  console.log(`PAYMASTER_ACCOUNT_FACTORY=${factoryAddr}`);
  console.log(`PAYMASTER_NATIVE=${nativePaymasterAddr}`);
  console.log(`PAYMASTER_ERC20=${erc20PaymasterAddr}`);
  console.log(`PAYMASTER_ENTRYPOINT=${ENTRYPOINT_V07}`);

  return {
    mockToken: mockTokenAddr,
    factory: factoryAddr,
    nativePaymaster: nativePaymasterAddr,
    erc20Paymaster: erc20PaymasterAddr,
    entryPoint: ENTRYPOINT_V07,
  };
}
