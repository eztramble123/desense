"use client";

import { Zap, Activity, TrendingUp, TrendingDown, Database } from "lucide-react";
import { OutputChart } from "../components/OutputChart";
import { StatCard } from "../components/StatCard";
import { DataTable } from "../components/DataTable";
import { SAMPLE_READINGS, SAMPLE_META } from "./sample";

const windowLabel = `${new Date(SAMPLE_META.windowStart * 1000).toUTCString().slice(0, 16)} — ${new Date(SAMPLE_META.windowEnd * 1000).toUTCString().slice(0, 16)} UTC`;

const columns = [
  {
    key: "timestamp",
    header: "Time",
    sortable: true,
    render: (r: (typeof SAMPLE_READINGS)[0]) =>
      new Date(r.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
  {
    key: "output",
    header: "Output (kWh)",
    sortable: true,
    render: (r: (typeof SAMPLE_READINGS)[0]) => r.output.toFixed(2),
  },
  {
    key: "uptime",
    header: "Status",
    render: (r: (typeof SAMPLE_READINGS)[0]) => (
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
          {SAMPLE_META.deviceType} · {SAMPLE_META.deviceId} · {windowLabel}
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Avg Output" value={`${SAMPLE_META.avgOutput} kWh`} icon={Zap} trend="24h window" />
        <StatCard label="Uptime" value={`${(SAMPLE_META.uptimeBps / 100).toFixed(1)}%`} icon={Activity} trend={`${SAMPLE_META.uptimeBps} bps`} />
        <StatCard label="Peak Output" value={`${SAMPLE_META.peakOutput} kWh`} icon={TrendingUp} trend="~noon UTC+4" />
        <StatCard label="Min Output" value={`${SAMPLE_META.minOutput} kWh`} icon={TrendingDown} trend="online readings" />
      </div>

      <div className="zeus-card p-6">
        <h3 className="zeus-label mb-4">Generation Over 24h</h3>
        <OutputChart data={SAMPLE_READINGS} height={280} />
      </div>

      <div className="zeus-card p-6">
        <h3 className="zeus-label mb-4">Raw Readings — 48 samples (30 min intervals)</h3>
        <DataTable columns={columns} data={SAMPLE_READINGS} keyField="timestamp" />
      </div>
    </div>
  );
}
