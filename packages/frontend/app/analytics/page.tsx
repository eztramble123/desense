"use client";

import { OutputChart } from "../components/OutputChart";
import { StatCard } from "../components/StatCard";
import { SAMPLE_READINGS, SAMPLE_ASSET, SAMPLE_BATCH, SAMPLE_STATS } from "../data/sample";

const DISPLAY_FONT = { fontFamily: "'Barlow Condensed', sans-serif" };

const chartData = SAMPLE_READINGS.map((r) => ({ timestamp: r.timestamp, output: r.output / 1000 }));
const activeOutputs = SAMPLE_READINGS.filter((r) => r.uptime && r.output > 0).map((r) => r.output);

export default function AnalyticsPage() {
  return (
    <div className="p-10 max-w-5xl space-y-8">

      <div>
        <p className="label mb-2">Overview</p>
        <h1 className="text-5xl font-black uppercase tracking-tight leading-none" style={DISPLAY_FONT}>
          Analytics
        </h1>
      </div>

      {/* Network stats */}
      <div className="panel p-8 grid grid-cols-4 gap-8">
        <StatCard label="Total Assets" value={SAMPLE_STATS.totalAssets} sub={`${SAMPLE_STATS.activeAssets} active`} />
        <StatCard label="Total Batches" value={SAMPLE_STATS.totalBatches.toLocaleString()} />
        <StatCard label="Total Generation" value={`${(SAMPLE_STATS.totalGenerationKwh / 1000).toFixed(0)} MWh`} />
        <StatCard label="Avg Uptime" value={`${SAMPLE_STATS.avgUptime}%`} sub={`${SAMPLE_STATS.disputedBatches} disputed`} />
      </div>

      {/* Last 24h */}
      <div className="panel p-8 grid grid-cols-3 gap-8">
        <StatCard label="Batches (24h)" value={SAMPLE_STATS.last24h.batchesSubmitted} />
        <StatCard label="Generation (24h)" value={`${(SAMPLE_STATS.last24h.generationKwh / 1000).toFixed(1)} MWh`} />
        <StatCard label="Verifications (24h)" value={SAMPLE_STATS.last24h.verificationsPerformed} />
      </div>

      {/* Chart */}
      <div className="panel p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="label mb-1">Generation Output</p>
            <p className="text-white/40 text-[13px]">{SAMPLE_ASSET.location} · {SAMPLE_ASSET.deviceTypeLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-mono text-white/20">Batch #{SAMPLE_BATCH.batchId}</p>
            <p className="text-[11px] font-mono text-white/20">{SAMPLE_READINGS.length} readings · 30 min intervals</p>
          </div>
        </div>
        <OutputChart data={chartData} height={260} />
      </div>

      {/* Asset breakdown + batch summary side by side */}
      <div className="grid grid-cols-2 gap-6">
        <div className="panel p-6 space-y-4">
          <p className="label">Assets by Type</p>
          {Object.entries(SAMPLE_STATS.assetsByType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-[13px] text-white/60">{type.replace(/([A-Z])/g, " $1").trim()}</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1 rounded-full bg-[#152046] overflow-hidden">
                  <div
                    className="h-full bg-[#2563eb] rounded-full"
                    style={{ width: `${(count / SAMPLE_STATS.totalAssets) * 100}%` }}
                  />
                </div>
                <span className="text-[13px] font-mono text-white/40 w-4 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="panel p-6 space-y-4">
          <p className="label">Latest Batch · #{SAMPLE_BATCH.batchId}</p>
          {[
            ["Avg Output",   `${SAMPLE_BATCH.avgOutput} kWh`],
            ["Uptime",       `${SAMPLE_BATCH.uptimePercent.toFixed(2)}%`],
            ["Uptime BPS",   `${SAMPLE_BATCH.uptimeBps}`],
            ["Block",        `${SAMPLE_BATCH.blockNumber}`],
            ["Disputed",     SAMPLE_BATCH.disputed ? "Yes" : "No"],
            ["Peak Reading", `${(Math.max(...activeOutputs) / 1000).toFixed(2)} kWh`],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[13px] text-white/40">{label}</span>
              <span className="text-[13px] text-white/80 font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
