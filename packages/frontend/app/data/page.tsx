"use client";

import { Zap, Activity, TrendingUp, TrendingDown, Database } from "lucide-react";
import { OutputChart } from "../components/OutputChart";
import { StatCard } from "../components/StatCard";
import { DataTable } from "../components/DataTable";
import { SAMPLE_READINGS, SAMPLE_ASSET, SAMPLE_BATCH, type Reading } from "./sample";

const windowLabel = `${new Date(SAMPLE_BATCH.windowStart * 1000).toUTCString().slice(0, 16)} — ${new Date(SAMPLE_BATCH.windowEnd * 1000).toUTCString().slice(0, 16)} UTC`;

// OutputChart expects kWh; readings are in Wh
const chartData = SAMPLE_READINGS.map((r) => ({ timestamp: r.timestamp, output: r.output / 1000 }));

const activeOutputs = SAMPLE_READINGS.filter((r) => r.uptime && r.output > 0).map((r) => r.output);
const peakKwh = (Math.max(...activeOutputs) / 1000).toFixed(1);
const minKwh = (Math.min(...activeOutputs) / 1000).toFixed(1);

const columns = [
  {
    key: "timestamp",
    header: "Time (UTC)",
    sortable: true,
    render: (r: Reading) =>
      new Date(r.timestamp * 1000).toUTCString().slice(17, 22),
  },
  {
    key: "output",
    header: "Output (kWh)",
    sortable: true,
    render: (r: Reading) => (r.output / 1000).toFixed(3),
  },
  {
    key: "uptime",
    header: "Status",
    render: (r: Reading) => (
      <span className={r.uptime ? "text-green-400" : "text-red-400"}>
        {r.uptime ? "Online" : "Offline"}
      </span>
    ),
  },
];

export default function DataPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-5 h-5 text-zeus-gold" />
          <h2 className="text-xl font-semibold text-zeus-stone-800">Sample Data Explorer</h2>
        </div>
        <p className="zeus-label text-zeus-stone-400">
          {SAMPLE_ASSET.deviceTypeLabel} · {SAMPLE_ASSET.location} · {windowLabel}
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Avg Output" value={`${SAMPLE_BATCH.avgOutput} kWh`} icon={Zap} trend="per reading interval" />
        <StatCard label="Uptime" value={`${SAMPLE_BATCH.uptimePercent.toFixed(1)}%`} icon={Activity} trend={`${SAMPLE_BATCH.uptimeBps} bps`} />
        <StatCard label="Peak Output" value={`${peakKwh} kWh`} icon={TrendingUp} trend="~noon UTC+4" />
        <StatCard label="Min Output" value={`${minKwh} kWh`} icon={TrendingDown} trend="online readings" />
      </div>

      <div className="zeus-card p-6">
        <h3 className="zeus-label mb-4">Generation Over 24h</h3>
        <OutputChart data={chartData} height={280} />
      </div>

      <div className="zeus-card p-6">
        <h3 className="zeus-label mb-4">Raw Readings — {SAMPLE_READINGS.length} samples · Batch #{SAMPLE_BATCH.batchId}</h3>
        <DataTable columns={columns} data={SAMPLE_READINGS} keyField="timestamp" />
      </div>
    </div>
  );
}
