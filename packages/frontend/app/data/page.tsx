"use client";

import { useState, useEffect } from "react";
import { api, type AssetDetail, type Batch } from "../../lib/api";

const DISPLAY_FONT = { fontFamily: "'Barlow Condensed', sans-serif" };

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="label mb-1">{label}</p>
      <p className={`text-[13px] text-white/70 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function BatchCard({ batch, index }: { batch: Batch; index: number }) {
  const fmt = (ts: number) => new Date(ts * 1000).toUTCString().slice(0, 25);
  return (
    <div className="panel p-5 flex items-center gap-8">
      <p className="text-[11px] font-mono text-white/20 w-6 shrink-0">{String(index + 1).padStart(2, "0")}</p>
<<<<<<< Updated upstream:packages/frontend/app/data/page.tsx

      <div className="flex-1 grid grid-cols-3 gap-6">
        <Field label="Timestamp" value={`${reading.timestamp}`} mono />
        <Field label="UTC Time" value={time} />
        <Field label="Output" value={`${kwh} kWh (${reading.output.toLocaleString()} Wh)`} mono />
=======
      <div className="flex-1 grid grid-cols-4 gap-6">
        <Field label="Batch ID"  value={`#${batch.batchId}`} />
        <Field label="Window"    value={`${fmt(batch.windowStart)} → ${fmt(batch.windowEnd)}`} />
        <Field label="Avg Output" value={`${batch.avgOutput} kWh`} mono />
        <Field label="Uptime"    value={`${batch.uptimePercent.toFixed(2)}%`} mono />
>>>>>>> Stashed changes:packages/frontend/app/(app)/data/page.tsx
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

export default function DataPage() {
  const [asset, setAsset]   = useState<AssetDetail | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.asset(0), api.assetBatches(0)])
      .then(([a, b]) => { setAsset(a); setBatches(b.batches); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (ts: number) => new Date(ts * 1000).toUTCString().slice(0, 25);

  if (loading) return (
    <div className="p-10 flex items-center justify-center min-h-[60vh]">
      <p className="label animate-pulse">Loading chain data…</p>
    </div>
  );

  if (error || !asset) return (
    <div className="p-10 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <p className="text-white/40 text-[13px] mb-2">Could not reach backend</p>
        <p className="font-mono text-[11px] text-red-400/60">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="p-10 max-w-5xl space-y-8">

      <div>
        <p className="label mb-2">Live Data</p>
        <h1 className="text-5xl font-black uppercase tracking-tight leading-none" style={DISPLAY_FONT}>
          Asset #{asset.id}
        </h1>
      </div>

      {/* Asset */}
      <div className="panel p-6 space-y-5">
        <p className="label">Asset</p>
        <div className="grid grid-cols-4 gap-5">
          <Field label="ID"         value={`#${asset.id}`} />
          <Field label="Type"       value={asset.deviceTypeLabel} />
          <Field label="Status"     value={asset.statusLabel} />
          <Field label="Region"     value={asset.region} />
          <Field label="Location"   value={asset.location} />
          <Field label="Coordinates" value={`${asset.latitude}, ${asset.longitude}`} />
          <Field label="Capacity"   value={`${asset.capacityKw} kW`} />
          <Field label="Registered" value={fmt(asset.registeredAt)} />
          <Field label="Operator"   value={asset.operator} mono />
        </div>
      </div>

      {/* SLA */}
      <div className="panel p-6 space-y-5">
        <p className="label">SLA</p>
        <div className="grid grid-cols-4 gap-5">
          <Field label="Total Batches"       value={`${asset.sla.totalBatches}`} />
          <Field label="Avg Uptime"          value={`${asset.sla.avgUptime.toFixed(2)}%`} />
          <Field label="Avg Output"          value={`${asset.sla.avgOutput} kWh`} />
          <Field label="Freshness Penalties" value={`${asset.sla.freshnessPenalties}`} />
          <Field label="Last Submission"     value={fmt(asset.sla.lastSubmission)} />
        </div>
      </div>

<<<<<<< Updated upstream:packages/frontend/app/data/page.tsx
      {/* Batch */}
      <div className="panel p-6 space-y-5">
        <p className="label">Batch #{SAMPLE_BATCH.batchId}</p>
        <div className="grid grid-cols-4 gap-5">
          <Field label="Window Start" value={fmt(SAMPLE_BATCH.windowStart)} />
          <Field label="Window End" value={fmt(SAMPLE_BATCH.windowEnd)} />
          <Field label="Avg Output" value={`${SAMPLE_BATCH.avgOutput} kWh`} />
          <Field label="Uptime" value={`${SAMPLE_BATCH.uptimePercent.toFixed(2)}% (${SAMPLE_BATCH.uptimeBps} bps)`} />
          <Field label="Block" value={`${SAMPLE_BATCH.blockNumber}`} />
          <Field label="Disputed" value={SAMPLE_BATCH.disputed ? "Yes" : "No"} />
          <Field label="Submitter" value={SAMPLE_BATCH.submitter} mono />
          <Field label="Submitted" value={fmt(SAMPLE_BATCH.submittedAt)} />
          <Field label="Tx Hash" value={SAMPLE_BATCH.txHash} mono />
          <Field label="Data Root" value={SAMPLE_BATCH.dataRoot} mono />
          <Field label="IPFS CID" value={SAMPLE_BATCH.ipfsCid} mono />
=======
      {asset.latestBatch && (
        <div className="panel p-6 space-y-5">
          <p className="label">Latest Batch #{asset.latestBatch.batchId}</p>
          <div className="grid grid-cols-4 gap-5">
            <Field label="Window Start"  value={fmt(asset.latestBatch.windowStart)} />
            <Field label="Window End"    value={fmt(asset.latestBatch.windowEnd)} />
            <Field label="Avg Output"    value={`${asset.latestBatch.avgOutput} kWh`} />
            <Field label="Uptime"        value={`${asset.latestBatch.uptimePercent.toFixed(2)}% (${asset.latestBatch.uptimeBps} bps)`} />
            <Field label="Block"         value={`${asset.latestBatch.blockNumber}`} />
            <Field label="Disputed"      value={asset.latestBatch.disputed ? "Yes" : "No"} />
            <Field label="Submitter"     value={asset.latestBatch.submitter} mono />
            <Field label="Submitted"     value={fmt(asset.latestBatch.submittedAt)} />
            <Field label="Tx Hash"       value={asset.latestBatch.txHash} mono />
            <Field label="Data Root"     value={asset.latestBatch.dataRoot} mono />
            <Field label="IPFS CID"      value={asset.latestBatch.ipfsCid} mono />
          </div>
>>>>>>> Stashed changes:packages/frontend/app/(app)/data/page.tsx
        </div>
      )}

      {/* Individual readings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="label">Batch History</p>
          <p className="text-[11px] font-mono text-white/20">{batches.length} batches</p>
        </div>
        {batches.length === 0 ? (
          <div className="panel p-10 text-center">
            <p className="text-white/20 text-[13px]">No batches submitted yet</p>
          </div>
        ) : (
          batches.map((b, i) => <BatchCard key={b.batchId} batch={b} index={i} />)
        )}
      </div>

    </div>
  );
}
