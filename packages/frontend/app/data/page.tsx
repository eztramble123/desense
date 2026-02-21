"use client";

import { OutputChart } from "../components/OutputChart";
import { StatCard } from "../components/StatCard";
import { DataTable } from "../components/DataTable";
import { SAMPLE_READINGS, SAMPLE_ASSET, SAMPLE_BATCH, type Reading } from "./sample";

const activeOutputs = SAMPLE_READINGS.filter((r) => r.uptime && r.output > 0).map((r) => r.output);
const chartData = SAMPLE_READINGS.map((r) => ({ timestamp: r.timestamp, output: r.output / 1000 }));

const fmt = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

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
    <div className="p-10 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Sample Data Explorer</h1>
          <p className="text-[13px] text-[#4b4b58] mt-1">
            {SAMPLE_ASSET.deviceTypeLabel} · {SAMPLE_ASSET.location}
          </p>
        </div>
        <div className="px-3 py-1.5 bg-[#111115] border border-[#1f1f27] rounded-lg text-[13px] text-[#4b4b58]">
          {fmt(SAMPLE_BATCH.windowStart)} — {fmt(SAMPLE_BATCH.windowEnd)}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-start gap-10 pb-10 border-b border-[#1f1f27]">
        <StatCard label="Avg Output" value={`${SAMPLE_BATCH.avgOutput} kWh`} />
        <div className="w-px h-10 bg-[#1f1f27] self-center" />
        <StatCard
          label="Uptime"
          value={`${SAMPLE_BATCH.uptimePercent.toFixed(1)}%`}
          sub={`${SAMPLE_BATCH.uptimeBps} bps`}
        />
        <div className="w-px h-10 bg-[#1f1f27] self-center" />
        <StatCard
          label="Peak Output"
          value={`${(Math.max(...activeOutputs) / 1000).toFixed(1)} kWh`}
          sub="~noon UTC+4"
        />
        <div className="w-px h-10 bg-[#1f1f27] self-center" />
        <StatCard label="Total Batches" value={SAMPLE_ASSET.sla.totalBatches} sub="on-chain" />
      </div>

      {/* Chart */}
      <div className="py-10 border-b border-[#1f1f27]">
        <OutputChart data={chartData} height={260} />
      </div>

      {/* Table */}
      <div className="pt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[13px] font-medium">Raw Readings</h2>
          <span className="text-[11px] text-[#4b4b58]">
            {SAMPLE_READINGS.length} samples · Batch #{SAMPLE_BATCH.batchId}
          </span>
        </div>
        <DataTable columns={columns} data={SAMPLE_READINGS} keyField="timestamp" />
      </div>

    </div>
  );
}
