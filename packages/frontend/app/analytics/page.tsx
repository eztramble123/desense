"use client";

import { useState } from "react";
import clsx from "clsx";
import { OutputChart } from "../components/OutputChart";
import { StatCard } from "../components/StatCard";
import { SAMPLE_ASSETS, SAMPLE_ASSET_READINGS, SAMPLE_STATS } from "../data/sample";

const DISPLAY_FONT = { fontFamily: "'Barlow Condensed', sans-serif" };

const TYPE_OPTIONS   = ["All", "Solar Array", "Wind Turbine", "Hydro Turbine", "Smart Meter"];
const REGION_OPTIONS = ["All", "MENA-UAE", "MENA-KSA", "EU-DE", "EU-ES"];

function FilterBar({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="label mr-1">{label}</span>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={clsx(
            "px-3 py-1.5 rounded text-[12px] font-medium transition-colors border",
            value === opt
              ? "bg-[#2563eb] border-[#2563eb] text-white"
              : "bg-transparent border-[#152046] text-white/40 hover:text-white hover:border-white/20"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [type, setType]     = useState("All");
  const [region, setRegion] = useState("All");

  const filtered = SAMPLE_ASSETS.filter((a) =>
    (type === "All" || a.deviceTypeLabel === type) &&
    (region === "All" || a.region === region)
  );

  // Aggregate stats across filtered assets
  const totalGen   = filtered.reduce((s, a) => s + a.totalGenerationKwh, 0);
  const avgCF      = filtered.length ? filtered.reduce((s, a) => s + a.capacityFactor, 0) / filtered.length : 0;
  const avgUptime  = filtered.length ? filtered.reduce((s, a) => s + a.sla.avgUptime, 0) / filtered.length : 0;
  const totalBatches = filtered.reduce((s, a) => s + a.sla.totalBatches, 0);

  // Combined chart: sum outputs across filtered assets per timestamp slot
  const chartData = filtered.length
    ? SAMPLE_ASSET_READINGS[filtered[0].id].map((_, i) => ({
        timestamp: SAMPLE_ASSET_READINGS[filtered[0].id][i].timestamp,
        output: filtered.reduce((s, a) => s + (SAMPLE_ASSET_READINGS[a.id][i]?.output ?? 0) / 1000, 0),
      }))
    : [];

  return (
    <div className="p-10 max-w-5xl space-y-8">

      <div>
        <p className="label mb-2">Overview</p>
        <h1 className="text-5xl font-black uppercase tracking-tight leading-none" style={DISPLAY_FONT}>
          Analytics
        </h1>
      </div>

      {/* Filters */}
      <div className="panel p-5 space-y-4">
        <FilterBar label="Type"   options={TYPE_OPTIONS}   value={type}   onChange={setType} />
        <FilterBar label="Region" options={REGION_OPTIONS} value={region} onChange={setRegion} />
      </div>

      {filtered.length === 0 ? (
        <div className="panel p-16 flex flex-col items-center justify-center text-center">
          <p className="text-white/20 text-[13px]">No assets for</p>
          <p className="text-white/60 text-lg font-medium mt-1">
            {[type !== "All" && type, region !== "All" && region].filter(Boolean).join(" · ")}
          </p>
        </div>
      ) : (
        <>
          {/* Aggregated stats */}
          <div className="panel p-8 grid grid-cols-4 gap-8">
            <StatCard label="Assets"           value={filtered.length}                          sub={`of ${SAMPLE_STATS.totalAssets} total`} />
            <StatCard label="Total Generation" value={`${(totalGen / 1000).toFixed(1)} MWh`}   sub="lifetime" />
            <StatCard label="Avg Capacity Factor" value={`${avgCF.toFixed(1)}%`} />
            <StatCard label="Avg Uptime"        value={`${avgUptime.toFixed(1)}%`}              sub={`${totalBatches} batches`} />
          </div>

          {/* Chart */}
          <div className="panel p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="label mb-1">Combined Output · 24h</p>
                <p className="text-white/40 text-[13px]">
                  {filtered.map((a) => a.location).join(" · ")}
                </p>
              </div>
              <p className="text-[11px] font-mono text-white/20">
                {filtered.length} asset{filtered.length > 1 ? "s" : ""} · 48 readings each
              </p>
            </div>
            <OutputChart data={chartData} height={260} />
          </div>

          {/* Per-asset breakdown */}
          <div className="panel overflow-hidden">
            <div className="px-6 py-4 border-b border-[#152046]">
              <p className="label">Assets</p>
            </div>
            <div className="divide-y divide-[#152046]">
              {filtered.map((a) => {
                const readings = SAMPLE_ASSET_READINGS[a.id];
                const peak = Math.max(...readings.filter((r) => r.uptime).map((r) => r.output));
                return (
                  <div key={a.id} className="px-6 py-4 flex items-center gap-6">
                    <div className="flex-1 grid grid-cols-5 gap-4">
                      <div>
                        <p className="label mb-1">Asset</p>
                        <p className="text-[13px] text-white/80 font-medium">{a.deviceTypeLabel}</p>
                      </div>
                      <div>
                        <p className="label mb-1">Location</p>
                        <p className="text-[13px] text-white/60">{a.location}</p>
                      </div>
                      <div>
                        <p className="label mb-1">Capacity</p>
                        <p className="text-[13px] text-white/60">{a.capacityKw} kW</p>
                      </div>
                      <div>
                        <p className="label mb-1">Capacity Factor</p>
                        <p className="text-[13px] text-white/60">{a.capacityFactor}%</p>
                      </div>
                      <div>
                        <p className="label mb-1">Peak (24h)</p>
                        <p className="text-[13px] text-white/60">{(peak / 1000).toFixed(1)} kWh</p>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shrink-0">
                      {a.statusLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Network-wide stats */}
          <div className="grid grid-cols-2 gap-6">
            <div className="panel p-6 space-y-4">
              <p className="label">Network · Assets by Type</p>
              {Object.entries(SAMPLE_STATS.assetsByType).map(([t, count]) => (
                <div key={t} className="flex items-center justify-between">
                  <span className="text-[13px] text-white/60">{t.replace(/([A-Z])/g, " $1").trim()}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1 rounded-full bg-[#152046] overflow-hidden">
                      <div className="h-full bg-[#2563eb] rounded-full" style={{ width: `${(count / SAMPLE_STATS.totalAssets) * 100}%` }} />
                    </div>
                    <span className="text-[13px] font-mono text-white/40 w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="panel p-6 space-y-4">
              <p className="label">Network · Last 24h</p>
              {[
                ["Batches Submitted",    SAMPLE_STATS.last24h.batchesSubmitted],
                ["Generation",          `${(SAMPLE_STATS.last24h.generationKwh / 1000).toFixed(1)} MWh`],
                ["Verifications",        SAMPLE_STATS.last24h.verificationsPerformed],
                ["Total Batches",        SAMPLE_STATS.totalBatches.toLocaleString()],
                ["Disputed Batches",     SAMPLE_STATS.disputedBatches],
                ["Avg Capacity Factor", `${SAMPLE_STATS.avgCapacityFactor}%`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[13px] text-white/40">{label}</span>
                  <span className="text-[13px] text-white/80 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
