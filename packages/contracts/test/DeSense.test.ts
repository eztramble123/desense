import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("DeSense Protocol", function () {
  let accessControl: Contract;
  let registry: Contract;
  let commitment: Contract;
  let marketplace: Contract;
  let trigger: Contract;

  let admin: Signer;
  let operator: Signer;
  let buyer: Signer;
  let other: Signer;

  let adminAddr: string;
  let operatorAddr: string;
  let buyerAddr: string;

  beforeEach(async function () {
    [admin, operator, buyer, other] = await ethers.getSigners();
    adminAddr = await admin.getAddress();
    operatorAddr = await operator.getAddress();
    buyerAddr = await buyer.getAddress();

    // Deploy AccessControl
    const AccessControl = await ethers.getContractFactory("DeSenseAccessControl");
    accessControl = await AccessControl.deploy(adminAddr);
    const acAddr = await accessControl.getAddress();

    // Deploy DeviceRegistry
    const Registry = await ethers.getContractFactory("DeviceRegistry");
    registry = await Registry.deploy(acAddr);
    const regAddr = await registry.getAddress();

    // Deploy DataCommitment
    const Commitment = await ethers.getContractFactory("DataCommitment");
    commitment = await Commitment.deploy(acAddr, regAddr);
    const cmtAddr = await commitment.getAddress();

    // Deploy DataMarketplace
    const Marketplace = await ethers.getContractFactory("DataMarketplace");
    marketplace = await Marketplace.deploy(acAddr, regAddr, cmtAddr);

    // Deploy FinancingTrigger
    const Trigger = await ethers.getContractFactory("FinancingTrigger");
    trigger = await Trigger.deploy(acAddr, cmtAddr);

    // Grant roles
    await accessControl.grantOperatorRole(operatorAddr);
    await accessControl.grantBuyerRole(buyerAddr);
  });

  describe("AccessControl", function () {
    it("should set admin correctly", async function () {
      expect(await accessControl.isAdmin(adminAddr)).to.be.true;
    });

    it("should grant and check operator role", async function () {
      expect(await accessControl.isOperator(operatorAddr)).to.be.true;
    });

    it("should grant and check buyer role", async function () {
      expect(await accessControl.isBuyer(buyerAddr)).to.be.true;
    });

    it("should revoke roles", async function () {
      await accessControl.revokeOperatorRole(operatorAddr);
      expect(await accessControl.isOperator(operatorAddr)).to.be.false;
    });

    it("should prevent non-admin from granting roles", async function () {
      await expect(
        accessControl.connect(other).grantOperatorRole(await other.getAddress())
      ).to.be.reverted;
    });
  });

  describe("DeviceRegistry", function () {
    it("should register a device as operator", async function () {
      const tx = await registry.connect(operator).registerDevice(
        0, // SolarPanel
        "25.2048,55.2708",
        "MENA-UAE",
        0,
        100,
        30
      );
      await tx.wait();

      const device = await registry.getDevice(0);
      expect(device.deviceType).to.equal(0);
      expect(device.region).to.equal("MENA-UAE");
      expect(device.operator).to.equal(operatorAddr);
      expect(device.status).to.equal(1); // Active
    });

    it("should prevent non-operator from registering", async function () {
      await expect(
        registry.connect(buyer).registerDevice(0, "loc", "region", 0, 100, 30)
      ).to.be.revertedWith("DeviceRegistry: caller is not operator");
    });

    it("should allow admin to change device status", async function () {
      await registry.connect(operator).registerDevice(0, "loc", "MENA-UAE", 0, 100, 30);
      await registry.connect(admin).setDeviceStatus(0, 2); // Suspended
      const device = await registry.getDevice(0);
      expect(device.status).to.equal(2);
    });

    it("should enumerate devices by operator", async function () {
      await registry.connect(operator).registerDevice(0, "loc1", "MENA-UAE", 0, 100, 30);
      await registry.connect(operator).registerDevice(1, "loc2", "MENA-UAE", 0, 500, 60);
      const devices = await registry.getDevicesByOperator(operatorAddr);
      expect(devices.length).to.equal(2);
    });
  });

  describe("DataCommitment", function () {
    beforeEach(async function () {
      await registry.connect(operator).registerDevice(0, "loc", "MENA-UAE", 0, 100, 30);
    });

    it("should submit a batch", async function () {
      const now = Math.floor(Date.now() / 1000);
      const dataRoot = ethers.keccak256(ethers.toUtf8Bytes("test-data"));

      await commitment.connect(operator).submitBatch(
        0, now - 300, now, dataRoot, "QmTestCid", 50, 9500
      );

      const batch = await commitment.getBatch(0);
      expect(batch.deviceId).to.equal(0);
      expect(batch.avgOutput).to.equal(50);
      expect(batch.uptimeBps).to.equal(9500);
      expect(batch.dataRoot).to.equal(dataRoot);
    });

    it("should update SLA score", async function () {
      const now = Math.floor(Date.now() / 1000);
      const dataRoot = ethers.keccak256(ethers.toUtf8Bytes("test-data"));

      await commitment.connect(operator).submitBatch(
        0, now - 300, now, dataRoot, "QmTestCid1", 50, 9500
      );
      await commitment.connect(operator).submitBatch(
        0, now, now + 300, ethers.keccak256(ethers.toUtf8Bytes("test-2")), "QmTestCid2", 60, 9800
      );

      const sla = await commitment.getDeviceSLA(0);
      expect(sla.totalBatches).to.equal(2);
      expect(sla.cumulativeOutput).to.equal(110); // 50 + 60
      expect(sla.cumulativeUptime).to.equal(19300); // 9500 + 9800
    });

    it("should prevent non-owner from submitting", async function () {
      const now = Math.floor(Date.now() / 1000);
      const dataRoot = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await expect(
        commitment.connect(buyer).submitBatch(0, now - 300, now, dataRoot, "Qm", 50, 9500)
      ).to.be.reverted;
    });

    it("should paginate batches", async function () {
      const now = Math.floor(Date.now() / 1000);
      for (let i = 0; i < 5; i++) {
        await commitment.connect(operator).submitBatch(
          0, now + i * 300, now + (i + 1) * 300,
          ethers.keccak256(ethers.toUtf8Bytes(`batch-${i}`)),
          `QmBatch${i}`, 50, 9500
        );
      }

      const page1 = await commitment.getDeviceBatches(0, 0, 3);
      expect(page1.length).to.equal(3);

      const page2 = await commitment.getDeviceBatches(0, 3, 3);
      expect(page2.length).to.equal(2);
    });
  });

  describe("DataMarketplace", function () {
    beforeEach(async function () {
      await registry.connect(operator).registerDevice(0, "loc", "MENA-UAE", 0, 100, 30);
    });

    it("should create an order with escrow", async function () {
      await marketplace.connect(buyer).createOrder(
        0, "MENA-UAE", 8000, 30, 86400, ethers.parseEther("0.01"),
        { value: ethers.parseEther("1") }
      );

      const order = await marketplace.getOrder(0);
      expect(order.buyer).to.equal(buyerAddr);
      expect(order.totalEscrow).to.equal(ethers.parseEther("1"));
      expect(order.status).to.equal(0); // Open
    });

    it("should match device to order", async function () {
      await marketplace.connect(buyer).createOrder(
        0, "MENA-UAE", 8000, 30, 86400, ethers.parseEther("0.01"),
        { value: ethers.parseEther("1") }
      );

      await marketplace.connect(operator).matchDevice(0, 0);

      const devices = await marketplace.getOrderDevices(0);
      expect(devices.length).to.equal(1);
      expect(devices[0]).to.equal(0);

      const order = await marketplace.getOrder(0);
      expect(order.status).to.equal(1); // Active
    });

    it("should settle a batch and pay operator", async function () {
      await marketplace.connect(buyer).createOrder(
        0, "MENA-UAE", 8000, 30, 86400, ethers.parseEther("0.01"),
        { value: ethers.parseEther("1") }
      );
      await marketplace.connect(operator).matchDevice(0, 0);

      const now = Math.floor(Date.now() / 1000);
      const dataRoot = ethers.keccak256(ethers.toUtf8Bytes("settle-test"));
      await commitment.connect(operator).submitBatch(
        0, now - 300, now, dataRoot, "QmSettle", 50, 9500
      );

      const balBefore = await ethers.provider.getBalance(operatorAddr);
      await marketplace.connect(admin).settleBatch(0, 0);
      const balAfter = await ethers.provider.getBalance(operatorAddr);

      expect(balAfter - balBefore).to.equal(ethers.parseEther("0.01"));
    });

    it("should cancel open order and refund", async function () {
      await marketplace.connect(buyer).createOrder(
        0, "MENA-UAE", 8000, 30, 86400, ethers.parseEther("0.01"),
        { value: ethers.parseEther("1") }
      );

      const balBefore = await ethers.provider.getBalance(buyerAddr);
      const tx = await marketplace.connect(buyer).cancelOrder(0);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      const balAfter = await ethers.provider.getBalance(buyerAddr);

      expect(balAfter + gasCost - balBefore).to.equal(ethers.parseEther("1"));

      const order = await marketplace.getOrder(0);
      expect(order.status).to.equal(3); // Cancelled
    });
  });

  describe("FinancingTrigger", function () {
    beforeEach(async function () {
      await registry.connect(operator).registerDevice(0, "loc", "MENA-UAE", 0, 100, 30);
    });

    it("should create a trigger with escrow", async function () {
      await trigger.connect(admin).createTrigger(
        operatorAddr, 0, 0, 40, 86400 * 7, 3,
        { value: ethers.parseEther("0.5") }
      );

      const t = await trigger.getTrigger(0);
      expect(t.beneficiary).to.equal(operatorAddr);
      expect(t.escrowedPayout).to.equal(ethers.parseEther("0.5"));
      expect(t.status).to.equal(0); // Active
    });

    it("should evaluate and increment streak", async function () {
      await trigger.connect(admin).createTrigger(
        operatorAddr, 0, 0, 40, 86400 * 7, 3,
        { value: ethers.parseEther("0.5") }
      );

      const now = Math.floor(Date.now() / 1000);
      const dataRoot = ethers.keccak256(ethers.toUtf8Bytes("eval-1"));
      await commitment.connect(operator).submitBatch(
        0, now - 300, now, dataRoot, "QmEval1", 50, 9500
      );

      await trigger.connect(admin).evaluate(0, 0);

      const t = await trigger.getTrigger(0);
      expect(t.currentStreak).to.equal(1);
    });

    it("should fire trigger after streak met", async function () {
      await trigger.connect(admin).createTrigger(
        operatorAddr, 0, 0, 40, 86400 * 7, 3,
        { value: ethers.parseEther("0.5") }
      );

      const now = Math.floor(Date.now() / 1000);
      for (let i = 0; i < 3; i++) {
        await commitment.connect(operator).submitBatch(
          0, now + i * 300, now + (i + 1) * 300,
          ethers.keccak256(ethers.toUtf8Bytes(`eval-${i}`)),
          `QmEval${i}`, 50, 9500
        );
        await trigger.connect(admin).evaluate(0, i);
      }

      const t = await trigger.getTrigger(0);
      expect(t.status).to.equal(1); // Triggered
      expect(t.escrowedPayout).to.equal(0);
    });

    it("should reset streak on non-qualifying batch", async function () {
      await trigger.connect(admin).createTrigger(
        operatorAddr, 0, 0, 40, 86400 * 7, 3,
        { value: ethers.parseEther("0.5") }
      );

      const now = Math.floor(Date.now() / 1000);
      // Submit qualifying batch
      await commitment.connect(operator).submitBatch(
        0, now - 300, now, ethers.keccak256(ethers.toUtf8Bytes("q1")), "QmQ1", 50, 9500
      );
      await trigger.connect(admin).evaluate(0, 0);

      // Submit non-qualifying batch (output below threshold)
      await commitment.connect(operator).submitBatch(
        0, now, now + 300, ethers.keccak256(ethers.toUtf8Bytes("nq")), "QmNQ", 30, 9500
      );
      await trigger.connect(admin).evaluate(0, 1);

      const t = await trigger.getTrigger(0);
      expect(t.currentStreak).to.equal(0);
    });

    it("should cancel trigger and refund", async function () {
      await trigger.connect(admin).createTrigger(
        operatorAddr, 0, 0, 40, 86400 * 7, 3,
        { value: ethers.parseEther("0.5") }
      );

      const balBefore = await ethers.provider.getBalance(adminAddr);
      const tx = await trigger.connect(admin).cancelTrigger(0);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      const balAfter = await ethers.provider.getBalance(adminAddr);

      expect(balAfter + gasCost - balBefore).to.equal(ethers.parseEther("0.5"));

      const t = await trigger.getTrigger(0);
      expect(t.status).to.equal(3); // Cancelled
    });
  });
});
