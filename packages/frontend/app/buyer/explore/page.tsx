"use client";

import Link from "next/link";
import { ArrowLeft, Cpu, Radio } from "lucide-react";
import { RoleGuard } from "../../components/RoleGuard";
import { StatusBadge } from "../../components/StatusBadge";
import { AddressLink } from "../../components/TxLink";
import {
  useTotalDevices,
  useDevice,
  useDeviceSLA,
} from "../../hooks/useContracts";

function DeviceRow({ deviceId }: { deviceId: bigint }) {
  const { data: device } = useDevice(deviceId);
  const { data: sla } = useDeviceSLA(deviceId);

  if (!device) {
    return (
      <tr className="border-b border-slate-100">
        <td colSpan={7} className="px-4 py-3 text-slate-400 text-sm">
          Loading device #{deviceId.toString()}...
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-slate-900">
        #{deviceId.toString()}
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">
        {device.deviceTypeName}
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">
        {device.region || "--"}
      </td>
      <td className="px-4 py-3 text-sm">
        <AddressLink address={device.operator} />
      </td>
      <td className="px-4 py-3 text-sm">
        <StatusBadge status={device.statusName} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">
        {sla ? `${sla.avgUptime.toFixed(1)}%` : "--"}
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">
        {sla ? sla.avgOutput.toFixed(0) : "--"}
      </td>
    </tr>
  );
}

export default function ExplorePage() {
  const { data: totalDevices } = useTotalDevices();
  const deviceCount =
    totalDevices !== undefined ? Number(totalDevices) : 0;

  const deviceIds = Array.from({ length: deviceCount }, (_, i) => BigInt(i));

  return (
    <RoleGuard role="buyer">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/buyer"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Explore Devices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse all registered devices and their SLA performance
          </p>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Radio className="w-4 h-4" />
          <span>
            <span className="font-medium text-slate-700">{deviceCount}</span>{" "}
            devices registered on-chain
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200">
          {deviceCount === 0 ? (
            <div className="text-center py-16">
              <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                No devices registered yet
              </p>
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
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">
                      Region
                    </th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">
                      Operator
                    </th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">
                      Avg Uptime
                    </th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">
                      Avg Output
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deviceIds.map((id) => (
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
