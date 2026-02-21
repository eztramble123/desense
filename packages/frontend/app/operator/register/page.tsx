"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { RoleGuard } from "../../components/RoleGuard";
import { TxLink } from "../../components/TxLink";
import { useRegisterDevice, DEVICE_TYPES } from "../../hooks/useContracts";

export default function RegisterDevicePage() {
  return (
    <RoleGuard role="operator">
      <RegisterDeviceForm />
    </RoleGuard>
  );
}

function RegisterDeviceForm() {
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
      {/* Back Link */}
      <Link
        href="/operator"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Operator Dashboard
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Register New Device
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Register an energy sensing device on the DeSense network
        </p>
      </div>

      {/* Success State */}
      {isSuccess && hash ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4">
          <div className="inline-flex p-3 bg-green-50 rounded-full">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">
            Device Registered Successfully
          </h2>
          <p className="text-sm text-slate-500">
            Your device has been registered on-chain and is pending activation.
          </p>
          <div className="pt-2">
            <TxLink hash={hash} label="View Transaction" />
          </div>
          <div className="pt-4">
            <Link
              href="/operator"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        /* Registration Form */
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-200"
        >
          {/* Device Type */}
          <div className="p-6 space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Device Type
            </label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {DEVICE_TYPES.map((type, index) => (
                <option key={index} value={index}>
                  {type}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400">
              Select the type of energy sensing device
            </p>
          </div>

          {/* Location */}
          <div className="p-6 space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 37.7749,-122.4194"
              required
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-slate-400">
              GPS coordinates or physical address of the device
            </p>
          </div>

          {/* Region */}
          <div className="p-6 space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Region
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. US-WEST, EU-CENTRAL"
              required
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-slate-400">
              Data region identifier for marketplace matching
            </p>
          </div>

          {/* Min Output */}
          <div className="p-6 space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Minimum Output
            </label>
            <input
              type="number"
              value={minOutput}
              onChange={(e) => setMinOutput(e.target.value)}
              placeholder="0"
              required
              min="0"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-slate-400">
              Minimum expected output value (e.g. watts)
            </p>
          </div>

          {/* Max Output */}
          <div className="p-6 space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Maximum Output
            </label>
            <input
              type="number"
              value={maxOutput}
              onChange={(e) => setMaxOutput(e.target.value)}
              placeholder="1000"
              required
              min="0"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-slate-400">
              Maximum expected output value (e.g. watts)
            </p>
          </div>

          {/* Sampling Rate */}
          <div className="p-6 space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Sampling Rate (seconds)
            </label>
            <input
              type="number"
              value={samplingRate}
              onChange={(e) => setSamplingRate(e.target.value)}
              placeholder="300"
              required
              min="1"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-slate-400">
              How often the device samples data, in seconds
            </p>
          </div>

          {/* Submit */}
          <div className="p-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                "Register Device"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
