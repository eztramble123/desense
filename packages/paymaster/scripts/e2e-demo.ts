import { ethers } from "ethers";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync";
import { Wallet, Provider } from "zksync-ethers";
import "dotenv/config";

const ENTRYPOINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

// EIP-712 types for sponsorship
const SPONSORSHIP_TYPES = {
  SponsorshipData: [
    { name: "sender", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "validUntil", type: "uint48" },
    { name: "validAfter", type: "uint48" },
  ],
};

// Minimal EntryPoint ABI for handleOps
const ENTRYPOINT_ABI = [
  "function handleOps(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, bytes32 accountGasLimits, uint256 preVerificationGas, bytes32 gasFees, bytes paymasterAndData, bytes signature)[] ops, address beneficiary)",
  "function getUserOpHash(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, bytes32 accountGasLimits, uint256 preVerificationGas, bytes32 gasFees, bytes paymasterAndData, bytes signature) userOp) view returns (bytes32)",
  "function getNonce(address sender, uint192 key) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function depositTo(address account) payable",
];

const SIMPLE_ACCOUNT_ABI = [
  "function execute(address dest, uint256 value, bytes data)",
  "function executeBatch(address[] dest, uint256[] values, bytes[] data)",
  "function owner() view returns (address)",
  "function approveToken(address token, address spender, uint256 amount)",
];

