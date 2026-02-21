import { ExternalLink } from "lucide-react";

const EXPLORER_URL = "https://explorer.ab.testnet.adifoundation.ai";

interface TxLinkProps {
  hash: string;
  label?: string;
}

export function TxLink({ hash, label }: TxLinkProps) {
  return (
    <a
      href={`${EXPLORER_URL}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-zeus-gold hover:text-zeus-gold-dark text-sm font-mono"
    >
      {label || `${hash.slice(0, 8)}...${hash.slice(-6)}`}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export function AddressLink({ address, label }: { address: string; label?: string }) {
  return (
    <a
      href={`${EXPLORER_URL}/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-zeus-gold hover:text-zeus-gold-dark text-sm font-mono"
    >
      {label || `${address.slice(0, 6)}...${address.slice(-4)}`}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}
