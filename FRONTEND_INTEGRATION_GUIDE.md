# Zeus Frontend Integration Guide

This doc covers everything you need to connect the frontend to the live backend + on-chain contracts.

**TL;DR**: Read data from the backend API (`localhost:3001`). Write data directly to the chain via wagmi. The backend indexes chain events automatically — so after a write tx confirms, the API will reflect the change within ~10 seconds.

---

## 1. Setup

### Environment Variables

Add to `packages/frontend/.env.local`:

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Mapbox (you already have this)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Wallet Connect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Contract Addresses (ADI Testnet)
NEXT_PUBLIC_ACCESS_CONTROL=0x332BD263454Ae041aCE6c7aB783ccdac4D63A460
NEXT_PUBLIC_DEVICE_REGISTRY=0xA1A3Fdd59489Faf52EE354e28bBcF09152f89a8C
NEXT_PUBLIC_DATA_COMMITMENT=0xCde9ea3Af1323379448160286Fb22E580a59DacE
NEXT_PUBLIC_DATA_MARKETPLACE=0xf6c548616c6e62fc29dE2dC8ebc6D68611d30264
NEXT_PUBLIC_FINANCING_TRIGGER=0x4d4461Bd6AFcE8bE67d3E1b63f4BAf42Aa2c2f9F
```

### Start the Backend

```bash
cd packages/backend
cp .env.example .env   # addresses are already filled in
pnpm install
pnpm dev               # runs on :3001

# Verify
curl http://localhost:3001/api/health
# → {"status":"ok","chain":99999,"timestamp":...}
```

The backend has 4 demo assets + 30 batches already seeded on ADI Testnet. You'll see data immediately.

---

## 2. Wagmi + Wallet Setup

You have wagmi and viem installed but not configured. Here's what to create:

### `app/lib/wagmi.ts`

```typescript
import { http, createConfig } from "wagmi";
import { defineChain } from "viem";
import { walletConnect, injected } from "wagmi/connectors";

export const adiTestnet = defineChain({
  id: 99999,
  name: "ADI Testnet",
  nativeCurrency: { name: "ADI", symbol: "ADI", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.ab.testnet.adifoundation.ai/"] },
  },
  blockExplorers: {
    default: { name: "ADI Explorer", url: "https://explorer.ab.testnet.adifoundation.ai" },
  },
  testnet: true,
});

export const config = createConfig({
  chains: [adiTestnet],
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID! }),
  ],
  transports: {
    [adiTestnet.id]: http(),
  },
});
```

### `app/providers.tsx`

```typescript
"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./lib/wagmi";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### Update `app/layout.tsx`

Wrap `{children}` with `<Providers>`:

```tsx
import { Providers } from "./providers";

// ... inside RootLayout:
<body>
  <Providers>
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  </Providers>
</body>
```

---

## 3. API Fetching (Read Data)

Replace all `sample.ts` imports with API calls. Use TanStack Query (already installed).

### `app/lib/api.ts`

```typescript
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function fetchAPI<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// Convenience functions
export const getStats = () => fetchAPI<NetworkStats>("/stats");
export const getAssets = (params?: string) => fetchAPI<{ assets: Asset[]; total: number; page: number; limit: number }>(`/assets${params ? `?${params}` : ""}`);
export const getAsset = (id: number) => fetchAPI<AssetDetail>(`/assets/${id}`);
export const getAssetBatches = (id: number, page = 1) => fetchAPI<{ batches: Batch[]; total: number }>(`/assets/${id}/batches?page=${page}`);
export const getBatches = (params?: string) => fetchAPI<{ batches: Batch[]; total: number }>(`/batches${params ? `?${params}` : ""}`);
export const getMapAssets = () => fetchAPI<{ assets: MapAsset[] }>("/map/assets");
export const getComplianceReport = (assetId: number, from?: number, to?: number) => {
  const params = new URLSearchParams();
  if (from) params.set("from", from.toString());
  if (to) params.set("to", to.toString());
  return fetchAPI<ComplianceReport>(`/compliance/${assetId}/report?${params}`);
};
export const verifyReading = (batchId: number, reading: { timestamp: number; output: number; uptime: boolean }) =>
  fetch(`${API}/batches/${batchId}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reading),
  }).then((r) => r.json() as Promise<VerificationResult>);
```

### Example: Replace sample data in analytics page

```typescript
// Before (mock):
import { SAMPLE_ASSETS, SAMPLE_STATS } from "../data/sample";

// After (live):
import { useQuery } from "@tanstack/react-query";
import { getStats, getMapAssets } from "../lib/api";

