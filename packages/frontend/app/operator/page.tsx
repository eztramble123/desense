"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { Cpu, Database, Activity, DollarSign, Plus } from "lucide-react";
import { RoleGuard } from "../components/RoleGuard";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import {
  useDevicesByOperator,
  useDevice,
  useTotalBatches,
  useDeviceSLA,
} from "../hooks/useContracts";

function DeviceRow({ deviceId }: { deviceId: bigint }) {
  const { data: device } = useDevice(deviceId);
  const { data: sla } = useDeviceSLA(deviceId);

  if (!device) {
    return (
      <tr className="border-b border-slate-100">
        <td colSpan={5} className="px-4 py-3 text-slate-400 text-sm">Loading...</td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/operator/device/${deviceId.toString()}`} className="text-blue-600 hover:text-blue-700 font-mono font-medium">
          #{deviceId.toString()}
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          {device.deviceTypeName}
        </span>
      </td>
      <td className="px-4 py-3"><StatusBadge status={device.statusName} /></td>
      <td className="px-4 py-3 text-slate-700">{device.region}</td>
      <td className="px-4 py-3 text-slate-500 text-sm">
        {device.registeredAt > 0 ? new Date(device.registeredAt * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "--"}
      </td>
      <td className="px-4 py-3 text-slate-700">{sla ? `${sla.avgUptime.toFixed(1)}%` : "--"}</td>
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
            <h1 className="text-2xl font-bold text-slate-900">Operator Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your devices and monitor performance</p>
          </div>
          <Link href="/operator/register" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Register Device
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="My Devices" value={ids.length} icon={Cpu} />
          <StatCard label="Total Batches" value={totalBatches !== undefined ? totalBatches.toString() : "--"} icon={Database} />
          <StatCard label="Avg SLA Uptime" value="--" icon={Activity} />
          <StatCard label="Earnings" value="--" icon={DollarSign} trend="Coming soon" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">My Devices</h2>
          </div>
          {ids.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No devices registered yet. Click &apos;Register Device&apos; to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">ID</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Type</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Region</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Registered</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Uptime</th>
                  </tr>
                </thead>
                <tbody>
                  {ids.map((id) => (
                    <DeviceRow key={id.toString()} deviceId={id} />
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
