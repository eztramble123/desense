"use client";

import { useState } from "react";
import {
  Shield,
  UserPlus,
  UserMinus,
  Search,
  Cpu,
  Database,
  ShoppingCart,
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
  // Role management state
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

  // Role check state
  const [checkAddress, setCheckAddress] = useState("");
  const [queriedAddress, setQueriedAddress] = useState<`0x${string}` | undefined>();
  const roles = useRoles(queriedAddress);

  // System stats
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage roles and monitor system health
          </p>
        </div>

        {/* System Stats */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            System Statistics
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="Total Devices"
              value={totalDevices !== undefined ? Number(totalDevices).toString() : "--"}
              icon={Cpu}
            />
            <StatCard
              label="Total Batches"
              value={totalBatches !== undefined ? Number(totalBatches).toString() : "--"}
              icon={Database}
            />
            <StatCard
              label="Total Orders"
              value={totalOrders !== undefined ? Number(totalOrders).toString() : "--"}
              icon={ShoppingCart}
            />
            <StatCard
              label="Total Triggers"
              value={totalTriggers !== undefined ? Number(totalTriggers).toString() : "--"}
              icon={TrendingUp}
            />
          </div>
        </div>

        {/* Role Management */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">
              Role Management
            </h2>
          </div>

          {/* Success feedback */}
          {isSuccess && hash && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  Role updated successfully
                </p>
              </div>
              <div className="text-sm text-green-700 mt-1">
                Transaction: <TxLink hash={hash} />
              </div>
            </div>
          )}

          {/* Address input */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Wallet Address
            </label>
            <input
              type="text"
              value={roleAddress}
              onChange={(e) => setRoleAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Grant buttons */}
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-600 mb-2">
              Grant Role
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleRoleAction(grantOperator)}
                disabled={isSubmitting || !roleAddress}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                Buyer
              </button>
              <button
                onClick={() => handleRoleAction(grantAuditor)}
                disabled={isSubmitting || !roleAddress}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

          {/* Revoke buttons */}
          <div>
            <p className="text-sm font-medium text-slate-600 mb-2">
              Revoke Role
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleRoleAction(revokeOperator)}
                disabled={isSubmitting || !roleAddress}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserMinus className="w-3.5 h-3.5" />
                )}
                Buyer
              </button>
              <button
                onClick={() => handleRoleAction(revokeAuditor)}
                disabled={isSubmitting || !roleAddress}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

        {/* Role Check */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Search className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">
              Role Lookup
            </h2>
          </div>

          <div className="flex gap-3 mb-5">
            <input
              type="text"
              value={checkAddress}
              onChange={(e) => setCheckAddress(e.target.value)}
              placeholder="0x... address to check"
              className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleCheckRoles}
              disabled={!checkAddress}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Search className="w-4 h-4" />
              Check
            </button>
          </div>

          {queriedAddress && (
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-slate-700">
                  Admin
                </span>
                <RoleBadge active={roles.isAdmin} />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-slate-700">
                  Operator
                </span>
                <RoleBadge active={roles.isOperator} />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-slate-700">
                  Buyer
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
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle2 className="w-3 h-3" />
      Granted
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
      <AlertCircle className="w-3 h-3" />
      Not Assigned
    </span>
  );
}
