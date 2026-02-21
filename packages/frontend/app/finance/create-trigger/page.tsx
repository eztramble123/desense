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
      <div>
        <Link
          href="/finance"
          className="inline-flex items-center gap-1.5 text-sm text-zeus-stone-500 hover:text-zeus-stone-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Performance Triggers
        </Link>
        <h1 className="zeus-heading text-2xl text-zeus-stone-900">
          Create Performance Trigger
        </h1>
        <p className="text-sm text-zeus-stone-500 mt-1">
          Set up a performance-based payout trigger for a generation asset
        </p>
      </div>

      {isSuccess && hash && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <p className="font-semibold text-emerald-800">
              Trigger Created Successfully
            </p>
          </div>
          <div className="text-sm text-emerald-700">
            Transaction: <TxLink hash={hash} />
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="zeus-card p-6 space-y-5"
      >
        <div>
          <label className="zeus-label mb-1.5 block">
            Beneficiary Address
          </label>
          <input
            type="text"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            placeholder="0x..."
            className="zeus-input font-mono"
            required
          />
          <p className="text-xs text-zeus-stone-400 mt-1">
            Address that will receive the payout when the trigger fires
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="zeus-label mb-1.5 block">
              Asset ID
            </label>
            <input
              type="number"
              min="0"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="e.g., 0"
              className="zeus-input"
              required
            />
          </div>

          <div>
            <label className="zeus-label mb-1.5 block">
              Trigger Type
            </label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="zeus-input"
            >
              {TRIGGER_TYPES.map((type, i) => (
                <option key={i} value={i}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="zeus-label mb-1.5 block">
            Threshold
          </label>
          <input
            type="number"
            min="0"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="e.g., 9500 for capacity factor bps, or 500 for generation"
            className="zeus-input"
            required
          />
          <p className="text-xs text-zeus-stone-400 mt-1">
            For capacity factor triggers, use basis points (95% = 9500). For generation
            triggers, use raw kWh value.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="zeus-label mb-1.5 block">
              Observation Period (days)
            </label>
            <input
              type="number"
              min="1"
              value={observationDays}
              onChange={(e) => setObservationDays(e.target.value)}
              placeholder="e.g., 30"
              className="zeus-input"
              required
            />
            <p className="text-xs text-zeus-stone-400 mt-1">
              Converted to seconds on-chain
            </p>
          </div>

          <div>
            <label className="zeus-label mb-1.5 block">
              Required Streak
            </label>
            <input
              type="number"
              min="1"
              value={requiredStreak}
              onChange={(e) => setRequiredStreak(e.target.value)}
              placeholder="e.g., 5"
              className="zeus-input"
              required
            />
            <p className="text-xs text-zeus-stone-400 mt-1">
              Consecutive qualifying attestations needed
            </p>
          </div>
        </div>

        <div>
          <label className="zeus-label mb-1.5 block">
            Payout Amount (ADI)
          </label>
          <input
            type="text"
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
            placeholder="e.g., 5.0"
            className="zeus-input"
            required
          />
          <p className="text-xs text-zeus-stone-400 mt-1">
            Escrowed in the contract and released when the trigger fires
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="zeus-btn-primary w-full py-3"
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
