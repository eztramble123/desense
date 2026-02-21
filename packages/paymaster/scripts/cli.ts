import { Command } from "commander";
import { ethers } from "ethers";
import "dotenv/config";

const ENTRYPOINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
const RPC_URL = process.env.RPC_URL || "https://rpc.ab.testnet.adifoundation.ai/";

// Minimal ABIs
const NATIVE_PAYMASTER_ABI = [
  "function owner() view returns (address)",
  "function sponsorSigner() view returns (address)",
  "function getDeposit() view returns (uint256)",
  "function senderSpendLimit(address) view returns (uint256)",
  "function senderSpent(address) view returns (uint256)",
  "function setSponsorSigner(address)",
  "function setSpendLimit(address, uint256)",
  "function deposit() payable",
  "function withdrawTo(address, uint256)",
];

const ERC20_PAYMASTER_ABI = [
  "function owner() view returns (address)",
  "function token() view returns (address)",
  "function tokenPriceMarkup() view returns (uint256)",
  "function nativeToTokenRate() view returns (uint256)",
  "function getDeposit() view returns (uint256)",
  "function getTokenCostForGas(uint256) view returns (uint256)",
  "function setToken(address)",
  "function setTokenPriceMarkup(uint256)",
  "function setNativeToTokenRate(uint256)",
  "function deposit() payable",
];

// EIP-712 types
const EIP712_DOMAIN_NAME = "DeSensePaymaster";
const EIP712_DOMAIN_VERSION = "1";
const CHAIN_ID = 99999;

const SPONSORSHIP_TYPES = {
  SponsorshipData: [
    { name: "sender", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "validUntil", type: "uint48" },
    { name: "validAfter", type: "uint48" },
  ],
};

function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

function getWallet() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY env var required");
  }
  return new ethers.Wallet(process.env.PRIVATE_KEY, getProvider());
}

const program = new Command();

program
  .name("desense-paymaster")
  .description("DeSense ERC-4337 Paymaster CLI")
  .version("0.1.0");

// --- deploy ---
program
  .command("deploy")
  .description("Deploy all paymaster contracts (use hardhat deploy-zksync instead)")
  .action(() => {
    console.log("Use: pnpm deploy (runs hardhat deploy-zksync --script deploy.ts)");
  });

// --- configure ---
program
  .command("configure")
  .description("Configure paymaster settings")
  .requiredOption("--paymaster <address>", "Paymaster contract address")
  .requiredOption("--signer <address>", "New sponsor signer address")
  .action(async (opts) => {
    const wallet = getWallet();
    const paymaster = new ethers.Contract(opts.paymaster, NATIVE_PAYMASTER_ABI, wallet);

    console.log(`Setting sponsor signer to ${opts.signer}...`);
    const tx = await paymaster.setSponsorSigner(opts.signer);
    await tx.wait();
    console.log(`Done. TX: ${tx.hash}`);
  });

// --- fund ---
program
  .command("fund")
  .description("Deposit ADI to EntryPoint for paymaster")
  .requiredOption("--paymaster <address>", "Paymaster contract address")
  .requiredOption("--amount <adi>", "Amount of ADI to deposit")
  .action(async (opts) => {
    const wallet = getWallet();
    const paymaster = new ethers.Contract(opts.paymaster, NATIVE_PAYMASTER_ABI, wallet);

    const amount = ethers.parseEther(opts.amount);
    console.log(`Depositing ${opts.amount} ADI to EntryPoint for ${opts.paymaster}...`);
    const tx = await paymaster.deposit({ value: amount });
    await tx.wait();
    console.log(`Done. TX: ${tx.hash}`);

    const deposit = await paymaster.getDeposit();
    console.log(`New deposit balance: ${ethers.formatEther(deposit)} ADI`);
  });

// --- status ---
program
  .command("status")
  .description("Show paymaster status")
  .requiredOption("--paymaster <address>", "Paymaster contract address")
  .option("--type <type>", "Paymaster type: native or erc20", "native")
  .action(async (opts) => {
    const provider = getProvider();

    if (opts.type === "erc20") {
      const paymaster = new ethers.Contract(opts.paymaster, ERC20_PAYMASTER_ABI, provider);
      const [owner, token, markup, rate, deposit] = await Promise.all([
        paymaster.owner(),
        paymaster.token(),
        paymaster.tokenPriceMarkup(),
        paymaster.nativeToTokenRate(),
        paymaster.getDeposit(),
      ]);

      console.log("=== ERC20 Paymaster Status ===");
      console.log(`Address:        ${opts.paymaster}`);
      console.log(`Owner:          ${owner}`);
      console.log(`Token:          ${token}`);
      console.log(`Price Markup:   ${Number(markup) / 100}%`);
      console.log(`Token Rate:     ${ethers.formatEther(rate)} tokens/native`);
      console.log(`EP Deposit:     ${ethers.formatEther(deposit)} ADI`);
    } else {
      const paymaster = new ethers.Contract(opts.paymaster, NATIVE_PAYMASTER_ABI, provider);
      const [owner, signer, deposit] = await Promise.all([
        paymaster.owner(),
        paymaster.sponsorSigner(),
        paymaster.getDeposit(),
      ]);

      console.log("=== Native Paymaster Status ===");
      console.log(`Address:        ${opts.paymaster}`);
      console.log(`Owner:          ${owner}`);
      console.log(`Sponsor Signer: ${signer}`);
      console.log(`EP Deposit:     ${ethers.formatEther(deposit)} ADI`);
    }
  });

// --- generate-sponsorship ---
program
  .command("generate-sponsorship")
  .description("Generate EIP-712 signed sponsorship for testing")
  .requiredOption("--sender <address>", "Sender (smart account) address")
  .requiredOption("--nonce <n>", "Sender nonce")
  .requiredOption("--paymaster <address>", "Paymaster address (for EIP-712 domain)")
  .option("--valid-for <seconds>", "Validity duration in seconds", "3600")
  .action(async (opts) => {
    const wallet = getWallet();
    const now = Math.floor(Date.now() / 1000);
    const validUntil = now + parseInt(opts.validFor);
    const validAfter = 0;

    const domain = {
      name: EIP712_DOMAIN_NAME,
      version: EIP712_DOMAIN_VERSION,
      chainId: CHAIN_ID,
      verifyingContract: opts.paymaster,
    };

    const message = {
      sender: opts.sender,
      nonce: BigInt(opts.nonce),
      validUntil,
      validAfter,
    };

    const signature = await wallet.signTypedData(domain, SPONSORSHIP_TYPES, message);

    console.log("=== Sponsorship Signature ===");
    console.log(`Sender:       ${opts.sender}`);
    console.log(`Nonce:        ${opts.nonce}`);
    console.log(`Valid Until:  ${validUntil} (${new Date(validUntil * 1000).toISOString()})`);
    console.log(`Valid After:  ${validAfter}`);
    console.log(`Signer:       ${wallet.address}`);
    console.log(`Signature:    ${signature}`);

    // Encode paymasterAndData
    const validUntilHex = ethers.zeroPadValue(ethers.toBeHex(validUntil), 6);
    const validAfterHex = ethers.zeroPadValue(ethers.toBeHex(validAfter), 6);
    const sigBytes = signature.startsWith("0x") ? signature.slice(2) : signature;
    const paymasterAndData = opts.paymaster.toLowerCase() + validUntilHex.slice(2) + validAfterHex.slice(2) + sigBytes;

    console.log(`\npaymasterAndData: ${paymasterAndData}`);
  });

program.parse();
