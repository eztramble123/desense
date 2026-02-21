"use client";

import { SAMPLE_READINGS, SAMPLE_ASSET, SAMPLE_BATCH, type Reading } from "./sample";

const DISPLAY_FONT = { fontFamily: "'Barlow Condensed', sans-serif" };

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="label mb-1">{label}</p>
      <p className={`text-[13px] text-white/70 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function ReadingCard({ reading, index }: { reading: Reading; index: number }) {
  const time = new Date(reading.timestamp * 1000).toUTCString().slice(0, 25);
  const kwh = (reading.output / 1000).toFixed(3);

  return (
    <div className="panel p-5 flex items-center gap-8">
      <p className="text-[11px] font-mono text-white/20 w-6 shrink-0">{String(index + 1).padStart(2, "0")}</p>

      <div className="flex-1 grid grid-cols-3 gap-6">
        <Field label="Timestamp" value={`${reading.timestamp}`} mono />
        <Field label="UTC Time" value={time} />
        <Field label="Output" value={`${kwh} kWh (${reading.output.toLocaleString()} Wh)`} mono />
      </div>

      <div className={`px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider border shrink-0 ${
        reading.uptime
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-red-500/10 text-red-400 border-red-500/20"
      }`}>
        {reading.uptime ? "Online" : "Offline"}
      </div>
    </div>
  );
}

export default function DataPage() {
  const fmt = (ts: number) => new Date(ts * 1000).toUTCString().slice(0, 25);

  return (
    <div className="p-10 max-w-5xl space-y-8">

      <div>
        <p className="label mb-2">Sample Data</p>
        <h1 className="text-5xl font-black uppercase tracking-tight leading-none" style={DISPLAY_FONT}>
          Sample Dataset
        </h1>
      </div>

      <div className="panel p-6 space-y-5">
        <p className="label">Asset</p>
        <div className="grid grid-cols-4 gap-5">
          <Field label="ID" value={`#${SAMPLE_ASSET.id}`} />
          <Field label="Type" value={SAMPLE_ASSET.deviceTypeLabel} />
          <Field label="Status" value={SAMPLE_ASSET.statusLabel} />
          <Field label="Region" value={SAMPLE_ASSET.region} />
          <Field label="Location" value={SAMPLE_ASSET.location} />
          <Field label="Coordinates" value={`${SAMPLE_ASSET.latitude}, ${SAMPLE_ASSET.longitude}`} />
          <Field label="Capacity" value={`${SAMPLE_ASSET.capacityKw} kW`} />
          <Field label="Capacity Factor" value={`${SAMPLE_ASSET.capacityFactor}%`} />
          <Field label="Total Generation" value={`${SAMPLE_ASSET.totalGenerationKwh.toLocaleString()} kWh`} />
          <Field label="Registered" value={fmt(SAMPLE_ASSET.registeredAt)} />
          <Field label="Operator" value={SAMPLE_ASSET.operator} mono />
          <Field label="Device Type Enum" value={`${SAMPLE_ASSET.deviceType}`} />
        </div>
      </div>

      <div className="panel p-6 space-y-5">
        <p className="label">SLA</p>
        <div className="grid grid-cols-4 gap-5">
          <Field label="Total Batches" value={`${SAMPLE_ASSET.sla.totalBatches}`} />
          <Field label="Avg Uptime" value={`${SAMPLE_ASSET.sla.avgUptime.toFixed(2)}%`} />
          <Field label="Avg Output" value={`${(SAMPLE_ASSET.sla.avgOutput / 1000).toFixed(3)} kWh (${SAMPLE_ASSET.sla.avgOutput.toLocaleString()} Wh)`} />
          <Field label="Freshness Penalties" value={`${SAMPLE_ASSET.sla.freshnessPenalties}`} />
          <Field label="Last Submission" value={fmt(SAMPLE_ASSET.sla.lastSubmission)} />
        </div>
      </div>

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
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="label">Readings</p>
          <p className="text-[11px] font-mono text-white/20">{SAMPLE_READINGS.length} entries · 1800s interval</p>
        </div>
        {SAMPLE_READINGS.map((r, i) => (
          <ReadingCard key={r.timestamp} reading={r} index={i} />
        ))}
      </div>

    </div>
  );
}
