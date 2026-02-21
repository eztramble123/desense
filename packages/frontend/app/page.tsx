import Link from "next/link";
import { RiFlashlightLine, RiArrowRightLine } from "react-icons/ri";

const DISPLAY_FONT = { fontFamily: "'Barlow Condensed', sans-serif" };

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(37,99,235,0.12) 0%, transparent 70%)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        <div
          className="mb-8 p-4 rounded-2xl border border-[#152046] bg-[#0a1530]"
          style={{ boxShadow: "0 0 40px rgba(37,99,235,0.2)" }}
        >
          <RiFlashlightLine size={36} className="text-[#2563eb]" />
        </div>

        <div className="mb-8 flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#152046] bg-[#0a1530]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50">
            Proof of Generation · ADI Testnet
          </span>
        </div>

        <h1
          className="text-6xl sm:text-7xl font-black uppercase tracking-tight leading-[0.95] text-white mb-6"
          style={DISPLAY_FONT}
        >
          The Verification Layer for Energy Data
        </h1>

        <p className="text-[15px] text-white/40 leading-relaxed mb-10 max-w-md">
          Energy generation attested on-chain. Every reading Merkle-hashed, every batch cryptographically verifiable.
        </p>

        <Link
          href="/analytics"
          className="flex items-center gap-2.5 px-7 py-3 rounded-full border border-[#2563eb]/40 bg-[#2563eb]/10 text-white text-[13px] font-semibold uppercase tracking-widest hover:bg-[#2563eb]/20 transition-colors"
          style={DISPLAY_FONT}
        >
          See a sample
          <RiArrowRightLine size={16} />
        </Link>
      </div>

      <p className="absolute bottom-8 text-[10px] uppercase tracking-wider text-white/20">
        ADI Testnet · Chain 99999 · Zeus v0.1
      </p>
    </div>
  );
}
