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

export default function CreateSubscriptionPage() {
  const { createOrder, isPending, isConfirming, isSuccess, hash } =
    useCreateOrder();

  const [deviceType, setDeviceType] = useState("0");
  const [region, setRegion] = useState("");
  const [minCapacityPercent, setMinCapacityPercent] = useState("");
  const [minAvgOutput, setMinAvgOutput] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [pricePerAttestation, setPricePerAttestation] = useState("");
  const [escrowAmount, setEscrowAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const capacityBps = BigInt(Math.round(parseFloat(minCapacityPercent) * 100));
    const output = BigInt(minAvgOutput);
    const durationSeconds = BigInt(parseInt(durationDays) * 86400);
    const priceWei = parseEther(pricePerAttestation);

    createOrder(
      parseInt(deviceType),
      region,
      capacityBps,
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
        <div>
          <Link
            href="/buyer"
            className="inline-flex items-center gap-1.5 text-sm text-zeus-stone-500 hover:text-zeus-stone-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Subscriptions
          </Link>
          <h1 className="zeus-heading text-2xl text-zeus-stone-900">
            Create Subscription
          </h1>
          <p className="text-sm text-zeus-stone-500 mt-1">
            Specify your generation data requirements and escrow funds for asset operators
          </p>
        </div>

        {isSuccess && hash && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <p className="font-semibold text-emerald-800">
                Subscription Created Successfully
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
              Asset Type
            </label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="zeus-input"
            >
              {DEVICE_TYPES.map((type, i) => (
                <option key={i} value={i}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="zeus-label mb-1.5 block">
              Region
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g., US-WEST, EU-CENTRAL"
              className="zeus-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="zeus-label mb-1.5 block">
                Min Capacity Factor (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={minCapacityPercent}
                onChange={(e) => setMinCapacityPercent(e.target.value)}
                placeholder="e.g., 95.00"
                className="zeus-input"
                required
              />
              <p className="text-xs text-zeus-stone-400 mt-1">
                Converted to basis points (95% = 9500 bps)
              </p>
            </div>

            <div>
              <label className="zeus-label mb-1.5 block">
                Min Avg Generation (kWh)
              </label>
              <input
                type="number"
                min="0"
                value={minAvgOutput}
                onChange={(e) => setMinAvgOutput(e.target.value)}
                placeholder="e.g., 500"
                className="zeus-input"
                required
              />
              <p className="text-xs text-zeus-stone-400 mt-1">
                Minimum average generation per attestation
              </p>
            </div>
          </div>

          <div>
            <label className="zeus-label mb-1.5 block">
              Duration (days)
            </label>
            <input
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              placeholder="e.g., 30"
              className="zeus-input"
              required
            />
            <p className="text-xs text-zeus-stone-400 mt-1">
              Automatically converted to seconds on-chain
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="zeus-label mb-1.5 block">
                Price Per Attestation (ADI)
              </label>
              <input
                type="text"
                value={pricePerAttestation}
                onChange={(e) => setPricePerAttestation(e.target.value)}
                placeholder="e.g., 0.01"
                className="zeus-input"
                required
              />
            </div>

            <div>
              <label className="zeus-label mb-1.5 block">
                Escrow Amount (ADI)
              </label>
              <input
                type="text"
                value={escrowAmount}
                onChange={(e) => setEscrowAmount(e.target.value)}
                placeholder="e.g., 10.0"
                className="zeus-input"
                required
              />
              <p className="text-xs text-zeus-stone-400 mt-1">
                Sent as msg.value to the contract
              </p>
            </div>
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
                Create Subscription
              </>
            )}
          </button>
        </form>
      </div>
    </RoleGuard>
  );
}
