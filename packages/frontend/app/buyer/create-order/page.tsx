"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, CheckCircle2 } from "lucide-react";
import { RoleGuard } from "../../components/RoleGuard";
import { TxLink } from "../../components/TxLink";
import {
  useCreateOrder,
  DEVICE_TYPES,
  parseEther,
} from "../../hooks/useContracts";

export default function CreateOrderPage() {
  const { createOrder, isPending, isConfirming, isSuccess, hash } =
    useCreateOrder();

  const [deviceType, setDeviceType] = useState("0");
  const [region, setRegion] = useState("");
  const [minUptimePercent, setMinUptimePercent] = useState("");
  const [minAvgOutput, setMinAvgOutput] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [pricePerBatch, setPricePerBatch] = useState("");
  const [escrowAmount, setEscrowAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const uptimeBps = BigInt(Math.round(parseFloat(minUptimePercent) * 100));
    const output = BigInt(minAvgOutput);
    const durationSeconds = BigInt(parseInt(durationDays) * 86400);
    const priceWei = parseEther(pricePerBatch);

    createOrder(
      parseInt(deviceType),
      region,
      uptimeBps,
      output,
      durationSeconds,
      priceWei,
      escrowAmount
    );
  };

  const isSubmitting = isPending || isConfirming;

  return (
    <RoleGuard role="buyer">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/buyer"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Create Data Order
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Specify your data requirements and escrow funds for device operators
          </p>
        </div>

        {/* Success State */}
        {isSuccess && hash && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="font-semibold text-green-800">
                Order Created Successfully
              </p>
            </div>
            <div className="text-sm text-green-700">
              Transaction: <TxLink hash={hash} />
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-slate-200 p-6 space-y-5"
        >
          {/* Device Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Device Type
            </label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {DEVICE_TYPES.map((type, i) => (
                <option key={i} value={i}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Region
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g., US-WEST, EU-CENTRAL"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-2 gap-4">
            {/* Min Uptime % */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Min Uptime (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={minUptimePercent}
                onChange={(e) => setMinUptimePercent(e.target.value)}
                placeholder="e.g., 95.00"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Converted to basis points (95% = 9500 bps)
              </p>
            </div>

            {/* Min Avg Output */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Min Avg Output
              </label>
              <input
                type="number"
                min="0"
                value={minAvgOutput}
                onChange={(e) => setMinAvgOutput(e.target.value)}
                placeholder="e.g., 500"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Minimum average output per batch
              </p>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Duration (days)
            </label>
            <input
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              placeholder="e.g., 30"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              Automatically converted to seconds on-chain
            </p>
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-2 gap-4">
            {/* Price Per Batch */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Price Per Batch (ADI)
              </label>
              <input
                type="text"
                value={pricePerBatch}
                onChange={(e) => setPricePerBatch(e.target.value)}
                placeholder="e.g., 0.01"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Escrow Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Escrow Amount (ADI)
              </label>
              <input
                type="text"
                value={escrowAmount}
                onChange={(e) => setEscrowAmount(e.target.value)}
                placeholder="e.g., 10.0"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Sent as msg.value to the contract
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirm in Wallet...
              </>
            ) : isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirming Transaction...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Create Order
              </>
            )}
          </button>
        </form>
      </div>
    </RoleGuard>
  );
}
