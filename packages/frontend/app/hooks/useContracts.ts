"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import {
  CONTRACTS,
  ACCESS_CONTROL_ABI,
  DEVICE_REGISTRY_ABI,
  DATA_COMMITMENT_ABI,
  DATA_MARKETPLACE_ABI,
  FINANCING_TRIGGER_ABI,
  DEVICE_TYPES,
  DEVICE_STATUSES,
  ORDER_STATUSES,
  TRIGGER_TYPES,
  TRIGGER_STATUSES,
} from "../lib/contracts";

// ============= ACCESS CONTROL =============

export function useRoles(address?: `0x${string}`) {
  const { data: isAdmin } = useReadContract({
    address: CONTRACTS.accessControl,
    abi: ACCESS_CONTROL_ABI,
    functionName: "isAdmin",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: isOperator } = useReadContract({
    address: CONTRACTS.accessControl,
    abi: ACCESS_CONTROL_ABI,
    functionName: "isOperator",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: isBuyer } = useReadContract({
    address: CONTRACTS.accessControl,
    abi: ACCESS_CONTROL_ABI,
    functionName: "isBuyer",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return { isAdmin: !!isAdmin, isOperator: !!isOperator, isBuyer: !!isBuyer };
}

export function useGrantRole() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const grantOperator = (account: `0x${string}`) =>
    writeContract({ address: CONTRACTS.accessControl, abi: ACCESS_CONTROL_ABI, functionName: "grantOperatorRole", args: [account] });
  const grantBuyer = (account: `0x${string}`) =>
    writeContract({ address: CONTRACTS.accessControl, abi: ACCESS_CONTROL_ABI, functionName: "grantBuyerRole", args: [account] });
  const grantAuditor = (account: `0x${string}`) =>
    writeContract({ address: CONTRACTS.accessControl, abi: ACCESS_CONTROL_ABI, functionName: "grantAuditorRole", args: [account] });

  const revokeOperator = (account: `0x${string}`) =>
    writeContract({ address: CONTRACTS.accessControl, abi: ACCESS_CONTROL_ABI, functionName: "revokeOperatorRole", args: [account] });
  const revokeBuyer = (account: `0x${string}`) =>
    writeContract({ address: CONTRACTS.accessControl, abi: ACCESS_CONTROL_ABI, functionName: "revokeBuyerRole", args: [account] });
  const revokeAuditor = (account: `0x${string}`) =>
    writeContract({ address: CONTRACTS.accessControl, abi: ACCESS_CONTROL_ABI, functionName: "revokeAuditorRole", args: [account] });

  return { grantOperator, grantBuyer, grantAuditor, revokeOperator, revokeBuyer, revokeAuditor, isPending, isConfirming, isSuccess, hash };
}

// ============= DEVICE REGISTRY =============

export function useTotalDevices() {
  return useReadContract({
    address: CONTRACTS.deviceRegistry,
    abi: DEVICE_REGISTRY_ABI,
    functionName: "totalDevices",
  });
}

export function useDevice(deviceId: bigint | undefined) {
  const { data, ...rest } = useReadContract({
    address: CONTRACTS.deviceRegistry,
    abi: DEVICE_REGISTRY_ABI,
    functionName: "getDevice",
    args: deviceId !== undefined ? [deviceId] : undefined,
    query: { enabled: deviceId !== undefined },
  });

  const device = data
    ? {
        deviceType: Number(data.deviceType),
        deviceTypeName: DEVICE_TYPES[Number(data.deviceType)],
        status: Number(data.status),
        statusName: DEVICE_STATUSES[Number(data.status)],
        location: data.location,
        region: data.region,
        minOutput: Number(data.minOutput),
        maxOutput: Number(data.maxOutput),
        samplingRateSeconds: Number(data.samplingRateSeconds),
        operator: data.operator,
        registeredAt: Number(data.registeredAt),
      }
    : null;

  return { data: device, ...rest };
}

export function useDevicesByOperator(operator?: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.deviceRegistry,
    abi: DEVICE_REGISTRY_ABI,
    functionName: "getDevicesByOperator",
    args: operator ? [operator] : undefined,
    query: { enabled: !!operator },
  });
}

export function useRegisterDevice() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const register = (
    deviceType: number,
    location: string,
    region: string,
    minOutput: bigint,
    maxOutput: bigint,
    samplingRate: bigint
  ) =>
    writeContract({
      address: CONTRACTS.deviceRegistry,
      abi: DEVICE_REGISTRY_ABI,
      functionName: "registerDevice",
      args: [deviceType, location, region, minOutput, maxOutput, samplingRate],
    });

  return { register, isPending, isConfirming, isSuccess, hash };
}

