"use client";

import Link from "next/link";
import {
  TrendingUp,
  Zap,
  Plus,
  ArrowRight,
  Target,
} from "lucide-react";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { AddressLink } from "../components/TxLink";
import {
  useTotalTriggers,
  useTrigger,
} from "../hooks/useContracts";

function TriggerRow({ triggerId }: { triggerId: bigint }) {
  const { data: trigger } = useTrigger(triggerId);

  if (!trigger) {
    return (
      <tr className="border-b border-slate-100">
        <td colSpan={8} className="px-4 py-3 text-slate-400 text-sm">
          Loading trigger #{triggerId.toString()}...
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-slate-900">
        #{triggerId.toString()}
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">
        #{trigger.deviceId}
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">
        {trigger.triggerTypeName}
      </td>
      <td className="px-4 py-3 text-sm text-slate-700 font-mono">
        {trigger.threshold}
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">
        <span className="font-medium">{trigger.currentStreak}</span>
        <span className="text-slate-400"> / {trigger.requiredStreak}</span>
      </td>
      <td className="px-4 py-3 text-sm">
        <StatusBadge status={trigger.statusName} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">
        <span className="font-mono">{trigger.escrowedPayoutFormatted}</span>{" "}
        <span className="text-slate-400">ADI</span>
      </td>
      <td className="px-4 py-3 text-sm">
        <AddressLink address={trigger.beneficiary} />
      </td>
    </tr>
  );
}

export default function FinancePage() {
  const { data: totalTriggers } = useTotalTriggers();
  const triggerCount =
    totalTriggers !== undefined ? Number(totalTriggers) : 0;

  const triggerIds = Array.from({ length: triggerCount }, (_, i) => BigInt(i));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Finance Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor performance-based financing triggers and payouts
          </p>
        </div>
        <Link
          href="/finance/create-trigger"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Trigger
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Active Triggers"
          value={triggerCount > 0 ? triggerCount : "--"}
          icon={Target}
          trend="Includes all statuses"
        />
        <StatCard
          label="Total Triggers"
          value={triggerCount}
          icon={TrendingUp}
        />
      </div>

      {/* Triggers Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">
              All Triggers
            </h2>
          </div>
          <span className="text-sm text-slate-400">
            {triggerCount} total
          </span>
        </div>

        {triggerCount === 0 ? (
          <div className="text-center py-16">
            <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No triggers created yet</p>
            <Link
              href="/finance/create-trigger"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm mt-2"
            >
              Create your first trigger
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    ID
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    Device
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    Threshold
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    Streak
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    Payout
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    Beneficiary
                  </th>
                </tr>
              </thead>
              <tbody>
                {triggerIds.map((id) => (
                  <TriggerRow key={id.toString()} triggerId={id} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
