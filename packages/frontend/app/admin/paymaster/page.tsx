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

  const [signerAddress, setSignerAddress] = useState("");
  const [nativeFundAmount, setNativeFundAmount] = useState("");
  const [erc20FundAmount, setERC20FundAmount] = useState("");

  const isSignerSubmitting = isSettingSigner || isConfirmingSigner;
  const isNativeFunding = isFundingNative || isConfirmingNativeFund;
  const isERC20Funding = isFundingERC20 || isConfirmingERC20Fund;

  return (
    <RoleGuard role="admin">
      <div className="space-y-8">
        <div>
          <h1 className="zeus-heading text-2xl text-zeus-stone-900">
            Gas Sponsorship
          </h1>
          <p className="text-sm text-zeus-stone-500 mt-1">
            ERC-4337 gas sponsorship configuration for Zeus
          </p>
        </div>

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

        <div className="zeus-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Fuel className="w-5 h-5 text-zeus-gold" />
            <h2 className="zeus-heading text-sm text-zeus-stone-800">
              Native Paymaster
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <span className="zeus-label">Address:</span>
              <span className="ml-2 font-mono text-zeus-stone-700">
                {shortenAddress(PAYMASTER_CONTRACTS.nativePaymaster)}
              </span>
            </div>
            <div>
              <span className="zeus-label">Owner:</span>
              <span className="ml-2 font-mono text-zeus-stone-700">
                {shortenAddress(nativeOwner)}
              </span>
            </div>
            <div>
              <span className="zeus-label">EntryPoint Deposit:</span>
              <span className="ml-2 text-zeus-stone-700">
                {nativeDeposit ? `${nativeDeposit} ADI` : "--"}
              </span>
            </div>
            <div>
              <span className="zeus-label">Sponsor Signer:</span>
              <span className="ml-2 font-mono text-zeus-stone-700">
                {shortenAddress(sponsorSigner)}
              </span>
            </div>
          </div>

          <div className="border-t border-zeus-stone-100 pt-5 mb-5">
            <h3 className="zeus-label mb-3">
              Set Sponsor Signer
            </h3>

            {isSignerSuccess && signerHash && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-800">
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
                className="zeus-input flex-1 font-mono"
              />
              <button
                onClick={() => setSigner(signerAddress as `0x${string}`)}
                disabled={isSignerSubmitting || !signerAddress}
                className="zeus-btn-primary"
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

          <div className="border-t border-zeus-stone-100 pt-5">
            <h3 className="zeus-label mb-3">
              Fund Paymaster
            </h3>

            {isNativeFundSuccess && nativeFundHash && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-800">
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
                className="zeus-input flex-1"
              />
              <button
                onClick={() => fundNative(nativeFundAmount)}
                disabled={isNativeFunding || !nativeFundAmount}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

        <div className="zeus-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Coins className="w-5 h-5 text-zeus-gold" />
            <h2 className="zeus-heading text-sm text-zeus-stone-800">
              ERC20 Paymaster
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <span className="zeus-label">Address:</span>
              <span className="ml-2 font-mono text-zeus-stone-700">
                {shortenAddress(PAYMASTER_CONTRACTS.erc20Paymaster)}
              </span>
            </div>
            <div>
              <span className="zeus-label">Token:</span>
              <span className="ml-2 font-mono text-zeus-stone-700">
                {shortenAddress(erc20Token)}
              </span>
            </div>
            <div>
              <span className="zeus-label">EntryPoint Deposit:</span>
              <span className="ml-2 text-zeus-stone-700">
                {erc20Deposit ? `${erc20Deposit} ADI` : "--"}
              </span>
            </div>
            <div>
              <span className="zeus-label">Token Rate:</span>
              <span className="ml-2 text-zeus-stone-700">
                {erc20Rate ? `${erc20Rate} tokens/ADI` : "--"}
              </span>
            </div>
            <div>
              <span className="zeus-label">Price Markup:</span>
              <span className="ml-2 text-zeus-stone-700">
                {erc20Markup || "--"}
              </span>
            </div>
          </div>

          <div className="border-t border-zeus-stone-100 pt-5">
            <h3 className="zeus-label mb-3">
              Fund Paymaster
            </h3>

            {isERC20FundSuccess && erc20FundHash && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-800">
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
                className="zeus-input flex-1"
              />
              <button
                onClick={() => fundERC20(erc20FundAmount)}
                disabled={isERC20Funding || !erc20FundAmount}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-zeus-gold text-white hover:bg-zeus-gold-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
