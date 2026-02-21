"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api, type AssetDetail, type Batch } from "../../../lib/api";

const DISPLAY_FONT = { fontFamily: "'Barlow Condensed', sans-serif" };

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="label mb-1">{label}</p>
      <p className={`text-[13px] text-white/70 ${mono ? "font-mono break-all" : ""}`}>{value}</p>
    </div>
  );
}

function BatchCard({ batch, index }: { batch: Batch; index: number }) {
  const fmt = (ts: number) => new Date(ts * 1000).toUTCString().slice(0, 25);
  return (
    <div className="panel p-5 flex items-center gap-8">
      <p className="text-[11px] font-mono text-white/20 w-6 shrink-0">{String(index + 1).padStart(2, "0")}</p>
      <div className="flex-1 grid grid-cols-4 gap-6">
        <Field label="Batch ID"   value={`#${batch.batchId}`} />
        <Field label="Window"     value={`${fmt(batch.windowStart)} → ${fmt(batch.windowEnd)}`} />
        <Field label="Avg Output" value={`${batch.avgOutput} kWh`} mono />
        <Field label="Uptime"     value={`${batch.uptimePercent.toFixed(2)}%`} mono />
      </div>
      <div className={`px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider border shrink-0 ${
        batch.disputed
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      }`}>
        {batch.disputed ? "Disputed" : "Verified"}
      </div>
    </div>
  );
}

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset]     = useState<AssetDetail | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.asset(Number(id)), api.assetBatches(Number(id))])
      .then(([a, b]) => { setAsset(a); setBatches(b.batches); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const fmt = (ts: number) => new Date(ts * 1000).toUTCString().slice(0, 25);

  if (loading) return (
    <div className="p-10 flex items-center justify-center min-h-[60vh]">
      <p className="label animate-pulse">Loading…</p>
    </div>
  );

  if (error || !asset) return (
    <div className="p-10 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <p className="text-white/40 text-[13px] mb-2">Asset not found or backend unavailable</p>
        <p className="font-mono text-[11px] text-red-400/60">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="p-10 max-w-5xl space-y-8">
      <div>
        <p className="label mb-2">Asset</p>
        <h1 className="text-5xl font-black uppercase tracking-tight leading-none" style={DISPLAY_FONT}>
          Device #{asset.id}
        </h1>
      </div>

      <div className="panel p-6 space-y-5">
        <p className="label">Metadata</p>
        <div className="grid grid-cols-4 gap-5">
          <Field label="Type"        value={asset.deviceTypeLabel} />
          <Field label="Status"      value={asset.statusLabel} />
          <Field label="Region"      value={asset.region} />
          <Field label="Location"    value={asset.location} />
          <Field label="Coordinates" value={`${asset.latitude}, ${asset.longitude}`} />
          <Field label="Capacity"    value={`${asset.capacityKw} kW`} />
          <Field label="Registered"  value={fmt(asset.registeredAt)} />
          <Field label="Operator"    value={asset.operator} mono />
        </div>
      </div>

      <div className="panel p-6 space-y-5">
        <p className="label">SLA</p>
        <div className="grid grid-cols-4 gap-5">
          <Field label="Total Batches"       value={`${asset.sla.totalBatches}`} />
          <Field label="Avg Uptime"          value={`${asset.sla.avgUptime.toFixed(2)}%`} />
          <Field label="Avg Output"          value={`${asset.sla.avgOutput} kWh`} />
          <Field label="Freshness Penalties" value={`${asset.sla.freshnessPenalties}`} />
          <Field label="Last Submission"     value={asset.sla.lastSubmission ? fmt(asset.sla.lastSubmission) : "—"} />
        </div>
      </div>

      {asset.latestBatch && (
        <div className="panel p-6 space-y-5">
          <p className="label">Latest Batch #{asset.latestBatch.batchId}</p>
          <div className="grid grid-cols-4 gap-5">
            <Field label="Window Start" value={fmt(asset.latestBatch.windowStart)} />
            <Field label="Window End"   value={fmt(asset.latestBatch.windowEnd)} />
            <Field label="Avg Output"   value={`${asset.latestBatch.avgOutput} kWh`} />
            <Field label="Uptime"       value={`${asset.latestBatch.uptimePercent.toFixed(2)}%`} />
            <Field label="Tx Hash"      value={asset.latestBatch.txHash} mono />
            <Field label="IPFS CID"     value={asset.latestBatch.ipfsCid} mono />
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="label">Batch History</p>
          <p className="text-[11px] font-mono text-white/20">{batches.length} batches</p>
        </div>
        {batches.length === 0 ? (
          <div className="panel p-10 text-center">
            <p className="text-white/20 text-[13px]">No batches yet</p>
          </div>
        ) : (
          batches.map((b, i) => <BatchCard key={b.batchId} batch={b} index={i} />)
        )}
      </div>
    </div>
  );
}
