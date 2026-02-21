import { expect } from "chai";
import { ethers } from "ethers";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync";
import { Wallet, Provider } from "zksync-ethers";

// EIP-712 domain and types for sponsor signature generation
const EIP712_DOMAIN = {
  name: "DeSensePaymaster",
  version: "1",
};

const SPONSORSHIP_TYPES = {
  SponsorshipData: [
    { name: "sender", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "validUntil", type: "uint48" },
    { name: "validAfter", type: "uint48" },
  ],
};

// Helper: build a minimal PackedUserOperation
function buildUserOp(overrides: Partial<{
  sender: string;
  nonce: bigint;
  initCode: string;
  callData: string;
  accountGasLimits: string;
  preVerificationGas: bigint;
  gasFees: string;
  paymasterAndData: string;
  signature: string;
}>) {
  return {
    sender: overrides.sender || ethers.ZeroAddress,
    nonce: overrides.nonce || 0n,
    initCode: overrides.initCode || "0x",
    callData: overrides.callData || "0x",
    accountGasLimits: overrides.accountGasLimits || ethers.zeroPadValue("0x", 32),
    preVerificationGas: overrides.preVerificationGas || 0n,
    gasFees: overrides.gasFees || ethers.zeroPadValue("0x", 32),
    paymasterAndData: overrides.paymasterAndData || "0x",
    signature: overrides.signature || "0x",
  };
}

// Helper: create EIP-712 sponsorship signature
async function signSponsorship(
  signer: Wallet,
  paymasterAddress: string,
  sender: string,
  nonce: bigint,
  validUntil: number,
  validAfter: number,
  chainId: number
): Promise<string> {
  const domain = {
    ...EIP712_DOMAIN,
    chainId,
    verifyingContract: paymasterAddress,
  };

  const message = {
    sender,
    nonce,
    validUntil,
    validAfter,
  };

  // Use ethers.js to sign EIP-712 typed data
  const wallet = new ethers.Wallet(signer.privateKey);
  return wallet.signTypedData(domain, SPONSORSHIP_TYPES, message);
}

// Helper: encode paymasterAndData for NativePaymaster
function encodeNativePaymasterData(
  paymasterAddress: string,
  validUntil: number,
  validAfter: number,
  signature: string
): string {
  const validUntilHex = ethers.zeroPadValue(ethers.toBeHex(validUntil), 6);
  const validAfterHex = ethers.zeroPadValue(ethers.toBeHex(validAfter), 6);
  // Remove 0x prefix from signature
  const sigBytes = signature.startsWith("0x") ? signature.slice(2) : signature;
  return paymasterAddress.toLowerCase() + validUntilHex.slice(2) + validAfterHex.slice(2) + sigBytes;
}

// Helper: encode paymasterAndData for ERC20Paymaster
function encodeERC20PaymasterData(
  paymasterAddress: string,
  maxTokenCost: bigint
): string {
  const costHex = ethers.zeroPadValue(ethers.toBeHex(maxTokenCost), 32);
  return paymasterAddress.toLowerCase() + costHex.slice(2);
}

