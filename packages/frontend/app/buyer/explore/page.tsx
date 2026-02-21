"use client";

import Link from "next/link";
import { ArrowLeft, Sun, Zap } from "lucide-react";
import { RoleGuard } from "../../components/RoleGuard";
import { StatusBadge } from "../../components/StatusBadge";
import { AddressLink } from "../../components/TxLink";
import {
  useTotalDevices,
  useDevice,
  useDeviceSLA,
} from "../../hooks/useContracts";

function AssetRow({ deviceId }: { deviceId: bigint }) {
  const { data: device } = useDevice(deviceId);
  const { data: sla } = useDeviceSLA(deviceId);

  if (!device) {
    return (
      <tr>
        <td colSpan={7} className="px-4 py-3 text-zeus-stone-400 text-sm">
          Loading asset #{deviceId.toString()}...
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-zeus-stone-50 transition-colors">
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm font-medium text-zeus-stone-800">
        #{deviceId.toString()}
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm text-zeus-stone-700">
        {device.deviceTypeName}
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm text-zeus-stone-700">
        {device.region || "--"}
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm">
        <AddressLink address={device.operator} />
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm">
        <StatusBadge status={device.statusName} />
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm text-zeus-stone-700">
        {sla ? `${sla.avgUptime.toFixed(1)}%` : "--"}
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm text-zeus-stone-700">
        {sla ? `${sla.avgOutput.toFixed(0)} kWh` : "--"}
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
        <div>
          <Link
            href="/buyer"
            className="inline-flex items-center gap-1.5 text-sm text-zeus-stone-500 hover:text-zeus-stone-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Subscriptions
          </Link>
          <h1 className="zeus-heading text-2xl text-zeus-stone-900">
            Explore Assets
          </h1>
          <p className="text-sm text-zeus-stone-500 mt-1">
            Browse all verified energy generation assets and their performance
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-zeus-stone-500">
          <Zap className="w-4 h-4 text-zeus-gold" />
          <span>
            <span className="font-medium text-zeus-stone-700">{deviceCount}</span>{" "}
            generation assets verified on-chain
          </span>
        </div>

        <div className="zeus-card">
          {deviceCount === 0 ? (
            <div className="text-center py-16">
              <Sun className="w-10 h-10 text-zeus-stone-300 mx-auto mb-3" />
              <p className="text-zeus-stone-400 text-sm">
                No generation assets registered yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm zeus-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Region</th>
                    <th>Operator</th>
                    <th>Status</th>
                    <th>Avg Capacity Factor</th>
                    <th>Avg Generation</th>
                  </tr>
                </thead>
                <tbody>
                  {deviceIds.map((id) => (
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
