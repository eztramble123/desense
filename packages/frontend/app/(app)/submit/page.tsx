"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { decodeEventLog } from "viem";
import { wagmiConfig } from "../../lib/wagmi";
import { api, type IngestResult } from "../../lib/api";
import Link from "next/link";
import clsx from "clsx";

const DISPLAY_FONT = { fontFamily: "'Barlow Condensed', sans-serif" };

const REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_DEVICE_REGISTRY ?? "") as `0x${string}`;

const REGISTRY_ABI = [
  {
    name: "registerDevice",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "deviceType",          type: "uint8"   },
      { name: "location",            type: "string"  },
      { name: "region",              type: "string"  },
      { name: "minOutput",           type: "uint256" },
      { name: "maxOutput",           type: "uint256" },
      { name: "samplingRateSeconds", type: "uint256" },
      { name: "capacity",            type: "uint256" },
      { name: "latitude",            type: "int256"  },
      { name: "longitude",           type: "int256"  },
    ],
    outputs: [{ name: "deviceId", type: "uint256" }],
  },
  {
    name: "DeviceRegistered",
    type: "event",
    inputs: [
      { name: "deviceId", type: "uint256", indexed: true },
      { name: "operator", type: "address", indexed: true },
      { name: "deviceType", type: "uint8" },
      { name: "region",    type: "string" },
    ],
  },
] as const;

const DEVICE_TYPES = ["Residential Building", "Commercial Building", "Mixed Use", "Smart Meter"];

const CSV_TEMPLATE = `timestamp,output_wh,uptime
${Math.floor(Date.now() / 1000) - 3600},18400,true
${Math.floor(Date.now() / 1000) - 1800},21200,true
${Math.floor(Date.now() / 1000) - 600},19800,true`;

function StepIndicator({ current }: { current: number }) {
  const steps = ["Connect", "Register", "Upload", "Done"];
  return (
    <div className="flex items-center gap-2 mb-10">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={clsx(
            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
            i < current  ? "bg-[#2563eb] text-white" :
            i === current ? "bg-[#2563eb]/20 border border-[#2563eb] text-[#2563eb]" :
                            "bg-[#0a1530] border border-[#152046] text-white/20"
          )}>
            {i < current ? "✓" : i + 1}
          </div>
          <span className={clsx("text-[11px] uppercase tracking-wider font-semibold",
            i === current ? "text-white/70" : "text-white/20"
          )}>{label}</span>
          {i < steps.length - 1 && <div className="w-8 h-px bg-[#152046] mx-1" />}
        </div>
      ))}
    </div>
  );
}