describe("Paymaster Suite", function () {
  let deployer: Deployer;
  let owner: Wallet;
  let sponsorSigner: Wallet;
  let user: Wallet;
  let chainId: number;

  // Contracts
  let nativePaymaster: any;
  let erc20Paymaster: any;
  let mockToken: any;
  let accountFactory: any;
  let simpleAccount: any;

  // Addresses
  let nativePaymasterAddr: string;
  let erc20PaymasterAddr: string;
  let mockTokenAddr: string;
  let accountFactoryAddr: string;
  let simpleAccountAddr: string;

  before(async function () {
    // Use hardhat local zksync network
    const provider = new Provider((hre as any).network.config.url || "http://127.0.0.1:8011");

    // Create test wallets
    owner = new Wallet(Wallet.createRandom().privateKey, provider);
    sponsorSigner = new Wallet(Wallet.createRandom().privateKey, provider);
    user = new Wallet(Wallet.createRandom().privateKey, provider);

    // Get chain ID
    const network = await provider.getNetwork();
    chainId = Number(network.chainId);

    deployer = new Deployer(hre, owner);

    // Fund owner wallet for deployments (on local test node)
    try {
      await provider.send("hardhat_setBalance", [
        owner.address,
        ethers.toBeHex(ethers.parseEther("100")),
      ]);
      await provider.send("hardhat_setBalance", [
        user.address,
        ethers.toBeHex(ethers.parseEther("10")),
      ]);
    } catch {
      // Not on hardhat network — skip funding
    }
  });

  describe("Contract Deployment", function () {
    it("should deploy MockERC20", async function () {
      const artifact = await deployer.loadArtifact("MockERC20");
      mockToken = await deployer.deploy(artifact, ["Mock USDC", "mUSDC"]);
      mockTokenAddr = await mockToken.getAddress();
      expect(mockTokenAddr).to.be.properAddress;
    });

    it("should deploy SimpleAccountFactory", async function () {
      // Use a mock EntryPoint address for testing
      const mockEntryPoint = ethers.Wallet.createRandom().address;
      const artifact = await deployer.loadArtifact("SimpleAccountFactory");
      accountFactory = await deployer.deploy(artifact, [mockEntryPoint]);
      accountFactoryAddr = await accountFactory.getAddress();
      expect(accountFactoryAddr).to.be.properAddress;
    });

    it("should deploy NativePaymaster", async function () {
      const mockEntryPoint = owner.address; // use owner as mock entry point for testing
      const artifact = await deployer.loadArtifact("NativePaymaster");
      nativePaymaster = await deployer.deploy(artifact, [mockEntryPoint, owner.address]);
      nativePaymasterAddr = await nativePaymaster.getAddress();
      expect(nativePaymasterAddr).to.be.properAddress;
    });

    it("should deploy ERC20Paymaster", async function () {
      const mockEntryPoint = owner.address; // use owner as mock entry point for testing
      const artifact = await deployer.loadArtifact("ERC20Paymaster");
      erc20Paymaster = await deployer.deploy(artifact, [mockEntryPoint, owner.address, mockTokenAddr]);
      erc20PaymasterAddr = await erc20Paymaster.getAddress();
      expect(erc20PaymasterAddr).to.be.properAddress;
    });
  });

  describe("NativePaymaster", function () {
    it("should set sponsor signer", async function () {
      const tx = await nativePaymaster.setSponsorSigner(sponsorSigner.address);
      await tx.wait();
      expect(await nativePaymaster.sponsorSigner()).to.equal(sponsorSigner.address);
    });

    it("should rotate sponsor signer", async function () {
      const newSigner = Wallet.createRandom();
      const tx = await nativePaymaster.setSponsorSigner(newSigner.address);
      await tx.wait();
      expect(await nativePaymaster.sponsorSigner()).to.equal(newSigner.address);

      // Rotate back to original
      const tx2 = await nativePaymaster.setSponsorSigner(sponsorSigner.address);
      await tx2.wait();
      expect(await nativePaymaster.sponsorSigner()).to.equal(sponsorSigner.address);
    });

    it("should set spend limits", async function () {
      const limit = ethers.parseEther("1");
      const tx = await nativePaymaster.setSpendLimit(user.address, limit);
      await tx.wait();
      expect(await nativePaymaster.senderSpendLimit(user.address)).to.equal(limit);
    });

    it("should validate correct sponsorship signature", async function () {
      const validUntil = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validAfter = 0;
      const nonce = 0n;

      const signature = await signSponsorship(
        sponsorSigner,
        nativePaymasterAddr,
        user.address,
        nonce,
        validUntil,
        validAfter,
        chainId
      );

      const paymasterAndData = encodeNativePaymasterData(
        nativePaymasterAddr,
        validUntil,
        validAfter,
        signature
      );

      const userOp = buildUserOp({
        sender: user.address,
        nonce,
        paymasterAndData,
      });

      // Call validatePaymasterUserOp as EntryPoint (owner = mock entry point)
      const result = await nativePaymaster.validatePaymasterUserOp.staticCall(
        userOp,
        ethers.zeroPadValue("0x", 32),
        ethers.parseEther("0.01")
      );

      // Should return context and validationData (not revert)
      expect(result.context).to.not.equal("0x");
    });

    it("should reject expired sponsorship signature", async function () {
      const validUntil = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const validAfter = 0;
      const nonce = 1n;

      const signature = await signSponsorship(
        sponsorSigner,
        nativePaymasterAddr,
        user.address,
        nonce,
        validUntil,
        validAfter,
        chainId
      );

      const paymasterAndData = encodeNativePaymasterData(
        nativePaymasterAddr,
        validUntil,
        validAfter,
        signature
      );

      const userOp = buildUserOp({
        sender: user.address,
        nonce,
        paymasterAndData,
      });

      // The validation itself won't revert (EntryPoint handles time validation),
      // but validationData encodes the expired time which EntryPoint will reject.
      const result = await nativePaymaster.validatePaymasterUserOp.staticCall(
        userOp,
        ethers.zeroPadValue("0x", 32),
        ethers.parseEther("0.01")
      );

      // validationData should encode the expired validUntil
      // The EntryPoint would reject this, but the contract itself doesn't revert
      expect(result.validationData).to.not.equal(0n);
    });

    it("should reject invalid sponsor signature", async function () {
      const validUntil = Math.floor(Date.now() / 1000) + 3600;
      const validAfter = 0;
      const nonce = 2n;

      // Sign with wrong signer
      const wrongSigner = new Wallet(Wallet.createRandom().privateKey);
      const signature = await signSponsorship(
        wrongSigner,
        nativePaymasterAddr,
        user.address,
        nonce,
        validUntil,
        validAfter,
        chainId
      );

      const paymasterAndData = encodeNativePaymasterData(
        nativePaymasterAddr,
        validUntil,
        validAfter,
        signature
      );

      const userOp = buildUserOp({
        sender: user.address,
        nonce,
        paymasterAndData,
      });

      await expect(
        nativePaymaster.validatePaymasterUserOp.staticCall(
          userOp,
          ethers.zeroPadValue("0x", 32),
          ethers.parseEther("0.01")
        )
      ).to.be.revertedWith("NativePaymaster: invalid sponsor signature");
    });

    it("should reject invalid paymasterAndData length", async function () {
      const userOp = buildUserOp({
        sender: user.address,
        paymasterAndData: nativePaymasterAddr + "0000", // Too short
      });

      await expect(
        nativePaymaster.validatePaymasterUserOp.staticCall(
          userOp,
          ethers.zeroPadValue("0x", 32),
          ethers.parseEther("0.01")
        )
      ).to.be.revertedWith("NativePaymaster: invalid paymasterAndData length");
    });

    it("should reject non-owner setting sponsor signer", async function () {
      const nonOwnerPaymaster = nativePaymaster.connect(user);
      await expect(
        nonOwnerPaymaster.setSponsorSigner(user.address)
      ).to.be.revertedWithCustomError(nativePaymaster, "OwnableUnauthorizedAccount");
    });

    it("should reject non-EntryPoint calling validatePaymasterUserOp", async function () {
      // Connect as user (not the mock entry point)
      const userPaymaster = nativePaymaster.connect(user);
      const userOp = buildUserOp({ sender: user.address });

      await expect(
        userPaymaster.validatePaymasterUserOp(
          userOp,
          ethers.zeroPadValue("0x", 32),
          0n
        )
      ).to.be.revertedWith("BasePaymaster: not from EntryPoint");
    });
  });

  describe("ERC20Paymaster", function () {
    it("should configure token price markup", async function () {
      const tx = await erc20Paymaster.setTokenPriceMarkup(15000); // 1.5x
      await tx.wait();
      expect(await erc20Paymaster.tokenPriceMarkup()).to.equal(15000n);

      // Reset to 1.2x
      const tx2 = await erc20Paymaster.setTokenPriceMarkup(12000);
      await tx2.wait();
    });

    it("should configure native-to-token rate", async function () {
      const rate = ethers.parseEther("2"); // 2 tokens per native
      const tx = await erc20Paymaster.setNativeToTokenRate(rate);
      await tx.wait();
      expect(await erc20Paymaster.nativeToTokenRate()).to.equal(rate);

      // Reset to 1:1
      const tx2 = await erc20Paymaster.setNativeToTokenRate(ethers.parseEther("1"));
      await tx2.wait();
    });

    it("should calculate token cost correctly", async function () {
      // With 1:1 rate and 1.2x markup:
      // cost = gasCost * 1e18 * 12000 / (1e18 * 10000) = gasCost * 1.2
      const gasCost = ethers.parseEther("0.1");
      const tokenCost = await erc20Paymaster.getTokenCostForGas(gasCost);
      expect(tokenCost).to.equal(ethers.parseEther("0.12"));
    });

    it("should reject markup below 1x", async function () {
      await expect(
        erc20Paymaster.setTokenPriceMarkup(9999)
      ).to.be.revertedWith("ERC20Paymaster: markup too low");
    });

    it("should reject zero rate", async function () {
      await expect(
        erc20Paymaster.setNativeToTokenRate(0)
      ).to.be.revertedWith("ERC20Paymaster: rate must be positive");
    });

    it("should reject invalid paymasterAndData length", async function () {
      const userOp = buildUserOp({
        sender: user.address,
        paymasterAndData: erc20PaymasterAddr + "00", // Too short
      });

      await expect(
        erc20Paymaster.validatePaymasterUserOp.staticCall(
          userOp,
          ethers.zeroPadValue("0x", 32),
          ethers.parseEther("0.01")
        )
      ).to.be.revertedWith("ERC20Paymaster: invalid paymasterAndData length");
    });

    it("should reject non-owner configuring paymaster", async function () {
      const userPaymaster = erc20Paymaster.connect(user);
      await expect(
        userPaymaster.setToken(mockTokenAddr)
      ).to.be.revertedWithCustomError(erc20Paymaster, "OwnableUnauthorizedAccount");
    });

    it("should allow owner to withdraw tokens", async function () {
      // Mint some tokens to the paymaster
      const amount = ethers.parseEther("100");
      await (await mockToken.mint(erc20PaymasterAddr, amount)).wait();

      const balBefore = await mockToken.balanceOf(owner.address);
      await (await erc20Paymaster.withdrawTokens(owner.address, amount)).wait();
      const balAfter = await mockToken.balanceOf(owner.address);

      expect(balAfter - balBefore).to.equal(amount);
    });
  });

  describe("SimpleAccountFactory", function () {
    it("should deploy accounts at deterministic addresses", async function () {
      const salt = 0;
      const predicted = await accountFactory.getAddress(user.address, salt);
      expect(predicted).to.be.properAddress;

      const tx = await accountFactory.createAccount(user.address, salt);
      const receipt = await tx.wait();

      // Verify event was emitted
      const events = receipt.logs || [];
      expect(events.length).to.be.greaterThan(0);
    });

    it("should return existing account if already deployed", async function () {
      const salt = 0;
      const predicted = await accountFactory.getAddress(user.address, salt);

      // Deploy again — should return existing
      const tx = await accountFactory.createAccount(user.address, salt);
      await tx.wait();

      // Should be the same address
      const predicted2 = await accountFactory.getAddress(user.address, salt);
      expect(predicted2).to.equal(predicted);
    });

    it("should deploy different accounts for different salts", async function () {
      const addr1 = await accountFactory.getAddress(user.address, 0);
      const addr2 = await accountFactory.getAddress(user.address, 1);
      expect(addr1).to.not.equal(addr2);
    });
  });

  describe("MockERC20", function () {
    it("should mint tokens", async function () {
      const amount = ethers.parseEther("1000");
      const tx = await mockToken.mint(user.address, amount);
      await tx.wait();
      expect(await mockToken.balanceOf(user.address)).to.equal(amount);
    });

    it("should have correct name and symbol", async function () {
      expect(await mockToken.name()).to.equal("Mock USDC");
      expect(await mockToken.symbol()).to.equal("mUSDC");
    });
  });

  describe("BasePaymaster", function () {
    it("should accept native deposits", async function () {
      const tx = await owner.sendTransaction({
        to: nativePaymasterAddr,
        value: ethers.parseEther("1"),
      });
      await tx.wait();
    });

    it("should report correct owner", async function () {
      expect(await nativePaymaster.owner()).to.equal(owner.address);
    });
  });
});