// ============= DATA COMMITMENT =============

export function useTotalBatches() {
  return useReadContract({
    address: CONTRACTS.dataCommitment,
    abi: DATA_COMMITMENT_ABI,
    functionName: "totalBatches",
  });
}

export function useBatch(batchId: bigint | undefined) {
  const { data, ...rest } = useReadContract({
    address: CONTRACTS.dataCommitment,
    abi: DATA_COMMITMENT_ABI,
    functionName: "getBatch",
    args: batchId !== undefined ? [batchId] : undefined,
    query: { enabled: batchId !== undefined },
  });

  return { data, ...rest };
}

export function useDeviceSLA(deviceId: bigint | undefined) {
  const { data, ...rest } = useReadContract({
    address: CONTRACTS.dataCommitment,
    abi: DATA_COMMITMENT_ABI,
    functionName: "getDeviceSLA",
    args: deviceId !== undefined ? [deviceId] : undefined,
    query: { enabled: deviceId !== undefined },
  });

  const sla = data
    ? {
        totalBatches: Number(data.totalBatches),
        avgUptime: Number(data.totalBatches) > 0 ? Number(data.cumulativeUptime) / Number(data.totalBatches) / 100 : 0,
        avgOutput: Number(data.totalBatches) > 0 ? Number(data.cumulativeOutput) / Number(data.totalBatches) : 0,
        freshnessPenalties: Number(data.freshnessPenalties),
        lastSubmission: Number(data.lastSubmission),
      }
    : null;

  return { data: sla, ...rest };
}

export function useDeviceBatches(deviceId: bigint | undefined, offset: bigint = 0n, limit: bigint = 20n) {
  return useReadContract({
    address: CONTRACTS.dataCommitment,
    abi: DATA_COMMITMENT_ABI,
    functionName: "getDeviceBatches",
    args: deviceId !== undefined ? [deviceId, offset, limit] : undefined,
    query: { enabled: deviceId !== undefined },
  });
}

export function useDeviceBatchCount(deviceId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.dataCommitment,
    abi: DATA_COMMITMENT_ABI,
    functionName: "getDeviceBatchCount",
    args: deviceId !== undefined ? [deviceId] : undefined,
    query: { enabled: deviceId !== undefined },
  });
}

// ============= MARKETPLACE =============

export function useTotalOrders() {
  return useReadContract({
    address: CONTRACTS.dataMarketplace,
    abi: DATA_MARKETPLACE_ABI,
    functionName: "totalOrders",
  });
}

export function useOrder(orderId: bigint | undefined) {
  const { data, ...rest } = useReadContract({
    address: CONTRACTS.dataMarketplace,
    abi: DATA_MARKETPLACE_ABI,
    functionName: "getOrder",
    args: orderId !== undefined ? [orderId] : undefined,
    query: { enabled: orderId !== undefined },
  });

  const order = data
    ? {
        buyer: data.buyer,
        deviceType: Number(data.deviceType),
        deviceTypeName: DEVICE_TYPES[Number(data.deviceType)],
        region: data.region,
        minUptimeBps: Number(data.minUptimeBps),
        minAvgOutput: Number(data.minAvgOutput),
        duration: Number(data.duration),
        pricePerBatch: data.pricePerBatch,
        pricePerBatchFormatted: formatEther(data.pricePerBatch),
        totalEscrow: data.totalEscrow,
        totalEscrowFormatted: formatEther(data.totalEscrow),
        remainingEscrow: data.remainingEscrow,
        remainingEscrowFormatted: formatEther(data.remainingEscrow),
        createdAt: Number(data.createdAt),
        expiresAt: Number(data.expiresAt),
        status: Number(data.status),
        statusName: ORDER_STATUSES[Number(data.status)],
      }
    : null;

  return { data: order, ...rest };
}

