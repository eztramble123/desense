import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("Zeus Protocol", function () {
  let accessControl: Contract;
  let registry: Contract;
  let commitment: Contract;
  let marketplace: Contract;
  let trigger: Contract;

  let admin: Signer;
  let operator: Signer;
  let buyer: Signer;
  let auditor: Signer;
  let other: Signer;

  let adminAddr: string;
  let operatorAddr: string;
  let buyerAddr: string;
  let auditorAddr: string;

  beforeEach(async function () {
    [admin, operator, buyer, auditor, other] = await ethers.getSigners();
    adminAddr = await admin.getAddress();
    operatorAddr = await operator.getAddress();
    buyerAddr = await buyer.getAddress();
    auditorAddr = await auditor.getAddress();

    // Deploy AccessControl
    const AccessControl = await ethers.getContractFactory("ZeusAccessControl");
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
    await accessControl.grantAuditorRole(auditorAddr);
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

    it("should grant and check auditor role", async function () {
      expect(await accessControl.isAuditor(auditorAddr)).to.be.true;
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
        0, // SolarArray
        "Dubai Solar Park, Block A",
        "MENA-UAE",
        0,
        100,
        30,
        100000,    // 100kW capacity
        25204800,  // latitude 25.2048
        55270800   // longitude 55.2708
      );
      await tx.wait();

      const device = await registry.getDevice(0);
      expect(device.deviceType).to.equal(0);
      expect(device.region).to.equal("MENA-UAE");
      expect(device.operator).to.equal(operatorAddr);
      expect(device.status).to.equal(1); // Active
      expect(device.capacity).to.equal(100000);
      expect(device.latitude).to.equal(25204800);
      expect(device.longitude).to.equal(55270800);
    });

    it("should prevent non-operator from registering", async function () {
      await expect(
        registry.connect(buyer).registerDevice(0, "loc", "region", 0, 100, 30, 100000, 0, 0)
      ).to.be.revertedWith("DeviceRegistry: caller is not operator");
    });

    it("should allow admin to change device status", async function () {
      await registry.connect(operator).registerDevice(0, "loc", "MENA-UAE", 0, 100, 30, 100000, 0, 0);
      await registry.connect(admin).setDeviceStatus(0, 2); // Suspended
      const device = await registry.getDevice(0);
      expect(device.status).to.equal(2);
    });

    it("should enumerate devices by operator", async function () {
      await registry.connect(operator).registerDevice(0, "loc1", "MENA-UAE", 0, 100, 30, 100000, 0, 0);
      await registry.connect(operator).registerDevice(1, "loc2", "MENA-UAE", 0, 500, 60, 200000, 0, 0);
      const devices = await registry.getDevicesByOperator(operatorAddr);
      expect(devices.length).to.equal(2);
    });
  });

  describe("DataCommitment", function () {
    beforeEach(async function () {
      await registry.connect(operator).registerDevice(0, "loc", "MENA-UAE", 0, 100, 30, 100000, 0, 0);
    });

    it("should submit a batch (batchId starts at 1)", async function () {
      const now = Math.floor(Date.now() / 1000);
      const dataRoot = ethers.keccak256(ethers.toUtf8Bytes("test-data"));

      await commitment.connect(operator).submitBatch(
        0, now - 300, now, dataRoot, "QmTestCid", 50, 9500
      );

      const batch = await commitment.getBatch(1); // batchId=1
      expect(batch.deviceId).to.equal(0);
      expect(batch.avgOutput).to.equal(50);
      expect(batch.uptimeBps).to.equal(9500);
      expect(batch.dataRoot).to.equal(dataRoot);
      expect(batch.disputed).to.be.false;
    });

    it("should reject duplicate window", async function () {
      const now = Math.floor(Date.now() / 1000);
      const dataRoot = ethers.keccak256(ethers.toUtf8Bytes("test-data"));

      await commitment.connect(operator).submitBatch(
        0, now - 300, now, dataRoot, "QmTestCid1", 50, 9500
      );

      await expect(
        commitment.connect(operator).submitBatch(
          0, now - 300, now, ethers.keccak256(ethers.toUtf8Bytes("dup")), "QmDup", 50, 9500
        )
      ).to.be.revertedWith("DataCommitment: duplicate window");
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

    it("should prevent non-operator from submitting", async function () {
      const now = Math.floor(Date.now() / 1000);
      const dataRoot = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await expect(
        commitment.connect(buyer).submitBatch(0, now - 300, now, dataRoot, "Qm", 50, 9500)
      ).to.be.revertedWith("DataCommitment: caller is not operator");
    });

    it("should allow a different operator to submit for a device they don't own", async function () {
      // Grant operator role to a second account that does NOT own the device
      const otherOperator = other;
      const otherOperatorAddr = await otherOperator.getAddress();
      await accessControl.grantOperatorRole(otherOperatorAddr);

      const now = Math.floor(Date.now() / 1000);
      const dataRoot = ethers.keccak256(ethers.toUtf8Bytes("delegated-test"));

      // otherOperator submits a batch for device 0 (owned by `operator`)
      await commitment.connect(otherOperator).submitBatch(
        0, now - 300, now, dataRoot, "QmDelegated", 50, 9500
      );

      const batch = await commitment.getBatch(1);
      expect(batch.deviceId).to.equal(0);
      expect(batch.submitter).to.equal(otherOperatorAddr);
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

    it("should verify a reading with Merkle proof", async function () {
      const now = Math.floor(Date.now() / 1000);

      // Create a simple leaf and use it as root (single-leaf tree)
      const leaf = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint256", "uint256", "bool"],
          [now, 5000, true]
        )
      );
      // For a single-leaf tree, root = leaf, proof = []
      await commitment.connect(operator).submitBatch(
        0, now - 300, now, leaf, "QmVerify", 50, 9500
      );

      const valid = await commitment.verifyReading(1, [], leaf);
      expect(valid).to.be.true;

      // Invalid leaf should fail
      const badLeaf = ethers.keccak256(ethers.toUtf8Bytes("bad"));
      const invalid = await commitment.verifyReading(1, [], badLeaf);
      expect(invalid).to.be.false;
    });

    it("should allow auditor to dispute a batch", async function () {
      const now = Math.floor(Date.now() / 1000);
      const dataRoot = ethers.keccak256(ethers.toUtf8Bytes("dispute-test"));

      await commitment.connect(operator).submitBatch(
        0, now - 300, now, dataRoot, "QmDispute", 50, 9500
      );

      // SLA before dispute
      let sla = await commitment.getDeviceSLA(0);
      expect(sla.totalBatches).to.equal(1);

      await commitment.connect(auditor).disputeBatch(1, "Suspicious readings");

      const batch = await commitment.getBatch(1);
      expect(batch.disputed).to.be.true;
      expect(batch.disputeReason).to.equal("Suspicious readings");

      // SLA should be decremented
      sla = await commitment.getDeviceSLA(0);
      expect(sla.totalBatches).to.equal(0);
    });

    it("should prevent non-auditor from disputing", async function () {
      const now = Math.floor(Date.now() / 1000);
      const dataRoot = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await commitment.connect(operator).submitBatch(
        0, now - 300, now, dataRoot, "QmTest", 50, 9500
      );

      await expect(
        commitment.connect(operator).disputeBatch(1, "fake dispute")
      ).to.be.revertedWith("DataCommitment: caller is not auditor");
    });
  });

  describe("DataMarketplace", function () {
    beforeEach(async function () {
      await registry.connect(operator).registerDevice(0, "loc", "MENA-UAE", 0, 100, 30, 100000, 0, 0);
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
      await marketplace.connect(admin).settleBatch(0, 1); // batchId=1
      const balAfter = await ethers.provider.getBalance(operatorAddr);

      expect(balAfter - balBefore).to.equal(ethers.parseEther("0.01"));
    });

    it("should not settle a disputed batch", async function () {
      await marketplace.connect(buyer).createOrder(
        0, "MENA-UAE", 8000, 30, 86400, ethers.parseEther("0.01"),
        { value: ethers.parseEther("1") }
      );
      await marketplace.connect(operator).matchDevice(0, 0);

      const now = Math.floor(Date.now() / 1000);
      const dataRoot = ethers.keccak256(ethers.toUtf8Bytes("disputed-settle"));
      await commitment.connect(operator).submitBatch(
        0, now - 300, now, dataRoot, "QmDisp", 50, 9500
      );
      await commitment.connect(auditor).disputeBatch(1, "Bad data");

      await expect(
        marketplace.connect(admin).settleBatch(0, 1)
      ).to.be.revertedWith("DataMarketplace: batch is disputed");
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
      await registry.connect(operator).registerDevice(0, "loc", "MENA-UAE", 0, 100, 30, 100000, 0, 0);
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

      await trigger.connect(admin).evaluate(0, 1); // batchId=1

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
        await trigger.connect(admin).evaluate(0, i + 1); // batchIds: 1, 2, 3
      }

      const t = await trigger.getTrigger(0);
      expect(t.status).to.equal(1); // Triggered
      expect(t.escrowedPayout).to.equal(0);
    });

    it("should reject disputed batches in evaluation", async function () {
      await trigger.connect(admin).createTrigger(
        operatorAddr, 0, 0, 40, 86400 * 7, 3,
        { value: ethers.parseEther("0.5") }
      );

      const now = Math.floor(Date.now() / 1000);
      await commitment.connect(operator).submitBatch(
        0, now - 300, now, ethers.keccak256(ethers.toUtf8Bytes("disp")), "QmDisp", 50, 9500
      );
      await commitment.connect(auditor).disputeBatch(1, "Bad");

      await expect(
        trigger.connect(admin).evaluate(0, 1)
      ).to.be.revertedWith("FinancingTrigger: batch is disputed");
    });

    it("should reset streak on non-qualifying batch", async function () {
      await trigger.connect(admin).createTrigger(
        operatorAddr, 0, 0, 40, 86400 * 7, 3,
        { value: ethers.parseEther("0.5") }
      );

      const now = Math.floor(Date.now() / 1000);
      // Qualifying batch
      await commitment.connect(operator).submitBatch(
        0, now - 300, now, ethers.keccak256(ethers.toUtf8Bytes("q1")), "QmQ1", 50, 9500
      );
      await trigger.connect(admin).evaluate(0, 1);

      // Non-qualifying batch (output below threshold)
      await commitment.connect(operator).submitBatch(
        0, now, now + 300, ethers.keccak256(ethers.toUtf8Bytes("nq")), "QmNQ", 30, 9500
      );
      await trigger.connect(admin).evaluate(0, 2);

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
