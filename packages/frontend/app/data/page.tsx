"use client";

import { ArrowUpRight } from "lucide-react";
import { OutputChart } from "../components/OutputChart";
import { StatCard } from "../components/StatCard";
import { DataTable } from "../components/DataTable";
import { SAMPLE_READINGS, SAMPLE_ASSET, SAMPLE_BATCH, type Reading } from "./sample";

const activeOutputs = SAMPLE_READINGS.filter((r) => r.uptime && r.output > 0).map((r) => r.output);
const chartData = SAMPLE_READINGS.map((r) => ({ timestamp: r.timestamp, output: r.output / 1000 }));

const fmt = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const columns = [
  {
    key: "timestamp",
    header: "Time (UTC)",
    sortable: true,
    render: (r: Reading) => (
      <span className="font-mono text-[13px]">{new Date(r.timestamp * 1000).toUTCString().slice(17, 22)}</span>
    ),
  },
  {
    key: "output",
    header: "Output",
    sortable: true,
    render: (r: Reading) => `${(r.output / 1000).toFixed(3)} kWh`,
  },
  {
    key: "uptime",
    header: "Status",
    render: (r: Reading) => (
      <span className={r.uptime ? "text-emerald-400" : "text-red-400"}>
        {r.uptime ? "Online" : "Offline"}
      </span>
    ),
  },
];

export default function DataPage() {
  return (
    <div className="p-10 max-w-5xl space-y-6">

      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="label mb-2">Sample Dataset</p>
          <h1
            className="text-5xl font-black uppercase tracking-tight leading-none text-white"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {SAMPLE_ASSET.deviceTypeLabel}
          </h1>
          <p className="text-[13px] mt-2" style={{ color: "rgba(255,255,255,0.45)" }}>
            {SAMPLE_ASSET.location} · {SAMPLE_ASSET.region}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border text-[13px] font-medium"
          style={{ background: "#0a1530", borderColor: "#152046", color: "rgba(255,255,255,0.45)" }}>
          {fmt(SAMPLE_BATCH.windowStart)} — {fmt(SAMPLE_BATCH.windowEnd)}
        </div>
      </div>

      {/* Stat cards panel */}
      <div className="panel p-8 grid grid-cols-4 gap-8">
        <StatCard label="Avg Output" value={`${SAMPLE_BATCH.avgOutput} kWh`} />
        <StatCard
          label="Uptime"
          value={`${SAMPLE_BATCH.uptimePercent.toFixed(1)}%`}
          sub={`${SAMPLE_BATCH.uptimeBps} bps`}
        />
        <StatCard
          label="Peak Output"
          value={`${(Math.max(...activeOutputs) / 1000).toFixed(1)} kWh`}
          sub="~noon UTC+4"
        />
        <StatCard label="Total Batches" value={SAMPLE_ASSET.sla.totalBatches} sub="on-chain" />
      </div>

      {/* Chart panel */}
      <div className="panel p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="label">Generation Output · 24h</p>
          <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
            Batch #{SAMPLE_BATCH.batchId} · {SAMPLE_READINGS.length} readings
          </span>
        </div>
        <OutputChart data={chartData} height={240} />
      </div>

      {/* Batch metadata panel */}
      <div className="panel p-8 grid grid-cols-3 gap-6 text-[13px]">
        <div>
          <p className="label mb-1.5">Data Root</p>
          <p className="font-mono text-[12px] break-all" style={{ color: "rgba(255,255,255,0.5)" }}>
            {SAMPLE_BATCH.dataRoot.slice(0, 20)}…
          </p>
        </div>
        <div>
          <p className="label mb-1.5">IPFS CID</p>
          <p className="font-mono text-[12px] break-all" style={{ color: "rgba(255,255,255,0.5)" }}>
            {SAMPLE_BATCH.ipfsCid.slice(0, 20)}…
          </p>
        </div>
        <div>
          <p className="label mb-1.5">Tx Hash</p>
          <a
            href={`https://explorer.ab.testnet.adifoundation.ai/tx/${SAMPLE_BATCH.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[12px] text-[#2563eb] hover:text-[#60a5fa] transition-colors"
          >
            {SAMPLE_BATCH.txHash.slice(0, 20)}… <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Raw readings table */}
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-[#152046]">
          <p
            className="text-lg font-black uppercase tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Raw Readings
          </p>
          <span className="label">{SAMPLE_READINGS.length} samples · 30 min intervals</span>
        </div>
        <div className="px-4">
          <DataTable columns={columns} data={SAMPLE_READINGS} keyField="timestamp" />
        </div>
      </div>

    </div>
  );
}
