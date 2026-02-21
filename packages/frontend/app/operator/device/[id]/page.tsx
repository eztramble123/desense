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

function AttestationRow({ batchId }: { batchId: bigint }) {
  const { data: batch } = useBatch(batchId);

  if (!batch) {
    return (
      <tr>
        <td colSpan={6} className="px-4 py-3 text-zeus-stone-400 text-sm">
          Loading attestation #{batchId.toString()}...
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
  const capacityFactor = Number(batch.uptimeBps) / 100;
  const dataRootHex =
    typeof batch.dataRoot === "string" ? batch.dataRoot : batch.dataRoot;
  const dataRootStr = String(dataRootHex);
  const truncatedRoot =
    dataRootStr.length > 16
      ? `${dataRootStr.slice(0, 10)}...${dataRootStr.slice(-6)}`
      : dataRootStr;

  return (
    <tr className="hover:bg-zeus-stone-50 transition-colors">
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-zeus-stone-700 font-mono text-sm">
        #{batchId.toString()}
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-zeus-stone-700 text-sm">
        <div className="flex flex-col">
          <span>{windowStart}</span>
          <span className="text-zeus-stone-400">to {windowEnd}</span>
        </div>
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-zeus-stone-700 text-sm font-medium">
        {Number(batch.avgOutput).toLocaleString()} kWh
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm">
        <span
          className={
            capacityFactor >= 95
              ? "text-emerald-600 font-medium"
              : capacityFactor >= 80
                ? "text-zeus-gold font-medium"
                : "text-red-600 font-medium"
          }
        >
          {capacityFactor.toFixed(1)}%
        </span>
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-zeus-stone-500 font-mono text-xs">
        <span title={dataRootStr}>{truncatedRoot}</span>
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm">
        {batch.ipfsCid ? (
          <a
            href={`https://ipfs.io/ipfs/${batch.ipfsCid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-zeus-gold hover:text-zeus-gold-dark font-mono text-xs"
          >
            {batch.ipfsCid.length > 20
              ? `${batch.ipfsCid.slice(0, 12)}...${batch.ipfsCid.slice(-6)}`
              : batch.ipfsCid}
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-zeus-stone-400">--</span>
        )}
      </td>
    </tr>
  );
}

export default function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <RoleGuard role="operator">
      <AssetDetailContent id={id} />
    </RoleGuard>
  );
}

function AssetDetailContent({ id }: { id: string }) {
  const deviceId = BigInt(id);

  const { data: device, isLoading: deviceLoading } = useDevice(deviceId);
  const { data: sla } = useDeviceSLA(deviceId);
  const { data: batchCount } = useDeviceBatchCount(deviceId);
  const { data: batchIds } = useDeviceBatches(deviceId, 0n, 20n);

  if (deviceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-zeus-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zeus-stone-400">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <p className="zeus-heading text-lg">Asset Not Found</p>
        <p className="text-sm mt-2">Asset #{id} does not exist.</p>
        <Link
          href="/operator"
          className="mt-6 inline-flex items-center gap-2 text-zeus-gold hover:text-zeus-gold-dark text-sm font-medium"
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
      <Link
        href="/operator"
        className="inline-flex items-center gap-2 text-sm text-zeus-stone-500 hover:text-zeus-stone-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Generation Assets
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="zeus-heading text-2xl text-zeus-stone-900">
                {device.deviceTypeName} #{id}
              </h1>
              <StatusBadge status={device.statusName} />
            </div>
            <p className="text-sm text-zeus-stone-500 mt-1">
              {device.location} &middot; {device.region} &middot; Sampling
              every {device.samplingRateSeconds}s
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="zeus-card p-6 flex items-center justify-center">
          <SLAGauge
            value={sla?.avgUptime ?? 0}
            label="Availability"
            size="md"
          />
        </div>
        <div className="zeus-card p-6 flex items-center justify-center">
          <SLAGauge
            value={outputPercent}
            label="Capacity Factor"
            size="md"
          />
        </div>
        <StatCard
          label="Total Attestations"
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

      <div className="zeus-card p-6">
        <h2 className="zeus-heading text-sm text-zeus-stone-800 mb-4">
          Asset Details
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="zeus-label">Asset Type</p>
            <p className="text-zeus-stone-800 font-medium mt-1">
              {device.deviceTypeName}
            </p>
          </div>
          <div>
            <p className="zeus-label">Min Generation</p>
            <p className="text-zeus-stone-800 font-medium mt-1">
              {device.minOutput.toLocaleString()} kWh
            </p>
          </div>
          <div>
            <p className="zeus-label">Rated Capacity</p>
            <p className="text-zeus-stone-800 font-medium mt-1">
              {device.maxOutput.toLocaleString()} kWh
            </p>
          </div>
          <div>
            <p className="zeus-label">Commissioned</p>
            <p className="text-zeus-stone-800 font-medium mt-1">
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

      <div className="zeus-card">
        <div className="px-6 py-4 border-b border-zeus-stone-200">
          <h2 className="zeus-heading text-sm text-zeus-stone-800">
            Generation Attestation History
          </h2>
          <p className="text-xs text-zeus-stone-500 mt-0.5">
            Recent generation data submissions for this asset
          </p>
        </div>
        {batches.length === 0 ? (
          <div className="text-center py-12 text-zeus-stone-400">
            No attestations submitted yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm zeus-table">
              <thead>
                <tr>
                  <th>Attestation ID</th>
                  <th>Time Window</th>
                  <th>Generation</th>
                  <th>Capacity Factor</th>
                  <th>Attestation Hash</th>
                  <th>IPFS Archive</th>
                </tr>
              </thead>
              <tbody>
                {(batches as readonly bigint[]).map((batchId) => (
                  <AttestationRow key={batchId.toString()} batchId={batchId} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
