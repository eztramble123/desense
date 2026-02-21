"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import {
  PAYMASTER_CONTRACTS,
  NATIVE_PAYMASTER_ABI,
  ERC20_PAYMASTER_ABI,
} from "../lib/paymaster-contracts";

// ============= NATIVE PAYMASTER =============

export function useNativePaymasterDeposit() {
  const { data, ...rest } = useReadContract({
    address: PAYMASTER_CONTRACTS.nativePaymaster,
    abi: NATIVE_PAYMASTER_ABI,
    functionName: "getDeposit",
  });

  return {
    data: data !== undefined ? formatEther(data) : undefined,
    raw: data,
    ...rest,
  };
}

export function useNativePaymasterSigner() {
  return useReadContract({
    address: PAYMASTER_CONTRACTS.nativePaymaster,
    abi: NATIVE_PAYMASTER_ABI,
    functionName: "sponsorSigner",
  });
}

export function useNativePaymasterOwner() {
  return useReadContract({
    address: PAYMASTER_CONTRACTS.nativePaymaster,
    abi: NATIVE_PAYMASTER_ABI,
    functionName: "owner",
  });
}

export function useSetSponsorSigner() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setSigner = (signer: `0x${string}`) =>
    writeContract({
      address: PAYMASTER_CONTRACTS.nativePaymaster,
      abi: NATIVE_PAYMASTER_ABI,
      functionName: "setSponsorSigner",
      args: [signer],
    });

  return { setSigner, isPending, isConfirming, isSuccess, hash };
}

export function useFundNativePaymaster() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const fund = (amount: string) =>
    writeContract({
      address: PAYMASTER_CONTRACTS.nativePaymaster,
      abi: NATIVE_PAYMASTER_ABI,
      functionName: "deposit",
      value: parseEther(amount),
    });

  return { fund, isPending, isConfirming, isSuccess, hash };
}

// ============= ERC20 PAYMASTER =============

export function useERC20PaymasterDeposit() {
  const { data, ...rest } = useReadContract({
    address: PAYMASTER_CONTRACTS.erc20Paymaster,
    abi: ERC20_PAYMASTER_ABI,
    functionName: "getDeposit",
  });

  return {
    data: data !== undefined ? formatEther(data) : undefined,
    raw: data,
    ...rest,
  };
}

export function useERC20PaymasterToken() {
  return useReadContract({
    address: PAYMASTER_CONTRACTS.erc20Paymaster,
    abi: ERC20_PAYMASTER_ABI,
    functionName: "token",
  });
}

export function useERC20PaymasterMarkup() {
  const { data, ...rest } = useReadContract({
    address: PAYMASTER_CONTRACTS.erc20Paymaster,
    abi: ERC20_PAYMASTER_ABI,
    functionName: "tokenPriceMarkup",
  });

  return {
    data: data !== undefined ? `${Number(data) / 100}%` : undefined,
    raw: data,
    ...rest,
  };
}

export function useERC20PaymasterRate() {
  const { data, ...rest } = useReadContract({
    address: PAYMASTER_CONTRACTS.erc20Paymaster,
    abi: ERC20_PAYMASTER_ABI,
    functionName: "nativeToTokenRate",
  });

  return {
    data: data !== undefined ? formatEther(data) : undefined,
    raw: data,
    ...rest,
  };
}

export function useFundERC20Paymaster() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const fund = (amount: string) =>
    writeContract({
      address: PAYMASTER_CONTRACTS.erc20Paymaster,
      abi: ERC20_PAYMASTER_ABI,
      functionName: "deposit",
      value: parseEther(amount),
    });

  return { fund, isPending, isConfirming, isSuccess, hash };
}

export { formatEther, parseEther };
