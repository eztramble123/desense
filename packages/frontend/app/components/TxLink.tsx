import { ExternalLink } from "lucide-react";

const EXPLORER = "https://explorer.ab.testnet.adifoundation.ai";

export function TxLink({ hash, label }: { hash: string; label?: string }) {
  return (
    <a
      href={`${EXPLORER}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[#f59e0b] hover:text-[#fbbf24] text-[13px] font-mono transition-colors"
    >
      {label ?? `${hash.slice(0, 8)}…${hash.slice(-6)}`}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export function AddressLink({ address, label }: { address: string; label?: string }) {
  return (
    <a
      href={`${EXPLORER}/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[#f59e0b] hover:text-[#fbbf24] text-[13px] font-mono transition-colors"
    >
      {label ?? `${address.slice(0, 6)}…${address.slice(-4)}`}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}
