"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, X } from "lucide-react";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-zeus-stone-400 tracking-wider">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-zeus-stone-700 hover:bg-zeus-stone-600 text-zeus-stone-200 rounded-lg transition-colors border border-zeus-stone-600"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-zeus-gold hover:bg-zeus-gold-dark text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm"
      >
        Connect Wallet
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 border border-zeus-stone-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="zeus-heading text-lg text-zeus-stone-800">
                Connect Wallet
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-zeus-stone-400 hover:text-zeus-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector });
                    setShowModal(false);
                  }}
                  disabled={isPending}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-zeus-stone-50 border border-zeus-stone-200 hover:border-zeus-gold hover:bg-zeus-stone-100 text-left transition-colors disabled:opacity-50 shadow-inner"
                >
                  <Wallet className="w-5 h-5 text-zeus-stone-500" />
                  <span className="text-sm font-medium text-zeus-stone-700">
                    {connector.name}
                  </span>
                </button>
              ))}
            </div>

            {connectors.length === 0 && (
              <p className="text-sm text-zeus-stone-500 text-center py-4">
                No wallets detected. Install MetaMask or another browser wallet.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
