import { defineChain } from "viem";

export const adiTestnet = defineChain({
  id: 99999,
  name: "ADI Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "ADI",
    symbol: "ADI",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.ab.testnet.adifoundation.ai/"],
    },
  },
  blockExplorers: {
    default: {
      name: "ADI Explorer",
      url: "https://explorer.ab.testnet.adifoundation.ai",
    },
  },
  testnet: true,
});
