"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Database, AlertTriangle, ExternalLink } from "lucide-react";
import { RoleGuard } from "../../../components/RoleGuard";
import { StatCard } from "../../../components/StatCard";
import { StatusBadge } from "../../../components/StatusBadge";
import { SLAGauge } from "../../../components/SLAGauge";
import {
  useDevice,
  useDeviceSLA,
  useDeviceBatches,
  useDeviceBatchCount,
  useBatch,
} from "../../../hooks/useContracts";

// Separate component for each batch row so each can call useBatch
function BatchRow({ batchId }: { batchId: bigint }) {
  const { data: batch } = useBatch(batchId);

  if (!batch) {
    return (
      <tr className="border-b border-slate-100">
        <td colSpan={6} className="px-4 py-3 text-slate-400 text-sm">
          Loading batch #{batchId.toString()}...
        </td>
      </tr>
    );
  }

  const windowStart = new Date(
    Number(batch.windowStart) * 1000
  ).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const windowEnd = new Date(Number(batch.windowEnd) * 1000).toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
  const uptimePercent = Number(batch.uptimeBps) / 100;
  const dataRootHex =
    typeof batch.dataRoot === "string" ? batch.dataRoot : batch.dataRoot;
  const dataRootStr = String(dataRootHex);
  const truncatedRoot =
    dataRootStr.length > 16
      ? `${dataRootStr.slice(0, 10)}...${dataRootStr.slice(-6)}`
      : dataRootStr;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 text-slate-700 font-mono text-sm">
        #{batchId.toString()}
      </td>
      <td className="px-4 py-3 text-slate-700 text-sm">
        <div className="flex flex-col">
          <span>{windowStart}</span>
          <span className="text-slate-400">to {windowEnd}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-700 text-sm font-medium">
        {Number(batch.avgOutput).toLocaleString()}
      </td>
      <td className="px-4 py-3 text-sm">
        <span
          className={
            uptimePercent >= 95
              ? "text-green-600 font-medium"
              : uptimePercent >= 80
                ? "text-blue-600 font-medium"
                : "text-red-600 font-medium"
          }
        >
          {uptimePercent.toFixed(1)}%
        </span>
      </td>
      <td className="px-4 py-3 text-slate-500 font-mono text-xs">
        <span title={dataRootStr}>{truncatedRoot}</span>
      </td>
      <td className="px-4 py-3 text-sm">
        {batch.ipfsCid ? (
          <a
            href={`https://ipfs.io/ipfs/${batch.ipfsCid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-mono text-xs"
          >
            {batch.ipfsCid.length > 20
              ? `${batch.ipfsCid.slice(0, 12)}...${batch.ipfsCid.slice(-6)}`
              : batch.ipfsCid}
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-slate-400">--</span>
        )}
      </td>
    </tr>
  );
}

export default function DeviceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <RoleGuard role="operator">
      <DeviceDetailContent id={id} />
    </RoleGuard>
  );
}

function DeviceDetailContent({ id }: { id: string }) {
  const deviceId = BigInt(id);

  const { data: device, isLoading: deviceLoading } = useDevice(deviceId);
  const { data: sla } = useDeviceSLA(deviceId);
  const { data: batchCount } = useDeviceBatchCount(deviceId);
  const { data: batchIds } = useDeviceBatches(deviceId, 0n, 20n);

  if (deviceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">Device Not Found</p>
        <p className="text-sm mt-2">Device #{id} does not exist.</p>
        <Link
          href="/operator"
          className="mt-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const outputPercent =
    device.maxOutput > 0 && sla
      ? Math.min((sla.avgOutput / device.maxOutput) * 100, 100)
      : 0;

  const batches = batchIds ?? [];

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href="/operator"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Operator Dashboard
      </Link>

      {/* Device Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {device.deviceTypeName} #{id}
              </h1>
              <StatusBadge status={device.statusName} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {device.location} &middot; {device.region} &middot; Sampling
              every {device.samplingRateSeconds}s
            </p>
          </div>
        </div>
      </div>

      {/* SLA Gauges + Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-center">
          <SLAGauge
            value={sla?.avgUptime ?? 0}
            label="Avg Uptime"
            size="md"
          />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-center">
          <SLAGauge
            value={outputPercent}
            label="Output (% of Max)"
            size="md"
          />
        </div>
        <StatCard
          label="Total Batches"
          value={
            batchCount !== undefined ? batchCount.toString() : sla?.totalBatches?.toString() ?? "--"
          }
          icon={Database}
        />
        <StatCard
          label="Freshness Penalties"
          value={sla?.freshnessPenalties?.toString() ?? "--"}
          icon={AlertTriangle}
        />
      </div>

      {/* Device Metadata */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Device Details
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="text-slate-500">Device Type</p>
            <p className="text-slate-900 font-medium mt-1">
              {device.deviceTypeName}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Min Output</p>
            <p className="text-slate-900 font-medium mt-1">
              {device.minOutput.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Max Output</p>
            <p className="text-slate-900 font-medium mt-1">
              {device.maxOutput.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Registered</p>
            <p className="text-slate-900 font-medium mt-1">
              {device.registeredAt > 0
                ? new Date(device.registeredAt * 1000).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  )
                : "--"}
            </p>
          </div>
        </div>
      </div>

      {/* Batch History */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Batch History
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Recent data submissions for this device
          </p>
        </div>
        {batches.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            No batches submitted yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    Batch ID
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    Time Window
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    Avg Output
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    Uptime %
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    Data Root
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    IPFS CID
                  </th>
                </tr>
              </thead>
              <tbody>
                {(batches as readonly bigint[]).map((batchId) => (
                  <BatchRow key={batchId.toString()} batchId={batchId} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
