"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, CheckCircle2 } from "lucide-react";
import { TxLink } from "../../components/TxLink";
import {
  useCreateTrigger,
  TRIGGER_TYPES,
} from "../../hooks/useContracts";

export default function CreateTriggerPage() {
  const { createTrigger, isPending, isConfirming, isSuccess, hash } =
    useCreateTrigger();

  const [beneficiary, setBeneficiary] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [triggerType, setTriggerType] = useState("0");
  const [threshold, setThreshold] = useState("");
  const [observationDays, setObservationDays] = useState("");
  const [requiredStreak, setRequiredStreak] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const observationSeconds = BigInt(parseInt(observationDays) * 86400);

    createTrigger(
      beneficiary as `0x${string}`,
      BigInt(deviceId),
      parseInt(triggerType),
      BigInt(threshold),
      observationSeconds,
      BigInt(requiredStreak),
      payoutAmount
    );
  };

  const isSubmitting = isPending || isConfirming;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/finance"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Finance
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          Create Financing Trigger
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Set up a performance-based payout trigger for a device
        </p>
      </div>

      {/* Success State */}
      {isSuccess && hash && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="font-semibold text-green-800">
              Trigger Created Successfully
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
        {/* Beneficiary */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Beneficiary Address
          </label>
          <input
            type="text"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            Address that will receive the payout when the trigger fires
          </p>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Device ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Device ID
            </label>
            <input
              type="number"
              min="0"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="e.g., 0"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Trigger Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Trigger Type
            </label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TRIGGER_TYPES.map((type, i) => (
                <option key={i} value={i}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Threshold */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Threshold
          </label>
          <input
            type="number"
            min="0"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="e.g., 9500 for uptime bps, or 500 for output"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            For uptime triggers, use basis points (95% = 9500). For output
            triggers, use raw output value.
          </p>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Observation Period */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Observation Period (days)
            </label>
            <input
              type="number"
              min="1"
              value={observationDays}
              onChange={(e) => setObservationDays(e.target.value)}
              placeholder="e.g., 30"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              Converted to seconds on-chain
            </p>
          </div>

          {/* Required Streak */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Required Streak
            </label>
            <input
              type="number"
              min="1"
              value={requiredStreak}
              onChange={(e) => setRequiredStreak(e.target.value)}
              placeholder="e.g., 5"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              Consecutive qualifying batches needed to fire
            </p>
          </div>
        </div>

        {/* Payout Amount */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Payout Amount (ADI)
          </label>
          <input
            type="text"
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
            placeholder="e.g., 5.0"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            Escrowed in the contract and released when the trigger fires
          </p>
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
              Create Trigger
            </>
          )}
        </button>
      </form>
    </div>
  );
}