export default function AnalyticsPage() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: getStats, refetchInterval: 10_000 });
  const { data: mapData } = useQuery({ queryKey: ["map"], queryFn: getMapAssets, refetchInterval: 30_000 });

  if (!stats || !mapData) return <Loading />;
  // ... use stats and mapData.assets instead of SAMPLE_STATS and SAMPLE_ASSETS
}
```

---

## 4. Contract ABIs (Write Operations)

These are the ABIs you need for wagmi `useWriteContract` / `useReadContract` calls.

### `app/lib/contracts.ts`

```typescript
import { parseEther } from "viem";

// Addresses from env
export const CONTRACTS = {
  accessControl: process.env.NEXT_PUBLIC_ACCESS_CONTROL as `0x${string}`,
  deviceRegistry: process.env.NEXT_PUBLIC_DEVICE_REGISTRY as `0x${string}`,
  dataCommitment: process.env.NEXT_PUBLIC_DATA_COMMITMENT as `0x${string}`,
  dataMarketplace: process.env.NEXT_PUBLIC_DATA_MARKETPLACE as `0x${string}`,
  financingTrigger: process.env.NEXT_PUBLIC_FINANCING_TRIGGER as `0x${string}`,
};

// ===== ZeusAccessControl ABI =====
export const accessControlABI = [
  // Write
  { name: "grantOperatorRole", type: "function", stateMutability: "nonpayable", inputs: [{ name: "account", type: "address" }], outputs: [] },
  { name: "grantBuyerRole", type: "function", stateMutability: "nonpayable", inputs: [{ name: "account", type: "address" }], outputs: [] },
  { name: "grantAuditorRole", type: "function", stateMutability: "nonpayable", inputs: [{ name: "account", type: "address" }], outputs: [] },
  { name: "revokeOperatorRole", type: "function", stateMutability: "nonpayable", inputs: [{ name: "account", type: "address" }], outputs: [] },
  { name: "revokeBuyerRole", type: "function", stateMutability: "nonpayable", inputs: [{ name: "account", type: "address" }], outputs: [] },
  { name: "revokeAuditorRole", type: "function", stateMutability: "nonpayable", inputs: [{ name: "account", type: "address" }], outputs: [] },
  // Read
  { name: "isAdmin", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "bool" }] },
  { name: "isOperator", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "bool" }] },
  { name: "isBuyer", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "bool" }] },
  { name: "isAuditor", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "bool" }] },
] as const;

// ===== DeviceRegistry ABI =====
export const deviceRegistryABI = [
  // Write
  {
    name: "registerDevice",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "deviceType", type: "uint8" },      // 0=Solar, 1=Wind, 2=Hydro, 3=SmartMeter
      { name: "location", type: "string" },         // "Dubai Solar Park, Block A"
      { name: "region", type: "string" },            // "MENA-UAE"
      { name: "minOutput", type: "uint256" },        // min generation (kWh)
      { name: "maxOutput", type: "uint256" },        // max generation (kWh)
      { name: "samplingRateSeconds", type: "uint256" }, // data reporting interval
      { name: "capacity", type: "uint256" },         // rated capacity in WATTS
      { name: "latitude", type: "int256" },          // lat * 1e6 (e.g. 25204800 = 25.2048)
      { name: "longitude", type: "int256" },         // lng * 1e6 (e.g. 55270800 = 55.2708)
    ],
    outputs: [{ name: "deviceId", type: "uint256" }],
  },
  {
    name: "setDeviceStatus",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "deviceId", type: "uint256" },
      { name: "newStatus", type: "uint8" },  // 0=Pending, 1=Active, 2=Suspended, 3=Decommissioned
    ],
    outputs: [],
  },
  // Read
  { name: "totalDevices", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    name: "getDevice",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "deviceId", type: "uint256" }],
    outputs: [{
      type: "tuple",
      components: [
        { name: "operator", type: "address" },
        { name: "deviceType", type: "uint8" },
        { name: "location", type: "string" },
        { name: "region", type: "string" },
        { name: "status", type: "uint8" },
        { name: "minOutput", type: "uint256" },
        { name: "maxOutput", type: "uint256" },
        { name: "samplingRateSeconds", type: "uint256" },
        { name: "registeredAt", type: "uint256" },
        { name: "capacity", type: "uint256" },
        { name: "latitude", type: "int256" },
        { name: "longitude", type: "int256" },
      ],
    }],
  },
  // Events
  { name: "DeviceRegistered", type: "event", inputs: [
    { name: "deviceId", type: "uint256", indexed: true },
    { name: "operator", type: "address", indexed: true },
    { name: "deviceType", type: "uint8", indexed: false },
    { name: "region", type: "string", indexed: false },
  ]},
  { name: "DeviceStatusChanged", type: "event", inputs: [
    { name: "deviceId", type: "uint256", indexed: true },
    { name: "oldStatus", type: "uint8", indexed: false },
    { name: "newStatus", type: "uint8", indexed: false },
  ]},
] as const;

