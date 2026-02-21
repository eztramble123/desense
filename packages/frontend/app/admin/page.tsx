"use client";

import { useState } from "react";
import {
  Shield,
  UserPlus,
  UserMinus,
  Search,
  Sun,
  Database,
  BarChart3,
  TrendingUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { RoleGuard } from "../components/RoleGuard";
import { StatCard } from "../components/StatCard";
import { TxLink } from "../components/TxLink";
import {
  useGrantRole,
  useRoles,
  useTotalDevices,
  useTotalBatches,
  useTotalOrders,
  useTotalTriggers,
} from "../hooks/useContracts";

export default function AdminPage() {
  const [roleAddress, setRoleAddress] = useState("");
  const {
    grantOperator,
    grantBuyer,
    grantAuditor,
    revokeOperator,
    revokeBuyer,
    revokeAuditor,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  } = useGrantRole();

  const [checkAddress, setCheckAddress] = useState("");
  const [queriedAddress, setQueriedAddress] = useState<`0x${string}` | undefined>();
  const roles = useRoles(queriedAddress);

  const { data: totalDevices } = useTotalDevices();
  const { data: totalBatches } = useTotalBatches();
  const { data: totalOrders } = useTotalOrders();
  const { data: totalTriggers } = useTotalTriggers();

  const isSubmitting = isPending || isConfirming;

  const handleRoleAction = (
    action: (account: `0x${string}`) => void
  ) => {
    if (!roleAddress) return;
    action(roleAddress as `0x${string}`);
  };

  const handleCheckRoles = () => {
    if (!checkAddress) return;
    setQueriedAddress(checkAddress as `0x${string}`);
  };

  return (
    <RoleGuard role="admin">
      <div className="space-y-8">
        <div>
          <h1 className="zeus-heading text-2xl text-zeus-stone-900">System Administration</h1>
          <p className="text-sm text-zeus-stone-500 mt-1">
            Manage roles and monitor system health
          </p>
        </div>

        <div>
          <h2 className="zeus-heading text-sm text-zeus-stone-800 mb-4">
            System Statistics
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="Total Assets"
              value={totalDevices !== undefined ? Number(totalDevices).toString() : "--"}
              icon={Sun}
            />
            <StatCard
              label="Total Attestations"
              value={totalBatches !== undefined ? Number(totalBatches).toString() : "--"}
              icon={Database}
            />
            <StatCard
              label="Total Subscriptions"
              value={totalOrders !== undefined ? Number(totalOrders).toString() : "--"}
              icon={BarChart3}
            />
            <StatCard
              label="Total Triggers"
              value={totalTriggers !== undefined ? Number(totalTriggers).toString() : "--"}
              icon={TrendingUp}
            />
          </div>
        </div>

        <div className="zeus-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-5 h-5 text-zeus-gold" />
            <h2 className="zeus-heading text-sm text-zeus-stone-800">
              Role Management
            </h2>
          </div>

          {isSuccess && hash && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-800">
                  Role updated successfully
                </p>
              </div>
              <div className="text-sm text-emerald-700 mt-1">
                Transaction: <TxLink hash={hash} />
              </div>
            </div>
          )}

          <div className="mb-5">
            <label className="zeus-label mb-1.5 block">
              Wallet Address
            </label>
            <input
              type="text"
              value={roleAddress}
              onChange={(e) => setRoleAddress(e.target.value)}
              placeholder="0x..."
              className="zeus-input font-mono"
            />
          </div>

          <div className="mb-4">
            <p className="zeus-label mb-2">
              Grant Role
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleRoleAction(grantOperator)}
                disabled={isSubmitting || !roleAddress}
                className="zeus-btn-primary text-xs py-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                Operator
              </button>
              <button
                onClick={() => handleRoleAction(grantBuyer)}
                disabled={isSubmitting || !roleAddress}
                className="zeus-btn-primary text-xs py-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                Subscriber
              </button>
              <button
                onClick={() => handleRoleAction(grantAuditor)}
                disabled={isSubmitting || !roleAddress}
                className="zeus-btn-primary text-xs py-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                Auditor
              </button>
            </div>
          </div>

          <div>
            <p className="zeus-label mb-2">
              Revoke Role
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleRoleAction(revokeOperator)}
                disabled={isSubmitting || !roleAddress}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-red-200 text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserMinus className="w-3.5 h-3.5" />
                )}
                Operator
              </button>
              <button
                onClick={() => handleRoleAction(revokeBuyer)}
                disabled={isSubmitting || !roleAddress}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-red-200 text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserMinus className="w-3.5 h-3.5" />
                )}
                Subscriber
              </button>
              <button
                onClick={() => handleRoleAction(revokeAuditor)}
                disabled={isSubmitting || !roleAddress}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-red-200 text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserMinus className="w-3.5 h-3.5" />
                )}
                Auditor
              </button>
            </div>
          </div>
        </div>

        <div className="zeus-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Search className="w-5 h-5 text-zeus-gold" />
            <h2 className="zeus-heading text-sm text-zeus-stone-800">
              Role Lookup
            </h2>
          </div>

          <div className="flex gap-3 mb-5">
            <input
              type="text"
              value={checkAddress}
              onChange={(e) => setCheckAddress(e.target.value)}
              placeholder="0x... address to check"
              className="zeus-input flex-1 font-mono"
            />
            <button
              onClick={handleCheckRoles}
              disabled={!checkAddress}
              className="zeus-btn-primary"
            >
              <Search className="w-4 h-4" />
              Check
            </button>
          </div>

          {queriedAddress && (
            <div className="border border-zeus-stone-200 rounded-lg divide-y divide-zeus-stone-200">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="zeus-label">
                  Admin
                </span>
                <RoleBadge active={roles.isAdmin} />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="zeus-label">
                  Operator
                </span>
                <RoleBadge active={roles.isOperator} />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="zeus-label">
                  Subscriber
                </span>
                <RoleBadge active={roles.isBuyer} />
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}

function RoleBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" />
      Granted
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zeus-stone-100 text-zeus-stone-500 border border-zeus-stone-200">
      <AlertCircle className="w-3 h-3" />
      Not Assigned
    </span>
  );
}
