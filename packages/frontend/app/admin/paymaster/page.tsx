"use client";

import { useState } from "react";
import {
  Wallet,
  Fuel,
  Settings,
  Loader2,
  CheckCircle2,
  Coins,
} from "lucide-react";
import { RoleGuard } from "../../components/RoleGuard";
import { StatCard } from "../../components/StatCard";
import { TxLink } from "../../components/TxLink";
import {
  useNativePaymasterDeposit,
  useNativePaymasterSigner,
  useNativePaymasterOwner,
  useSetSponsorSigner,
  useFundNativePaymaster,
  useERC20PaymasterDeposit,
  useERC20PaymasterToken,
  useERC20PaymasterMarkup,
  useERC20PaymasterRate,
  useFundERC20Paymaster,
} from "../../hooks/usePaymaster";
import { PAYMASTER_CONTRACTS } from "../../lib/paymaster-contracts";

function shortenAddress(addr: string | undefined): string {
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return "Not set";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function PaymasterAdminPage() {
  // Native Paymaster state
  const { data: nativeDeposit } = useNativePaymasterDeposit();
  const { data: sponsorSigner } = useNativePaymasterSigner();
  const { data: nativeOwner } = useNativePaymasterOwner();
  const {
    setSigner,
    isPending: isSettingSigner,
    isConfirming: isConfirmingSigner,
    isSuccess: isSignerSuccess,
    hash: signerHash,
  } = useSetSponsorSigner();
  const {
    fund: fundNative,
    isPending: isFundingNative,
    isConfirming: isConfirmingNativeFund,
    isSuccess: isNativeFundSuccess,
    hash: nativeFundHash,
  } = useFundNativePaymaster();

  // ERC20 Paymaster state
  const { data: erc20Deposit } = useERC20PaymasterDeposit();
  const { data: erc20Token } = useERC20PaymasterToken();
  const { data: erc20Markup } = useERC20PaymasterMarkup();
  const { data: erc20Rate } = useERC20PaymasterRate();
  const {
    fund: fundERC20,
    isPending: isFundingERC20,
    isConfirming: isConfirmingERC20Fund,
    isSuccess: isERC20FundSuccess,
    hash: erc20FundHash,
  } = useFundERC20Paymaster();

  // Form state
  const [signerAddress, setSignerAddress] = useState("");
  const [nativeFundAmount, setNativeFundAmount] = useState("");
  const [erc20FundAmount, setERC20FundAmount] = useState("");

  const isSignerSubmitting = isSettingSigner || isConfirmingSigner;
  const isNativeFunding = isFundingNative || isConfirmingNativeFund;
  const isERC20Funding = isFundingERC20 || isConfirmingERC20Fund;

  return (
    <RoleGuard role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Paymaster Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ERC-4337 gas sponsorship configuration for DeSense
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Native Deposit"
            value={nativeDeposit ? `${Number(nativeDeposit).toFixed(4)} ADI` : "--"}
            icon={Fuel}
          />
          <StatCard
            label="ERC20 Deposit"
            value={erc20Deposit ? `${Number(erc20Deposit).toFixed(4)} ADI` : "--"}
            icon={Coins}
          />
          <StatCard
            label="Sponsor Signer"
            value={shortenAddress(sponsorSigner)}
            icon={Settings}
          />
          <StatCard
            label="Token Markup"
            value={erc20Markup || "--"}
            icon={Wallet}
          />
        </div>

        {/* Native Paymaster */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Fuel className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              Native Paymaster
            </h2>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <span className="text-slate-500">Address:</span>
              <span className="ml-2 font-mono text-slate-700">
                {shortenAddress(PAYMASTER_CONTRACTS.nativePaymaster)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Owner:</span>
              <span className="ml-2 font-mono text-slate-700">
                {shortenAddress(nativeOwner)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">EntryPoint Deposit:</span>
              <span className="ml-2 text-slate-700">
                {nativeDeposit ? `${nativeDeposit} ADI` : "--"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Sponsor Signer:</span>
              <span className="ml-2 font-mono text-slate-700">
                {shortenAddress(sponsorSigner)}
              </span>
            </div>
          </div>

          {/* Set Signer */}
          <div className="border-t border-slate-100 pt-5 mb-5">
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              Set Sponsor Signer
            </h3>

            {isSignerSuccess && signerHash && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Signer updated! <TxLink hash={signerHash} />
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="text"
                value={signerAddress}
                onChange={(e) => setSignerAddress(e.target.value)}
                placeholder="0x... signer address"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setSigner(signerAddress as `0x${string}`)}
                disabled={isSignerSubmitting || !signerAddress}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSignerSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4" />
                )}
                Set Signer
              </button>
            </div>
          </div>

          {/* Fund Native Paymaster */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              Fund Paymaster
            </h3>

            {isNativeFundSuccess && nativeFundHash && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Funded! <TxLink hash={nativeFundHash} />
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="text"
                value={nativeFundAmount}
                onChange={(e) => setNativeFundAmount(e.target.value)}
                placeholder="Amount in ADI"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => fundNative(nativeFundAmount)}
                disabled={isNativeFunding || !nativeFundAmount}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isNativeFunding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Fuel className="w-4 h-4" />
                )}
                Fund
              </button>
            </div>
          </div>
        </div>

        {/* ERC20 Paymaster */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Coins className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              ERC20 Paymaster
            </h2>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <span className="text-slate-500">Address:</span>
              <span className="ml-2 font-mono text-slate-700">
                {shortenAddress(PAYMASTER_CONTRACTS.erc20Paymaster)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Token:</span>
              <span className="ml-2 font-mono text-slate-700">
                {shortenAddress(erc20Token)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">EntryPoint Deposit:</span>
              <span className="ml-2 text-slate-700">
                {erc20Deposit ? `${erc20Deposit} ADI` : "--"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Token Rate:</span>
              <span className="ml-2 text-slate-700">
                {erc20Rate ? `${erc20Rate} tokens/ADI` : "--"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Price Markup:</span>
              <span className="ml-2 text-slate-700">
                {erc20Markup || "--"}
              </span>
            </div>
          </div>

          {/* Fund ERC20 Paymaster */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              Fund Paymaster
            </h3>

            {isERC20FundSuccess && erc20FundHash && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Funded! <TxLink hash={erc20FundHash} />
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="text"
                value={erc20FundAmount}
                onChange={(e) => setERC20FundAmount(e.target.value)}
                placeholder="Amount in ADI"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => fundERC20(erc20FundAmount)}
                disabled={isERC20Funding || !erc20FundAmount}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isERC20Funding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Coins className="w-4 h-4" />
                )}
                Fund
              </button>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