// ===== DataMarketplace ABI =====
export const dataMarketplaceABI = [
  // Write
  {
    name: "createOrder",
    type: "function",
    stateMutability: "payable",  // sends ADI as escrow
    inputs: [
      { name: "deviceType", type: "uint8" },     // 0=Solar, 1=Wind, 2=Hydro, 3=SmartMeter
      { name: "region", type: "string" },          // must match device region
      { name: "minUptimeBps", type: "uint256" },   // 0-10000 (8000 = 80%)
      { name: "minAvgOutput", type: "uint256" },   // min kWh per batch
      { name: "duration", type: "uint256" },        // seconds (86400*30 = 30 days)
      { name: "pricePerBatch", type: "uint256" },   // ADI in wei per qualifying batch
    ],
    outputs: [{ name: "orderId", type: "uint256" }],
  },
  {
    name: "matchDevice",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "orderId", type: "uint256" },
      { name: "deviceId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "cancelOrder",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "orderId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "settleBatch",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "orderId", type: "uint256" },
      { name: "batchId", type: "uint256" },
    ],
    outputs: [],
  },
  // Read
  { name: "totalOrders", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    name: "getOrder",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "orderId", type: "uint256" }],
    outputs: [{
      type: "tuple",
      components: [
        { name: "buyer", type: "address" },
        { name: "deviceType", type: "uint8" },
        { name: "region", type: "string" },
        { name: "minUptimeBps", type: "uint256" },
        { name: "minAvgOutput", type: "uint256" },
        { name: "createdAt", type: "uint256" },
        { name: "expiresAt", type: "uint256" },
        { name: "pricePerBatch", type: "uint256" },
        { name: "totalEscrow", type: "uint256" },
        { name: "remainingEscrow", type: "uint256" },
        { name: "status", type: "uint8" },
      ],
    }],
  },
  // Events
  { name: "OrderCreated", type: "event", inputs: [
    { name: "orderId", type: "uint256", indexed: true },
    { name: "buyer", type: "address", indexed: true },
    { name: "escrow", type: "uint256", indexed: false },
  ]},
] as const;

// ===== FinancingTrigger ABI =====
export const financingTriggerABI = [
  // Write
  {
    name: "createTrigger",
    type: "function",
    stateMutability: "payable",  // sends ADI as payout escrow
    inputs: [
      { name: "beneficiary", type: "address" },    // who gets paid when trigger fires
      { name: "deviceId", type: "uint256" },         // asset to monitor
      { name: "triggerType", type: "uint8" },        // 0=OutputAbove, 1=OutputBelow, 2=UptimeAbove, 3=UptimeBelow
      { name: "threshold", type: "uint256" },        // kWh or bps threshold
      { name: "observationPeriod", type: "uint256" },// seconds
      { name: "requiredStreak", type: "uint256" },   // consecutive qualifying batches
    ],
    outputs: [{ name: "triggerId", type: "uint256" }],
  },
  {
    name: "evaluate",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "triggerId", type: "uint256" },
      { name: "batchId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "cancelTrigger",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "triggerId", type: "uint256" }],
    outputs: [],
  },
  // Read
  { name: "totalTriggers", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    name: "getTrigger",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "triggerId", type: "uint256" }],
    outputs: [{
      type: "tuple",
      components: [
        { name: "creator", type: "address" },
        { name: "beneficiary", type: "address" },
        { name: "deviceId", type: "uint256" },
        { name: "triggerType", type: "uint8" },
        { name: "threshold", type: "uint256" },
        { name: "payout", type: "uint256" },
        { name: "observationStart", type: "uint256" },
        { name: "observationEnd", type: "uint256" },
        { name: "requiredStreak", type: "uint256" },
        { name: "currentStreak", type: "uint256" },
        { name: "lastEvaluatedBatch", type: "uint256" },
        { name: "status", type: "uint8" },
      ],
    }],
  },
  // Events
  { name: "TriggerCreated", type: "event", inputs: [
    { name: "triggerId", type: "uint256", indexed: true },
    { name: "creator", type: "address", indexed: true },
    { name: "deviceId", type: "uint256", indexed: true },
    { name: "payout", type: "uint256", indexed: false },
  ]},
  { name: "TriggerActivated", type: "event", inputs: [
    { name: "triggerId", type: "uint256", indexed: true },
    { name: "beneficiary", type: "address", indexed: true },
    { name: "payout", type: "uint256", indexed: false },
  ]},
] as const;
```

---

## 5. Pages to Build / Update

### What you have now → What to change

| Current Page | Change |
|---|---|
| `/data` (sample viewer) | Replace with `/assets` — paginated asset list from `GET /api/assets` |
| `/analytics` (mock data) | Wire to `GET /api/stats` + `GET /api/map/assets` — delete sample.ts imports |

### New pages to add

| Page | Data Source | Purpose |
|---|---|---|
| `/assets/:id` | `GET /api/assets/:id` + `GET /api/assets/:id/batches` | Asset detail with SLA, batch history |
| `/batches/:id` | `GET /api/batches/:id` | Batch detail + verify reading form |
| `/compliance/:id` | `GET /api/compliance/:id/report` | Compliance report (printable) |
| `/register` | wagmi `writeContract` → DeviceRegistry | Register new asset form |
| `/orders` | wagmi `readContract` → DataMarketplace | List/create data orders |
| `/orders/create` | wagmi `writeContract` → DataMarketplace | Create order form (payable) |
| `/triggers` | wagmi `readContract` → FinancingTrigger | List/create financing triggers |
| `/admin` | wagmi `writeContract` → ZeusAccessControl | Grant/revoke roles (admin only) |

### Sidebar nav to add

```
Analytics        (existing)
Assets           (rename from "Sample Data", link to /assets)
Asset Map        (existing map component, link to /map or keep in analytics)
Orders           (/orders)
Triggers         (/triggers)
Compliance       (/compliance)
Register Asset   (/register)
Admin            (/admin, show only if isAdmin)
```

---

## 6. Write Operation Examples

### Register an Asset

```typescript
"use client";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { deviceRegistryABI, CONTRACTS } from "../lib/contracts";