export default function SubmitPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors }  = useConnect();
  const { disconnect }           = useDisconnect();
  const { writeContractAsync }   = useWriteContract();

  const [step, setStep] = useState(0);

  // Step 1 — register
  const [form, setForm] = useState({
    deviceType: "0", location: "", region: "",
    capacityKw: "", latitude: "", longitude: "",
  });
  const [txStatus, setTxStatus] = useState<"idle"|"pending"|"confirming"|"done"|"error">("idle");
  const [txHash, setTxHash]     = useState("");
  const [txError, setTxError]   = useState("");
  const [deviceId, setDeviceId] = useState<number | null>(null);

  // Step 2 — waiting for indexer
  const [indexed, setIndexed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 3 — upload
  const [readings, setReadings] = useState<{ timestamp: number; output: number; uptime: boolean }[]>([]);
  const [csvError, setCsvError] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const [ingestError, setIngestError]   = useState("");

  useEffect(() => {
    if (isConnected && step === 0) setStep(1);
  }, [isConnected]);

  useEffect(() => {
    if (step !== 2 || deviceId === null) return;
    pollRef.current = setInterval(async () => {
      try {
        await api.asset(deviceId);
        setIndexed(true);
        clearInterval(pollRef.current!);
        setStep(3);
      } catch { /* not indexed yet */ }
    }, 3000);
    return () => clearInterval(pollRef.current!);
  }, [step, deviceId]);

  async function handleRegister() {
    setTxStatus("pending");
    setTxError("");
    try {
      const cap   = Math.round(parseFloat(form.capacityKw) * 1000); // kW → W
      const lat   = BigInt(Math.round(parseFloat(form.latitude)  * 1e6));
      const lng   = BigInt(Math.round(parseFloat(form.longitude) * 1e6));
      const hash  = await writeContractAsync({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: "registerDevice",
        args: [
          Number(form.deviceType),
          form.location,
          form.region,
          BigInt(0),
          BigInt(cap),
          BigInt(1800),
          BigInt(cap),
          lat,
          lng,
        ],
      });
      setTxStatus("confirming");
      setTxHash(hash);
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, confirmations: 1, timeout: 180_000, pollingInterval: 2_000 });

      let parsedId: number | null = null;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: REGISTRY_ABI, data: log.data, topics: log.topics });
          if (decoded.eventName === "DeviceRegistered") {
            parsedId = Number((decoded.args as any).deviceId);
            break;
          }
        } catch { /* skip non-matching logs */ }
      }

      if (parsedId === null) throw new Error("Could not parse deviceId from receipt");
      setDeviceId(parsedId);
      setTxStatus("done");
      setStep(2);
    } catch (e: any) {
      setTxStatus("error");
      setTxError(e.shortMessage ?? e.message ?? "Transaction failed");
    }
  }

  function parseCSV(text: string) {
    setCsvError("");
    const lines = text.trim().split("\n").filter((l) => !l.startsWith("timestamp"));
    try {
      const parsed = lines.map((line) => {
        const [ts, out, up] = line.split(",").map((s) => s.trim());
        if (!ts || !out || !up) throw new Error("Invalid CSV format");
        return {
          timestamp: Number(ts),
          output:    Number(out),
          uptime:    up.toLowerCase() === "true",
        };
      });
      setReadings(parsed);
    } catch (e: any) {
      setCsvError(e.message);
      setReadings([]);
    }
  }

  async function handleIngest() {
    if (!readings.length || deviceId === null) return;
    setIngesting(true);
    setIngestError("");
    try {
      const result = await api.ingest(deviceId, readings);
      setIngestResult(result);
      setStep(4);
    } catch (e: any) {
      setIngestError(e.message);
    } finally {
      setIngesting(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "readings_template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-10 max-w-2xl">
      <div className="mb-8">
        <p className="label mb-2">On-Chain</p>
        <h1 className="text-5xl font-black uppercase tracking-tight leading-none" style={DISPLAY_FONT}>
          Submit Data
        </h1>
      </div>

      <StepIndicator current={step} />

      {/* ── Step 0: Connect ── */}
      {step === 0 && (
        <div className="panel p-8 flex flex-col items-center text-center gap-6">
          <p className="text-white/50 text-[14px]">Connect your wallet to register a device and submit energy data on-chain.</p>
          {connectors.map((c) => (
            <button
              key={c.id}
              onClick={() => connect({ connector: c })}
              className="btn-primary px-8 py-3 text-[13px]"
            >
              Connect {c.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Step 1: Register device ── */}
      {step === 1 && (
        <div className="panel p-8 space-y-6">
          <div className="flex items-center justify-between">
            <p className="label">Register Device</p>
            <button onClick={() => disconnect()} className="text-[11px] text-white/20 hover:text-white/50 transition-colors">
              {address?.slice(0,6)}…{address?.slice(-4)} ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="label mb-2">Device Type</p>
              <select
                value={form.deviceType}
                onChange={(e) => setForm((f) => ({ ...f, deviceType: e.target.value }))}
                className="w-full bg-[#0f1e42] border border-[#152046] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#2563eb]"
              >
                {DEVICE_TYPES.map((t, i) => <option key={t} value={i}>{t}</option>)}
              </select>
            </div>
            {[
              { key: "location",   label: "Building Name / Address", placeholder: "One Canada Square, London", span: 2 },
              { key: "region",     label: "Region",                  placeholder: "Europe",                   span: 1 },
              { key: "capacityKw", label: "Peak Demand (kW)",        placeholder: "250",                      span: 1 },
              { key: "latitude",   label: "Latitude",                placeholder: "51.5051",                  span: 1 },
              { key: "longitude",  label: "Longitude",               placeholder: "-0.0235",                  span: 1 },
            ].map(({ key, label, placeholder, span }) => (
              <div key={key} className={span === 2 ? "col-span-2" : ""}>
                <p className="label mb-2">{label}</p>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-[#0f1e42] border border-[#152046] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#2563eb]"
                />
              </div>
            ))}
          </div>

          {txHash && txStatus === "confirming" && (
            <p className="font-mono text-[10px] text-white/20 break-all">tx: {txHash}</p>
          )}
          {txError && <p className="text-red-400/80 text-[12px] font-mono">{txError}</p>}

          <button
            onClick={handleRegister}
            disabled={txStatus === "pending" || txStatus === "confirming" || !form.location || !form.region || !form.capacityKw || !form.latitude || !form.longitude}
            className="btn-primary w-full py-3 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {txStatus === "pending"    ? "Waiting for wallet…" :
             txStatus === "confirming" ? "Waiting for confirmation…" :
             "Register Device"}
          </button>
        </div>
      )}

      {/* ── Step 2: Waiting for indexer ── */}
      {step === 2 && (
        <div className="panel p-8 flex flex-col items-center text-center gap-4">
          <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 text-[14px]">Device #{deviceId} registered on-chain</p>
          <p className="label animate-pulse">Waiting for backend indexer (~10s)…</p>
          {txHash && <p className="font-mono text-[10px] text-white/20 break-all">{txHash}</p>}
        </div>
      )}

      {/* ── Step 3: Upload readings ── */}
      {step === 3 && (
        <div className="panel p-8 space-y-6">
          <div className="flex items-center justify-between">
            <p className="label">Upload Readings — Device #{deviceId}</p>
            <button onClick={downloadTemplate} className="text-[11px] text-[#2563eb] hover:text-blue-300 transition-colors">
              Download template ↓
            </button>
          </div>

          <div>
            <p className="label mb-2">CSV File</p>
            <p className="text-[11px] text-white/30 mb-3">Format: <span className="font-mono">timestamp,consumption_wh,uptime</span></p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                file.text().then(parseCSV);
              }}
              className="w-full text-[13px] text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-[12px] file:font-semibold file:bg-[#2563eb] file:text-white hover:file:bg-[#1d4ed8] file:cursor-pointer"
            />
            {csvError && <p className="text-red-400/80 text-[12px] mt-2">{csvError}</p>}
          </div>

          {readings.length > 0 && (
            <div className="bg-[#0f1e42] rounded-lg p-4">
              <p className="label mb-3">{readings.length} readings parsed</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {readings.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-center gap-4 text-[11px] font-mono text-white/40">
                    <span>{r.timestamp}</span>
                    <span>{r.output} Wh</span>
                    <span className={r.uptime ? "text-emerald-400/60" : "text-red-400/60"}>{r.uptime ? "online" : "offline"}</span>
                  </div>
                ))}
                {readings.length > 5 && <p className="text-[11px] text-white/20">+{readings.length - 5} more</p>}
              </div>
            </div>
          )}

          {ingestError && <p className="text-red-400/80 text-[12px] font-mono">{ingestError}</p>}

          <button
            onClick={handleIngest}
            disabled={readings.length === 0 || ingesting}
            className="btn-primary w-full py-3 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {ingesting ? "Attesting on-chain…" : `Submit ${readings.length} Readings`}
          </button>
        </div>
      )}

      {/* ── Step 4: Success ── */}
      {step === 4 && ingestResult && (
        <div className="panel p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-sm">✓</div>
            <p className="text-white font-semibold">Data attested on-chain</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[13px]">
            {[
              ["Device ID",  `#${ingestResult.deviceId}`],
              ["Batch ID",   `#${ingestResult.batchId}`],
              ["Readings",   `${ingestResult.readingsReceived}`],
              ["IPFS CID",   ingestResult.ipfsCid],
              ["Data Root",  ingestResult.dataRoot],
              ["Tx Hash",    ingestResult.txHash],
            ].map(([label, value]) => (
              <div key={label} className={label === "Tx Hash" || label === "Data Root" || label === "IPFS CID" ? "col-span-2" : ""}>
                <p className="label mb-1">{label}</p>
                <p className="font-mono text-white/60 break-all text-[12px]">{value}</p>
              </div>
            ))}
          </div>

          <Link
            href={`/assets/${ingestResult.deviceId}`}
            className="btn-primary w-full py-3 justify-center text-center"
          >
            View Asset Data →
          </Link>
        </div>
      )}
    </div>
  );
}
