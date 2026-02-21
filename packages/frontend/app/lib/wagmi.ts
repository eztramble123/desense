"use client";

import { http, createConfig, createStorage } from "wagmi";
import { injected } from "wagmi/connectors";
import { adiTestnet } from "./chains";

export const config = createConfig({
  chains: [adiTestnet],
  connectors: [injected()],
  transports: {
    [adiTestnet.id]: http(),
  },
  ssr: true,
  storage: createStorage({ storage: typeof window !== "undefined" ? window.localStorage : undefined }),
});