export default function RegisterPage() {
  const { writeContract, data: hash, isPending } = useWriteContract();

  const handleSubmit = (formData: FormData) => {
    const lat = parseFloat(formData.get("latitude") as string);
    const lng = parseFloat(formData.get("longitude") as string);

    writeContract({
      abi: deviceRegistryABI,
      address: CONTRACTS.deviceRegistry,
      functionName: "registerDevice",
      args: [
        Number(formData.get("type")),              // deviceType enum
        formData.get("location") as string,         // "Dubai Solar Park"
        formData.get("region") as string,            // "MENA-UAE"
        BigInt(formData.get("minOutput") as string), // min kWh
        BigInt(formData.get("maxOutput") as string), // max kWh
        BigInt(formData.get("sampling") as string),  // seconds
        BigInt(formData.get("capacity") as string),  // watts
        BigInt(Math.round(lat * 1e6)),               // lat * 1e6
        BigInt(Math.round(lng * 1e6)),               // lng * 1e6
      ],
    });
  };

  // Wait for tx confirmation
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  // After isSuccess, the backend indexer will pick up the DeviceRegistered event
  // within ~10 seconds. Refetch asset list after that.
}
```

### Create a Data Order (payable)

```typescript
import { parseEther } from "viem";
import { dataMarketplaceABI, CONTRACTS } from "../lib/contracts";

// Inside component:
writeContract({
  abi: dataMarketplaceABI,
  address: CONTRACTS.dataMarketplace,
  functionName: "createOrder",
  args: [
    0,                          // deviceType: SolarArray
    "MENA-UAE",                 // region
    BigInt(8000),               // minUptimeBps: 80%
    BigInt(30),                 // minAvgOutput: 30 kWh
    BigInt(86400 * 30),         // duration: 30 days
    parseEther("0.01"),         // pricePerBatch: 0.01 ADI
  ],
  value: parseEther("1"),       // escrow: 1 ADI sent with tx
});
```

### Create a Financing Trigger (payable)

```typescript
import { parseEther } from "viem";
import { financingTriggerABI, CONTRACTS } from "../lib/contracts";

writeContract({
  abi: financingTriggerABI,
  address: CONTRACTS.financingTrigger,
  functionName: "createTrigger",
  args: [
    "0x1234...beneficiary",     // who gets paid
    BigInt(0),                   // deviceId to monitor
    0,                           // triggerType: OutputAbove
    BigInt(40),                  // threshold: 40 kWh
    BigInt(86400 * 7),           // observation: 7 days
    BigInt(3),                   // requiredStreak: 3 consecutive batches
  ],
  value: parseEther("0.5"),     // payout amount escrowed
});
```

### Check User Role (for conditional UI)

```typescript
import { useReadContract, useAccount } from "wagmi";
import { accessControlABI, CONTRACTS } from "../lib/contracts";

