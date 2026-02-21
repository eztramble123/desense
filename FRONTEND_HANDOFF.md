# Zeus Backend — Frontend Developer Handoff

## What is Zeus?

Zeus is an energy verification platform. Energy data comes in from sources (solar panels, wind turbines, smart meters) → backend Merkle-hashes and attests that data on-chain → dashboard shows verified assets on a map with real-time stats → compliance reports generated from verified data.

**Your job**: Build the dashboard UI that consumes this backend API.

---

## Quick Start

```bash
# Backend runs on port 3001
cd packages/backend
cp .env.example .env  # fill in contract addresses + private key
pnpm install
pnpm dev

# Health check
curl http://localhost:3001/api/health
```

**Base URL**: `http://localhost:3001/api`

---

## Architecture (what talks to what)

```
Energy Sources (simulator, Esyasoft)
        ↓ POST /api/ingest/readings
   [Zeus Backend :3001]
        ↓ writes to chain + SQLite
   [ADI Testnet + SQLite cache]
        ↑ reads from cache
   [Frontend :3000]  ← YOU ARE HERE
```

**Important**: Frontend reads from backend API for all data display. Frontend still talks directly to chain (via wagmi) for **write** operations like registering assets, creating orders, etc.

---

## Pages to Build

### 1. Dashboard (`/`)
**Data source**: `GET /api/stats` + `GET /api/batches?limit=5`

Show network-wide stats at the top:
- Total assets, active assets
- Total batches submitted
- Total generation (kWh)
- Average uptime %
- Assets by type (pie/bar chart)

Below that: recent batch activity feed.

### 2. Assets List (`/assets`)
**Data source**: `GET /api/assets?page=1&limit=20&type=0&region=MENA-UAE`

Filterable/paginated table of all registered energy assets.

Columns: ID, Type (with icon), Status (badge), Location, Region, Capacity (kW), Operator (truncated address), Registered date.

Click row → asset detail page.

### 3. Asset Detail (`/assets/:id`)
**Data source**: `GET /api/assets/:id` + `GET /api/assets/:id/batches?page=1&limit=20`

Top section: asset metadata, SLA score (uptime %, avg output, freshness penalties).

Below: paginated batch history table + compliance report link.

### 4. Asset Map (`/map`)
**Data source**: `GET /api/map/assets`

Interactive map (Leaflet or Mapbox GL) showing all assets at their lat/lng.

Marker colors based on status:
- **Green**: Active, batch submitted in last hour
- **Amber**: Active, last batch > 1 hour ago
- **Red**: Suspended or Decommissioned
- **Gray**: No batches yet

Click marker → popup with: asset name, type icon, latest generation, capacity factor, link to detail page.

### 5. Batch Detail (`/batches/:id`)
**Data source**: `GET /api/batches/:id`

Show all batch metadata. Include a "Verify Reading" form that calls `POST /api/batches/:id/verify`.

### 6. Compliance Report (`/compliance/:assetId`)
**Data source**: `GET /api/compliance/:assetId/report?from=TIMESTAMP&to=TIMESTAMP`

Date range picker at top. Renders the compliance report as a printable/downloadable page. Key sections: generation summary, capacity factor, uptime, freshness score, REC eligibility, on-chain attestation proof.

---

## API Endpoints Reference

### GET `/api/stats`
Network totals for dashboard header.

```json
{
  "totalAssets": 48,
  "activeAssets": 45,
  "totalBatches": 2340,
  "totalGenerationKwh": 1250000,
  "avgUptime": 96.3,
  "disputedBatches": 2,
  "assetsByType": {
    "Solar Array": 20,
    "Wind Turbine": 12,
    "Hydro Turbine": 8,
    "Smart Meter": 8
  },
  "last24h": {
    "batchesSubmitted": 192,
    "generationKwh": 52000
  }
}
```

---

### GET `/api/assets`
**Query**: `?type=0&region=MENA-UAE&page=1&limit=20`

