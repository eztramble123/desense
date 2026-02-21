"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { RoleGuard } from "../../components/RoleGuard";
import { TxLink } from "../../components/TxLink";
import { useRegisterDevice, DEVICE_TYPES } from "../../hooks/useContracts";

export default function RegisterAssetPage() {
  return (
    <RoleGuard role="operator">
      <RegisterAssetForm />
    </RoleGuard>
  );
}

function RegisterAssetForm() {
  const { register, isPending, isConfirming, isSuccess, hash } =
    useRegisterDevice();

  const [deviceType, setDeviceType] = useState<number>(0);
  const [location, setLocation] = useState("");
  const [region, setRegion] = useState("");
  const [minOutput, setMinOutput] = useState("");
  const [maxOutput, setMaxOutput] = useState("");
  const [samplingRate, setSamplingRate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(
      deviceType,
      location,
      region,
      BigInt(minOutput),
      BigInt(maxOutput),
      BigInt(samplingRate)
    );
  };

  const isSubmitting = isPending || isConfirming;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/operator"
        className="inline-flex items-center gap-2 text-sm text-zeus-stone-500 hover:text-zeus-stone-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Generation Assets
      </Link>

      <div>
        <h1 className="zeus-heading text-2xl text-zeus-stone-900">
          Register Asset
        </h1>
        <p className="text-sm text-zeus-stone-500 mt-1">
          Register an energy generation asset on the Zeus network
        </p>
      </div>

      {isSuccess && hash ? (
        <div className="zeus-card p-8 text-center space-y-4">
          <div className="inline-flex p-3 bg-emerald-50 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="zeus-heading text-lg text-zeus-stone-900">
            Asset Registered Successfully
          </h2>
          <p className="text-sm text-zeus-stone-500">
            Your generation asset has been registered on-chain and is pending activation.
          </p>
          <div className="pt-2">
            <TxLink hash={hash} label="View Transaction" />
          </div>
          <div className="pt-4">
            <Link href="/operator" className="zeus-btn-primary">
              Return to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="zeus-card divide-y divide-zeus-stone-200"
        >
          <div className="p-6 space-y-2">
            <label className="zeus-label">
              Asset Type
            </label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(Number(e.target.value))}
              className="zeus-input"
            >
              {DEVICE_TYPES.map((type, index) => (
                <option key={index} value={index}>
                  {type}
                </option>
              ))}
            </select>
            <p className="text-xs text-zeus-stone-400">
              Select the type of energy generation asset
            </p>
          </div>

          <div className="p-6 space-y-2">
            <label className="zeus-label">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 37.7749,-122.4194"
              required
              className="zeus-input"
            />
            <p className="text-xs text-zeus-stone-400">
              GPS coordinates or physical address of the asset
            </p>
          </div>

          <div className="p-6 space-y-2">
            <label className="zeus-label">
              Region
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. US-WEST, EU-CENTRAL"
              required
              className="zeus-input"
            />
            <p className="text-xs text-zeus-stone-400">
              Grid region identifier for subscription matching
            </p>
          </div>

          <div className="p-6 space-y-2">
            <label className="zeus-label">
              Min Generation (kWh)
            </label>
            <input
              type="number"
              value={minOutput}
              onChange={(e) => setMinOutput(e.target.value)}
              placeholder="0"
              required
              min="0"
              className="zeus-input"
            />
            <p className="text-xs text-zeus-stone-400">
              Minimum expected generation output
            </p>
          </div>

          <div className="p-6 space-y-2">
            <label className="zeus-label">
              Max Generation (kWh)
            </label>
            <input
              type="number"
              value={maxOutput}
              onChange={(e) => setMaxOutput(e.target.value)}
              placeholder="1000"
              required
              min="0"
              className="zeus-input"
            />
            <p className="text-xs text-zeus-stone-400">
              Rated capacity / maximum generation output
            </p>
          </div>

          <div className="p-6 space-y-2">
            <label className="zeus-label">
              Sampling Rate (seconds)
            </label>
            <input
              type="number"
              value={samplingRate}
              onChange={(e) => setSamplingRate(e.target.value)}
              placeholder="300"
              required
              min="1"
              className="zeus-input"
            />
            <p className="text-xs text-zeus-stone-400">
              How often the smart meter samples generation data
            </p>
          </div>

          <div className="p-6">
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
                "Register Asset"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