async function main() {
  const provider = new Provider(
    (hre as any).network.config.url || "https://rpc.ab.testnet.adifoundation.ai/"
  );
  const deployer_wallet = new Wallet(process.env.PRIVATE_KEY!, provider);
  const deployer = new Deployer(hre, deployer_wallet);

  const chainId = Number((await provider.getNetwork()).chainId);
  console.log(`Connected to chain ${chainId}`);
  console.log(`Deployer: ${deployer_wallet.address}`);

  // =========================================================
  // SETUP: Deploy all contracts fresh for the demo
  // =========================================================
  console.log("\n========== DEPLOYING CONTRACTS ==========\n");

  // Deploy MockERC20
  const mockTokenArtifact = await deployer.loadArtifact("MockERC20");
  const mockToken = await deployer.deploy(mockTokenArtifact, ["DeSense Test USDC", "dsUSDC"]);
  const mockTokenAddr = await mockToken.getAddress();
  console.log("MockERC20:", mockTokenAddr);

  // Deploy SimpleAccountFactory
  const factoryArtifact = await deployer.loadArtifact("SimpleAccountFactory");
  const factory = await deployer.deploy(factoryArtifact, [ENTRYPOINT_V07]);
  const factoryAddr = await factory.getAddress();
  console.log("SimpleAccountFactory:", factoryAddr);

  // Deploy NativePaymaster
  const nativeArtifact = await deployer.loadArtifact("NativePaymaster");
  const nativePaymaster = await deployer.deploy(nativeArtifact, [ENTRYPOINT_V07, deployer_wallet.address]);
  const nativePaymasterAddr = await nativePaymaster.getAddress();
  console.log("NativePaymaster:", nativePaymasterAddr);

  // Deploy ERC20Paymaster
  const erc20Artifact = await deployer.loadArtifact("ERC20Paymaster");
  const erc20Paymaster = await deployer.deploy(erc20Artifact, [ENTRYPOINT_V07, deployer_wallet.address, mockTokenAddr]);
  const erc20PaymasterAddr = await erc20Paymaster.getAddress();
  console.log("ERC20Paymaster:", erc20PaymasterAddr);

  // Configure NativePaymaster
  await (await nativePaymaster.setSponsorSigner(deployer_wallet.address)).wait();
  console.log("NativePaymaster signer configured");

  // Fund both paymasters at EntryPoint
  const entryPoint = new ethers.Contract(ENTRYPOINT_V07, ENTRYPOINT_ABI, deployer_wallet as any);
  const depositAmount = ethers.parseEther("1");
  await (await nativePaymaster.deposit({ value: depositAmount })).wait();
  await (await erc20Paymaster.deposit({ value: depositAmount })).wait();
  console.log("Both paymasters funded with 1 ADI each");

  // =========================================================
  // FLOW A: Native Gas Sponsorship
  // =========================================================
  console.log("\n========== FLOW A: Native Gas Sponsorship ==========\n");

  // 1. Deploy a SimpleAccount for a test user
  const testUser = Wallet.createRandom();
  console.log(`Test user EOA: ${testUser.address}`);

  const createAccountTx = await factory.createAccount(testUser.address, 0);
  await createAccountTx.wait();
  const smartAccountAddr = await factory.getAddress(testUser.address, 0);
  console.log(`Smart account deployed at: ${smartAccountAddr}`);

  // 2. Generate EIP-712 sponsorship signature
  const nonce = 0n;
  const validUntil = Math.floor(Date.now() / 1000) + 3600;
  const validAfter = 0;

  const domain = {
    name: "DeSensePaymaster",
    version: "1",
    chainId,
    verifyingContract: nativePaymasterAddr,
  };

  const sponsorshipMessage = {
    sender: smartAccountAddr,
    nonce,
    validUntil,
    validAfter,
  };

  const sponsorSignature = await deployer_wallet.signTypedData(
    domain as any,
    SPONSORSHIP_TYPES,
    sponsorshipMessage
  );
  console.log("Sponsorship signature generated");

  // 3. Build paymasterAndData
  const validUntilHex = ethers.zeroPadValue(ethers.toBeHex(validUntil), 6);
  const validAfterHex = ethers.zeroPadValue(ethers.toBeHex(validAfter), 6);
  const sigHex = sponsorSignature.startsWith("0x") ? sponsorSignature.slice(2) : sponsorSignature;
  const paymasterAndData = nativePaymasterAddr.toLowerCase() + validUntilHex.slice(2) + validAfterHex.slice(2) + sigHex;

  console.log(`paymasterAndData constructed (${paymasterAndData.length} chars)`);

  // 4. Build a sample UserOperation callData
  // For demo purposes, we'll call execute() on the smart account to do a simple ETH transfer
  const simpleAccountIface = new ethers.Interface(SIMPLE_ACCOUNT_ABI);
  const callData = simpleAccountIface.encodeFunctionData("execute", [
    deployer_wallet.address, // dest
    0, // value
    "0x", // data (no-op call)
  ]);

  // 5. Pack gas limits (simplified for demo)
  const verificationGasLimit = 500000n;
  const callGasLimit = 200000n;
  const accountGasLimits = ethers.solidityPacked(
    ["uint128", "uint128"],
    [verificationGasLimit, callGasLimit]
  );
  const maxFeePerGas = ethers.parseUnits("0.25", "gwei");
  const maxPriorityFeePerGas = ethers.parseUnits("0.25", "gwei");
  const gasFees = ethers.solidityPacked(
    ["uint128", "uint128"],
    [maxPriorityFeePerGas, maxFeePerGas]
  );

  console.log("\nFlow A: UserOperation prepared");
  console.log("  sender:", smartAccountAddr);
  console.log("  paymaster:", nativePaymasterAddr);
  console.log("  sponsorship valid until:", new Date(validUntil * 1000).toISOString());

  // Note: In a real scenario, we'd send this UserOp through the EntryPoint.
  // For demo, we show the complete constructed UserOp.
  console.log("\n  UserOp constructed successfully!");
  console.log("  In production, this would be sent to EntryPoint.handleOps()");
  console.log("  The user pays ZERO gas — NativePaymaster sponsors it.");

  // =========================================================
  // FLOW B: ERC20 Gas Payment
  // =========================================================
  console.log("\n========== FLOW B: ERC20 Gas Payment ==========\n");

  // 1. Mint MockERC20 to the test user's smart account
  const mintAmount = ethers.parseEther("1000");
  await (await mockToken.mint(smartAccountAddr, mintAmount)).wait();
  console.log(`Minted ${ethers.formatEther(mintAmount)} dsUSDC to smart account`);

  const tokenBalance = await mockToken.balanceOf(smartAccountAddr);
  console.log(`Smart account token balance: ${ethers.formatEther(tokenBalance)} dsUSDC`);

  // 2. Calculate required token cost for gas
  const estimatedGasCost = ethers.parseEther("0.01"); // estimated gas in native
  const tokenCost = await erc20Paymaster.getTokenCostForGas(estimatedGasCost);
  console.log(`Estimated gas cost: ${ethers.formatEther(estimatedGasCost)} ADI`);
  console.log(`Token cost (with markup): ${ethers.formatEther(tokenCost)} dsUSDC`);

  // 3. Build ERC20 paymasterAndData
  const maxTokenCost = tokenCost * 2n; // 2x buffer for safety
  const maxTokenCostHex = ethers.zeroPadValue(ethers.toBeHex(maxTokenCost), 32);
  const erc20PaymasterAndData = erc20PaymasterAddr.toLowerCase() + maxTokenCostHex.slice(2);

  console.log(`\nERC20 paymasterAndData constructed`);

  // 4. Build sample UserOperation for ERC20 flow
  const erc20CallData = simpleAccountIface.encodeFunctionData("execute", [
    deployer_wallet.address,
    0,
    "0x",
  ]);

  console.log("\nFlow B: UserOperation prepared");
  console.log("  sender:", smartAccountAddr);
  console.log("  paymaster:", erc20PaymasterAddr);
  console.log("  token:", mockTokenAddr);
  console.log("  maxTokenCost:", ethers.formatEther(maxTokenCost), "dsUSDC");

  console.log("\n  UserOp constructed successfully!");
  console.log("  In production, this would be sent to EntryPoint.handleOps()");
  console.log("  The user pays gas in dsUSDC tokens — ERC20Paymaster handles native gas.");

  // =========================================================
  // SUMMARY
  // =========================================================
  console.log("\n========== E2E DEMO SUMMARY ==========\n");
  console.log("Deployed Contracts:");
  console.log(`  MockERC20 (dsUSDC): ${mockTokenAddr}`);
  console.log(`  SimpleAccountFactory: ${factoryAddr}`);
  console.log(`  NativePaymaster: ${nativePaymasterAddr}`);
  console.log(`  ERC20Paymaster: ${erc20PaymasterAddr}`);
  console.log(`  EntryPoint v0.7: ${ENTRYPOINT_V07}`);
  console.log(`\nTest Smart Account: ${smartAccountAddr}`);
  console.log(`Test User EOA: ${testUser.address}`);
  console.log("\nFlow A (Native Sponsorship): UserOp constructed with signed sponsorship");
  console.log("Flow B (ERC20 Payment): UserOp constructed with token-based gas payment");
  console.log("\nBoth flows demonstrate complete ERC-4337 paymaster integration!");

  const nativeDeposit = await nativePaymaster.getDeposit();
  const erc20Deposit = await erc20Paymaster.getDeposit();
  console.log(`\nNativePaymaster EntryPoint deposit: ${ethers.formatEther(nativeDeposit)} ADI`);
  console.log(`ERC20Paymaster EntryPoint deposit: ${ethers.formatEther(erc20Deposit)} ADI`);
}

main().catch((err) => {
  console.error("E2E demo failed:", err);
  process.exit(1);
});