```json
{
  "assets": [
    {
      "id": 0,
      "deviceType": 0,
      "deviceTypeLabel": "Solar Array",
      "status": 1,
      "statusLabel": "Active",
      "location": "Dubai Solar Park, Block A",
      "region": "MENA-UAE",
      "latitude": 25.2048,
      "longitude": 55.2708,
      "capacity": 100000,
      "capacityKw": 100,
      "minOutput": 0,
      "maxOutput": 100,
      "samplingRateSeconds": 30,
      "operator": "0x1234...abcd",
      "registeredAt": 1708400000
    }
  ],
  "total": 48,
  "page": 1,
  "limit": 20
}
```

---

### GET `/api/assets/:id`
Single asset with SLA + latest batch.

```json
{
  "id": 0,
  "deviceType": 0,
  "deviceTypeLabel": "Solar Array",
  "status": 1,
  "statusLabel": "Active",
  "location": "Dubai Solar Park, Block A",
  "region": "MENA-UAE",
  "latitude": 25.2048,
  "longitude": 55.2708,
  "capacity": 100000,
  "capacityKw": 100,
  "operator": "0x1234...abcd",
  "registeredAt": 1708400000,
  "sla": {
    "totalBatches": 142,
    "avgUptime": 95.3,
    "avgOutput": 48.2,
    "freshnessPenalties": 3,
    "lastSubmission": 1708486400
  },
  "latestBatch": {
    "batchId": 567,
    "windowStart": 1708486100,
    "windowEnd": 1708486400,
    "avgOutput": 52,
    "uptimeBps": 9500,
    "uptimePercent": 95.0,
    "ipfsCid": "QmX7k2n...",
    "submittedAt": 1708486410,
    "txHash": "0xabc123..."
  }
}
```

---

### GET `/api/assets/:id/batches`
**Query**: `?page=1&limit=20`

```json
{
  "assetId": 0,
  "batches": [
    {
      "batchId": 567,
      "windowStart": 1708486100,
      "windowEnd": 1708486400,
      "dataRoot": "0xabcdef...",
      "ipfsCid": "QmX7k2n...",
      "avgOutput": 52,
      "uptimeBps": 9500,
      "uptimePercent": 95.0,
      "submitter": "0x1234...abcd",
      "submittedAt": 1708486410,
      "txHash": "0xabc123...",
      "blockNumber": 12345,
      "disputed": false
    }
  ],
  "total": 142,
  "page": 1,
  "limit": 20
}
```

---

### GET `/api/batches`
**Query**: `?page=1&limit=20&deviceId=0`

Same shape as above but with `deviceId` on each batch and no `assetId` wrapper.

---

### GET `/api/batches/:id`

```json
{
  "batchId": 567,
  "deviceId": 0,
  "windowStart": 1708486100,
  "windowEnd": 1708486400,
  "dataRoot": "0xabcdef...",
  "ipfsCid": "QmX7k2n...",
  "avgOutput": 52,
  "uptimeBps": 9500,
  "uptimePercent": 95.0,
  "submitter": "0x1234...abcd",
  "submittedAt": 1708486410,
  "txHash": "0xabc123...",
  "blockNumber": 12345,
  "disputed": false,
  "disputeReason": null
}
```

---

### POST `/api/batches/:id/verify`
Core verification feature. User submits a reading, backend checks Merkle proof.

**Request**:
```json
{
  "timestamp": 1708486200,
  "output": 5200,
  "uptime": true
}
```

**Response (valid)**:
```json
{
  "verified": true,
  "batchId": 567,
  "dataRoot": "0xabcdef...",
  "proof": ["0x111...", "0x222...", "0x333..."],
  "leaf": { "timestamp": 1708486200, "output": 5200, "uptime": true },
  "onChainVerified": true
}
```

**Response (invalid)**:
```json
{
  "verified": false,
  "batchId": 567,
  "error": "Reading not found in batch Merkle tree"
}
```

---

### GET `/api/map/assets`
Optimized for map rendering. No pagination — returns all assets.

```json
{
  "assets": [
    {
      "id": 0,
      "deviceType": 0,
      "deviceTypeLabel": "Solar Array",
      "status": 1,
      "statusLabel": "Active",
      "latitude": 25.2048,
      "longitude": 55.2708,
      "capacityKw": 100,
      "region": "MENA-UAE",
      "operator": "0x1234...abcd",
      "latestGeneration": {
        "avgOutput": 52,
        "uptimePercent": 95.0,
        "capacityFactor": 23.5,
        "lastUpdated": 1708486410
      }
    }
  ]
}
```

