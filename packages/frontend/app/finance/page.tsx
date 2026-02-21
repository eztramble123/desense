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
      <tr>
        <td colSpan={8} className="px-4 py-3 text-zeus-stone-400 text-sm">
          Loading trigger #{triggerId.toString()}...
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-zeus-stone-50 transition-colors">
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm font-medium text-zeus-stone-800">
        #{triggerId.toString()}
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm text-zeus-stone-700">
        #{trigger.deviceId}
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm text-zeus-stone-700">
        {trigger.triggerTypeName}
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm text-zeus-stone-700 font-mono">
        {trigger.threshold}
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm text-zeus-stone-700">
        <span className="font-medium">{trigger.currentStreak}</span>
        <span className="text-zeus-stone-400"> / {trigger.requiredStreak}</span>
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm">
        <StatusBadge status={trigger.statusName} />
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm text-zeus-stone-700">
        <span className="font-mono">{trigger.escrowedPayoutFormatted}</span>{" "}
        <span className="text-zeus-stone-400">ADI</span>
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="zeus-heading text-2xl text-zeus-stone-900">
            Performance Triggers
          </h1>
          <p className="text-sm text-zeus-stone-500 mt-1">
            Monitor performance-based incentive triggers and payouts
          </p>
        </div>
        <Link href="/finance/create-trigger" className="zeus-btn-primary">
          <Plus className="w-4 h-4" />
          Create Trigger
        </Link>
      </div>

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

      <div className="zeus-card">
        <div className="px-6 py-4 border-b border-zeus-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-zeus-gold" />
            <h2 className="zeus-heading text-sm text-zeus-stone-800">
              All Triggers
            </h2>
          </div>
          <span className="zeus-label">
            {triggerCount} total
          </span>
        </div>

        {triggerCount === 0 ? (
          <div className="text-center py-16">
            <Target className="w-10 h-10 text-zeus-stone-300 mx-auto mb-3" />
            <p className="text-zeus-stone-400 text-sm">No triggers created yet</p>
            <Link
              href="/finance/create-trigger"
              className="inline-flex items-center gap-1 text-zeus-gold hover:text-zeus-gold-dark text-sm mt-2"
            >
              Create your first trigger
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm zeus-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Threshold</th>
                  <th>Streak</th>
                  <th>Status</th>
                  <th>Payout</th>
                  <th>Beneficiary</th>
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
