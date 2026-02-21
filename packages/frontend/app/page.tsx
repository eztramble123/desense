"use client";

import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS, ACCESS_CONTROL_ABI } from "./lib/contracts";
import { Zap, Sun, BarChart3, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";

function RoleCard({ label, description, href, icon: Icon, hasRole }: {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  hasRole: boolean;
}) {
  return (
    <Link
      href={href}
      className={`zeus-card p-6 transition-all ${
        hasRole
          ? "border-zeus-gold/30 hover:border-zeus-gold hover:shadow-md"
          : "opacity-50"
      }`}
    >
      <div className="p-2.5 bg-zeus-stone-100 rounded-lg border border-zeus-stone-200 shadow-inner w-fit mb-4">
        <Icon className={`w-6 h-6 ${hasRole ? "text-zeus-gold" : "text-zeus-stone-400"}`} />
      </div>
      <h3 className="zeus-heading text-sm text-zeus-stone-800">{label}</h3>
      <p className="text-xs text-zeus-stone-500 mt-1">
        {hasRole ? description : "Role not assigned"}
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
        <div className="inline-flex p-4 bg-zeus-stone-100 rounded-xl border border-zeus-stone-200 shadow-inner mb-6">
          <Zap className="w-12 h-12 text-zeus-gold" />
        </div>
        <h1 className="font-display text-5xl font-bold uppercase tracking-[0.1em] text-zeus-stone-900">Zeus</h1>
        <p className="font-display text-xl text-zeus-stone-500 mt-3 uppercase tracking-wider">
          Proof of Generation
        </p>
        <p className="text-sm text-zeus-stone-400 mt-2 max-w-lg mx-auto">
          Blockchain-verified energy generation attestation for solar, wind, and hydro assets.
          Compliance-grade documentation for taxes, grants, RECs, and regulatory filings.
        </p>
      </div>

      {!isConnected ? (
        <div className="text-center py-12 zeus-card">
          <p className="text-zeus-stone-500 mb-4">Connect your wallet to get started</p>
          <p className="zeus-label">ADI Testnet (Chain ID: 99999)</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <RoleCard
            label="Generation Assets"
            description="Register and monitor energy assets"
            href="/operator"
            icon={Sun}
            hasRole={!!isOperator}
          />
          <RoleCard
            label="Data Subscriptions"
            description="Subscribe to generation data"
            href="/buyer"
            icon={BarChart3}
            hasRole={!!isBuyer}
          />
          <RoleCard
            label="Performance Triggers"
            description="Performance-based incentive payouts"
            href="/finance"
            icon={TrendingUp}
            hasRole={isConnected}
          />
          <RoleCard
            label="System Administration"
            description="Role management and system config"
            href="/admin"
            icon={Shield}
            hasRole={!!isAdmin}
          />
        </div>
      )}
    </div>
  );
}