`latestGeneration` is `null` if no batches exist for that asset yet.

---

### GET `/api/compliance/:assetId/report`
**Query**: `?from=1706745600&to=1708473600` (unix timestamps, defaults to last 30 days)

```json
{
  "assetId": 0,
  "deviceType": 0,
  "deviceTypeLabel": "Solar Array",
  "region": "MENA-UAE",
  "operator": "0x1234...abcd",
  "period": {
    "from": 1706745600,
    "to": 1708473600,
    "days": 20
  },
  "generation": {
    "totalKwh": 34200,
    "dailyAvgKwh": 1710,
    "peakDayKwh": 2100,
    "minDayKwh": 800
  },
  "performance": {
    "capacityFactor": 23.5,
    "avgUptime": 95.3,
    "avgUptimeBps": 9530,
    "totalBatches": 142,
    "freshnessPenalties": 3,
    "freshnessScore": 97.9,
    "disputedBatches": 0
  },
  "verification": {
    "totalReadings": 1420,
    "verifiedReadings": 85,
    "verificationRate": 5.9
  },
  "recs": {
    "eligibleMwh": 34.2,
    "recCount": 34,
    "note": "1 REC = 1 MWh verified renewable generation"
  },
  "attestations": {
    "onChainBatches": 142,
    "contractAddress": "0x5678...efgh",
    "chainId": 99999,
    "chainName": "ADI Testnet"
  }
}
```

---

### POST `/api/ingest/readings`
**Not for frontend** — used by simulator/Esyasoft. Listed for completeness.

---

### GET `/api/health`
```json
{ "status": "ok", "chain": 99999, "timestamp": 1708486400000 }
```

---

## Enums (use these for icons, colors, labels)

### DeviceType
| Value | Label | Suggested Icon |
|-------|-------|----------------|
| 0 | Solar Array | sun |
| 1 | Wind Turbine | wind |
| 2 | Hydro Turbine | droplets |
| 3 | Smart Meter | gauge |

### DeviceStatus
| Value | Label | Badge Color |
|-------|-------|-------------|
| 0 | Pending | gray |
| 1 | Active | green |
| 2 | Suspended | red |
| 3 | Decommissioned | dark gray |

### Map Marker Colors
| Condition | Color |
|-----------|-------|
| Active + batch in last hour | green |
| Active + batch > 1 hour ago | amber |
| Suspended / Decommissioned | red |
| No batches yet | gray |

Logic: check `status` and `latestGeneration.lastUpdated` vs `Date.now()/1000 - 3600`.

---

## Pagination Pattern

All list endpoints use the same pattern:

```
?page=1&limit=20
```

Response always includes:
```json
{
  "items": [...],
  "total": 142,
  "page": 1,
  "limit": 20
}
```

Total pages = `Math.ceil(total / limit)`

---

## Error Format

All errors:
```json
{
  "error": "Human-readable message",
  "code": "ASSET_NOT_FOUND"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request (missing fields) |
| 401 | Invalid API key (if API_KEY env is set) |
| 404 | Resource not found |
| 500 | Server error |

---

## CORS

Backend allows `http://localhost:3000` by default. Configurable via `CORS_ORIGIN` env var.

---

## Design System Reminder

Already in the frontend codebase:
- Font: **Cormorant Garamond** (headlines, uppercase, letter-spaced) + **Inter** (UI)
- Colors: `zeus-gold`, `zeus-stone-*` palette
- CSS classes: `.zeus-heading`, `.zeus-label`, `.zeus-card`, `.zeus-input`, `.zeus-btn-primary`, `.zeus-btn-secondary`, `.zeus-table`
- Aesthetic: Neo-Classical Control Room (dark, gold accents, clean data visualization)

---

## What stays as direct contract calls (wagmi)

These write operations should still go directly to the chain from the frontend:
- **Register Asset** → `DeviceRegistry.registerDevice()`
- **Create Data Order** → `DataMarketplace.createOrder()` (sends ETH escrow)
- **Match Device to Order** → `DataMarketplace.matchDevice()`
- **Cancel Order** → `DataMarketplace.cancelOrder()`
- **Create Financing Trigger** → `FinancingTrigger.createTrigger()` (sends ETH escrow)
- **Grant/Revoke Roles** → `ZeusAccessControl.grant*Role()` / `revoke*Role()`