export function useOrderDevices(orderId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.dataMarketplace,
    abi: DATA_MARKETPLACE_ABI,
    functionName: "getOrderDevices",
    args: orderId !== undefined ? [orderId] : undefined,
    query: { enabled: orderId !== undefined },
  });
}

export function useCreateOrder() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createOrder = (
    deviceType: number,
    region: string,
    minUptimeBps: bigint,
    minAvgOutput: bigint,
    duration: bigint,
    pricePerBatch: bigint,
    escrowAmount: string
  ) =>
    writeContract({
      address: CONTRACTS.dataMarketplace,
      abi: DATA_MARKETPLACE_ABI,
      functionName: "createOrder",
      args: [deviceType, region, minUptimeBps, minAvgOutput, duration, pricePerBatch],
      value: parseEther(escrowAmount),
    });

  return { createOrder, isPending, isConfirming, isSuccess, hash };
}

export function useMatchDevice() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const matchDevice = (orderId: bigint, deviceId: bigint) =>
    writeContract({
      address: CONTRACTS.dataMarketplace,
      abi: DATA_MARKETPLACE_ABI,
      functionName: "matchDevice",
      args: [orderId, deviceId],
    });

  return { matchDevice, isPending, isConfirming, isSuccess, hash };
}

// ============= FINANCING TRIGGER =============

export function useTotalTriggers() {
  return useReadContract({
    address: CONTRACTS.financingTrigger,
    abi: FINANCING_TRIGGER_ABI,
    functionName: "totalTriggers",
  });
}

export function useTrigger(triggerId: bigint | undefined) {
  const { data, ...rest } = useReadContract({
    address: CONTRACTS.financingTrigger,
    abi: FINANCING_TRIGGER_ABI,
    functionName: "getTrigger",
    args: triggerId !== undefined ? [triggerId] : undefined,
    query: { enabled: triggerId !== undefined },
  });

  const trigger = data
    ? {
        creator: data.creator,
        beneficiary: data.beneficiary,
        deviceId: Number(data.deviceId),
        triggerType: Number(data.triggerType),
        triggerTypeName: TRIGGER_TYPES[Number(data.triggerType)],
        threshold: Number(data.threshold),
        observationPeriod: Number(data.observationPeriod),
        requiredStreak: Number(data.requiredStreak),
        currentStreak: Number(data.currentStreak),
        escrowedPayout: data.escrowedPayout,
        escrowedPayoutFormatted: formatEther(data.escrowedPayout),
        status: Number(data.status),
        statusName: TRIGGER_STATUSES[Number(data.status)],
        createdAt: Number(data.createdAt),
        expiresAt: Number(data.expiresAt),
        lastEvaluatedBatch: Number(data.lastEvaluatedBatch),
      }
    : null;

  return { data: trigger, ...rest };
}

export function useCreateTrigger() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createTrigger = (
    beneficiary: `0x${string}`,
    deviceId: bigint,
    triggerType: number,
    threshold: bigint,
    observationPeriod: bigint,
    requiredStreak: bigint,
    payoutAmount: string
  ) =>
    writeContract({
      address: CONTRACTS.financingTrigger,
      abi: FINANCING_TRIGGER_ABI,
      functionName: "createTrigger",
      args: [beneficiary, deviceId, triggerType, threshold, observationPeriod, requiredStreak],
      value: parseEther(payoutAmount),
    });

  return { createTrigger, isPending, isConfirming, isSuccess, hash };
}

export { DEVICE_TYPES, DEVICE_STATUSES, ORDER_STATUSES, TRIGGER_TYPES, TRIGGER_STATUSES, formatEther, parseEther };
