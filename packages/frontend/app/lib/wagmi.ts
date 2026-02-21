import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

export const adiTestnet = defineChain({
  id: 99999,
  name: "ADI Testnet",
  nativeCurrency: { name: "ADI", symbol: "ADI", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.ab.testnet.adifoundation.ai/"] },
  },
});

export const wagmiConfig = createConfig({
  chains: [adiTestnet],
  connectors: [injected()],
  transports: { [adiTestnet.id]: http({ timeout: 30_000 }) },
  pollingInterval: 2_000,
  ssr: true,
});
