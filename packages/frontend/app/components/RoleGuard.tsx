"use client";

import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS, ACCESS_CONTROL_ABI } from "../lib/contracts";
import { Shield } from "lucide-react";

type Role = "admin" | "operator" | "buyer" | "auditor";

const ROLE_FN: Record<Role, string> = {
  admin: "isAdmin",
  operator: "isOperator",
  buyer: "isBuyer",
  auditor: "isAuditor",
};

interface RoleGuardProps {
  role: Role;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ role, children, fallback }: RoleGuardProps) {
  const { address, isConnected } = useAccount();

  const { data: hasRole, isLoading } = useReadContract({
    address: CONTRACTS.accessControl,
    abi: ACCESS_CONTROL_ABI,
    functionName: ROLE_FN[role] as any,
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Shield className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">Connect your wallet to continue</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasRole) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Shield className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm mt-2">
          You need the <span className="font-semibold capitalize">{role}</span> role to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
