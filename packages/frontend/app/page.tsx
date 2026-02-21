"use client";

import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS, ACCESS_CONTROL_ABI } from "./lib/contracts";
import { Radio, Cpu, ShoppingCart, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";

function RoleCard({ label, href, icon: Icon, hasRole }: {
  label: string;
  href: string;
  icon: React.ElementType;
  hasRole: boolean;
}) {
  return (
    <Link
      href={href}
      className={`p-6 rounded-xl border-2 transition-all ${
        hasRole
          ? "border-blue-200 bg-blue-50 hover:border-blue-400"
          : "border-slate-200 bg-white opacity-50"
      }`}
    >
      <Icon className={`w-8 h-8 mb-3 ${hasRole ? "text-blue-600" : "text-slate-400"}`} />
      <h3 className="font-semibold text-slate-900">{label}</h3>
      <p className="text-sm text-slate-500 mt-1">
        {hasRole ? "Access granted" : "Role not assigned"}
      </p>
    </Link>
  );
}

export default function Home() {
  const { address, isConnected } = useAccount();

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex p-4 bg-blue-100 rounded-2xl mb-6">
          <Radio className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900">DeSense</h1>
        <p className="text-lg text-slate-500 mt-3">
          Proof-of-Sensing DePIN Network on ADI Chain
        </p>
        <p className="text-sm text-slate-400 mt-2">
          Deploy energy sensors, commit verifiable data onchain, and power institutional data markets
        </p>
      </div>

      {!isConnected ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 mb-4">Connect your wallet to get started</p>
          <p className="text-xs text-slate-400">ADI Testnet (Chain ID: 99999)</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <RoleCard label="Operator Console" href="/operator" icon={Cpu} hasRole={!!isOperator} />
          <RoleCard label="Buyer Dashboard" href="/buyer" icon={ShoppingCart} hasRole={!!isBuyer} />
          <RoleCard label="Financing Module" href="/finance" icon={TrendingUp} hasRole={isConnected} />
          <RoleCard label="Admin Panel" href="/admin" icon={Shield} hasRole={!!isAdmin} />
        </div>
      )}
    </div>
  );
}