function useUserRole() {
  const { address } = useAccount();

  const { data: isAdmin } = useReadContract({
    abi: accessControlABI,
    address: CONTRACTS.accessControl,
    functionName: "isAdmin",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: isOperator } = useReadContract({
    abi: accessControlABI,
    address: CONTRACTS.accessControl,
    functionName: "isOperator",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: isBuyer } = useReadContract({
    abi: accessControlABI,
    address: CONTRACTS.accessControl,
    functionName: "isBuyer",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return { isAdmin: !!isAdmin, isOperator: !!isOperator, isBuyer: !!isBuyer, address };
}
```

Use this to conditionally show pages:
- **Register Asset**: only if `isOperator`
- **Create Order**: only if `isBuyer`
- **Admin panel**: only if `isAdmin`
- **Analytics/Assets/Map/Compliance**: everyone (public read)

---

## 7. Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (:3000)                         │
│                                                              │
│  READ (API fetch)              WRITE (wagmi → chain)         │
│  ─────────────────             ──────────────────────        │
│  GET /api/stats                registerDevice()              │
│  GET /api/assets               createOrder() + ADI           │
│  GET /api/assets/:id           matchDevice()                 │
│  GET /api/assets/:id/batches   cancelOrder()                 │
│  GET /api/batches/:id          createTrigger() + ADI         │
│  GET /api/map/assets           cancelTrigger()               │
│  GET /api/compliance/:id       grantOperatorRole()           │
│  POST /api/batches/:id/verify  setDeviceStatus()             │
│                                                              │
│  After a write tx confirms,    All write txs go directly     │
│  refetch the relevant API      to ADI Testnet (chain 99999)  │
│  endpoint. Backend indexes     via the user's connected      │
│  new events within ~10 sec.    wallet (MetaMask, etc.)       │
└─────────────────────────────────────────────────────────────┘
         │                                │
         ▼                                ▼
   ┌──────────┐                   ┌──────────────┐
   │ Backend  │◄── indexes ──────│  ADI Testnet  │
   │  :3001   │    chain events  │  Chain 99999  │
   └──────────┘                   └──────────────┘
```

---

## 8. Enums Quick Reference

```typescript
// Device Types
const DEVICE_TYPES = { 0: "Solar Array", 1: "Wind Turbine", 2: "Hydro Turbine", 3: "Smart Meter" };
const DEVICE_ICONS = { 0: "sun", 1: "wind", 2: "droplets", 3: "gauge" };

// Device Status
const DEVICE_STATUS = { 0: "Pending", 1: "Active", 2: "Suspended", 3: "Decommissioned" };
const STATUS_COLORS = { 0: "gray", 1: "green", 2: "red", 3: "gray" };

// Order Status
const ORDER_STATUS = { 0: "Open", 1: "Active", 2: "Completed", 3: "Cancelled" };

// Trigger Types
const TRIGGER_TYPES = { 0: "Output Above", 1: "Output Below", 2: "Uptime Above", 3: "Uptime Below" };

// Trigger Status
const TRIGGER_STATUS = { 0: "Active", 1: "Triggered", 2: "Expired", 3: "Cancelled" };

// Map marker colors
function markerColor(asset: MapAsset): string {
  if (asset.status !== 1) return "red";
  if (!asset.latestGeneration) return "gray";
  const hourAgo = Date.now() / 1000 - 3600;
  return asset.latestGeneration.lastUpdated > hourAgo ? "green" : "amber";
}

// Lat/lng conversion for contract calls
function toContractCoord(decimal: number): bigint {
  return BigInt(Math.round(decimal * 1e6)); // 25.2048 → 25204800n
}
function fromContractCoord(fixed: bigint): number {
  return Number(fixed) / 1e6; // 25204800n → 25.2048
}
```

---

## 9. ADI Testnet Wallet Setup

Users need ADI Testnet configured in MetaMask:

| Field | Value |
|---|---|
| Network Name | ADI Testnet |
| RPC URL | `https://rpc.ab.testnet.adifoundation.ai/` |
| Chain ID | 99999 |
| Currency Symbol | ADI |
| Block Explorer | `https://explorer.ab.testnet.adifoundation.ai/` |

Faucet: `https://faucet.ab.testnet.adifoundation.ai/` (may be intermittent)

---

## 10. TypeScript Types

See `FRONTEND_HANDOFF.md` for the full type definitions (Asset, AssetDetail, Batch, MapAsset, NetworkStats, ComplianceReport, VerificationResult). Copy-paste ready.
