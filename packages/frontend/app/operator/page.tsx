"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { Sun, Database, Activity, DollarSign, Plus } from "lucide-react";
import { RoleGuard } from "../components/RoleGuard";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import {
  useDevicesByOperator,
  useDevice,
  useTotalBatches,
  useDeviceSLA,
} from "../hooks/useContracts";

function AssetRow({ deviceId }: { deviceId: bigint }) {
  const { data: device } = useDevice(deviceId);
  const { data: sla } = useDeviceSLA(deviceId);

  if (!device) {
    return (
      <tr>
        <td colSpan={6} className="px-4 py-3 text-zeus-stone-400 text-sm">Loading...</td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-zeus-stone-50 transition-colors">
      <td className="px-4 py-3 border-b border-zeus-stone-100">
        <Link href={`/operator/device/${deviceId.toString()}`} className="text-zeus-gold hover:text-zeus-gold-dark font-mono font-medium">
          #{deviceId.toString()}
        </Link>
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100">
        <span className="inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zeus-stone-100 text-zeus-stone-700 border border-zeus-stone-200">
          {device.deviceTypeName}
        </span>
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100"><StatusBadge status={device.statusName} /></td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-zeus-stone-700 text-sm">{device.region}</td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-zeus-stone-500 text-sm">
        {device.registeredAt > 0 ? new Date(device.registeredAt * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "--"}
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-zeus-stone-700 text-sm">{sla ? `${sla.avgUptime.toFixed(1)}%` : "--"}</td>
    </tr>
  );
}

export default function OperatorDashboard() {
  const { address } = useAccount();
  const { data: deviceIds } = useDevicesByOperator(address);
  const { data: totalBatches } = useTotalBatches();

  const ids = (deviceIds ?? []) as bigint[];

  return (
    <RoleGuard role="operator">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="zeus-heading text-2xl text-zeus-stone-900">Generation Assets</h1>
            <p className="text-sm text-zeus-stone-500 mt-1">Manage your energy assets and monitor generation performance</p>
          </div>
          <Link href="/operator/register" className="zeus-btn-primary">
            <Plus className="w-4 h-4" />
            Register Asset
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="My Assets" value={ids.length} icon={Sun} />
          <StatCard label="Total Attestations" value={totalBatches !== undefined ? totalBatches.toString() : "--"} icon={Database} />
          <StatCard label="Avg Capacity Factor" value="--" icon={Activity} />
          <StatCard label="Earnings" value="--" icon={DollarSign} trend="Coming soon" />
        </div>

        <div className="zeus-card">
          <div className="px-6 py-4 border-b border-zeus-stone-200">
            <h2 className="zeus-heading text-sm text-zeus-stone-800">My Generation Assets</h2>
          </div>
          {ids.length === 0 ? (
            <div className="text-center py-12 text-zeus-stone-400">No assets registered yet. Click &apos;Register Asset&apos; to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm zeus-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Region</th>
                    <th>Commissioned</th>
                    <th>Capacity Factor</th>
                  </tr>
                </thead>
                <tbody>
                  {ids.map((id) => (
                    <AssetRow key={id.toString()} deviceId={id} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