Contract ABIs will need updating for the new function signatures (especially `registerDevice` which now takes `capacity`, `latitude`, `longitude`).

### Deployed Contract Addresses (ADI Testnet — Chain ID 99999)

```
NEXT_PUBLIC_ACCESS_CONTROL=0x216B8b81FEBeAa1873fB273b06799859B2F443DC
NEXT_PUBLIC_DEVICE_REGISTRY=0x21758BC954072cE6f6Bd299bB99751BdD3BA9f24
NEXT_PUBLIC_DATA_COMMITMENT=0xb006C666a25a7C3B6b3DC3F972D820472Dc98772
NEXT_PUBLIC_DATA_MARKETPLACE=0xDE34e6E4646C26C73Ac3db792Ee652a7E2242dC4
NEXT_PUBLIC_FINANCING_TRIGGER=0x203f6AcD51cf54e29154747b868670E99100eAf2
```

---

## TypeScript Types (copy-paste ready)

```typescript
interface Asset {
  id: number;
  deviceType: number;
  deviceTypeLabel: string;
  status: number;
  statusLabel: string;
  location: string;
  region: string;
  latitude: number;
  longitude: number;
  capacity: number;
  capacityKw: number;
  minOutput: number;
  maxOutput: number;
  samplingRateSeconds: number;
  operator: string;
  registeredAt: number;
}

interface AssetDetail extends Asset {
  sla: {
    totalBatches: number;
    avgUptime: number;
    avgOutput: number;
    freshnessPenalties: number;
    lastSubmission: number;
  };
  latestBatch: Batch | null;
}

interface Batch {
  batchId: number;
  deviceId?: number;
  windowStart: number;
  windowEnd: number;
  dataRoot: string;
  ipfsCid: string;
  avgOutput: number;
  uptimeBps: number;
  uptimePercent: number;
  submitter: string;
  submittedAt: number;
  txHash: string;
  blockNumber: number;
  disputed: boolean;
  disputeReason?: string | null;
}

interface MapAsset {
  id: number;
  deviceType: number;
  deviceTypeLabel: string;
  status: number;
  statusLabel: string;
  latitude: number;
  longitude: number;
  capacityKw: number;
  region: string;
  operator: string;
  latestGeneration: {
    avgOutput: number;
    uptimePercent: number;
    capacityFactor: number;
    lastUpdated: number;
  } | null;
}

interface NetworkStats {
  totalAssets: number;
  activeAssets: number;
  totalBatches: number;
  totalGenerationKwh: number;
  avgUptime: number;
  disputedBatches: number;
  assetsByType: Record<string, number>;
  last24h: {
    batchesSubmitted: number;
    generationKwh: number;
  };
}

interface ComplianceReport {
  assetId: number;
  deviceType: number;
  deviceTypeLabel: string;
  region: string;
  operator: string;
  period: { from: number; to: number; days: number };
  generation: {
    totalKwh: number;
    dailyAvgKwh: number;
    peakDayKwh: number;
    minDayKwh: number;
  };
  performance: {
    capacityFactor: number;
    avgUptime: number;
    avgUptimeBps: number;
    totalBatches: number;
    freshnessPenalties: number;
    freshnessScore: number;
    disputedBatches: number;
  };
  verification: {
    totalReadings: number;
    verifiedReadings: number;
    verificationRate: number;
  };
  recs: {
    eligibleMwh: number;
    recCount: number;
    note: string;
  };
  attestations: {
    onChainBatches: number;
    contractAddress: string;
    chainId: number;
    chainName: string;
  };
}

interface VerificationResult {
  verified: boolean;
  batchId: number;
  dataRoot?: string;
  proof?: string[];
  leaf?: { timestamp: number; output: number; uptime: boolean };
  onChainVerified?: boolean;
  error?: string;
}

interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  [key: string]: T[] | number; // assets, batches, etc.
}

interface ApiError {
  error: string;
  code: string;
}
```
