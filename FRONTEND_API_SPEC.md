# Zeus Backend API Spec — Frontend Developer Reference

**Base URL**: `http://localhost:3001/api` (dev) / `https://api.zeus.energy/api` (prod)

All responses are JSON. Pagination uses `?page=1&limit=20` query params.

---

## 1. GET `/api/assets`

List all registered energy assets with optional filters.

**Query params**: `?type=0&region=MENA-UAE&page=1&limit=20`
- `type` — DeviceType enum (0=SolarArray, 1=WindTurbine, 2=HydroTurbine, 3=SmartMeter)
- `region` — filter by region string
- `page` / `limit` — pagination

**Response**:
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
      "registeredAt": 1708400000,
      "totalBatches": 142,
      "latestBatchId": 567,
      "capacityFactor": 23.5,
      "totalGenerationKwh": 34200
    }
  ],
  "total": 48,
  "page": 1,
  "limit": 20
}
```

---

## 2. GET `/api/assets/:id`

Single asset with SLA score and latest batch info.

**Response**:
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
  "minOutput": 0,
  "maxOutput": 100,
  "samplingRateSeconds": 30,
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

## 3. GET `/api/assets/:id/batches`

Paginated batch history for an asset.

**Query params**: `?page=1&limit=20`

**Response**:
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

## 4. GET `/api/batches`

All batches across all assets.

**Query params**: `?page=1&limit=20&deviceId=0`

**Response**:
```json
{
  "batches": [
    {
      "batchId": 567,
      "deviceId": 0,
      "deviceTypeLabel": "Solar Array",
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
  "total": 2340,
  "page": 1,
  "limit": 20
}
```

---

## 5. GET `/api/batches/:id`

Single batch with full details.

**Response**:
```json
{
  "batchId": 567,
  "deviceId": 0,
  "deviceTypeLabel": "Solar Array",
  "windowStart": 1708486100,
  "windowEnd": 1708486400,
  "dataRoot": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "ipfsCid": "QmX7k2nR4j5m8pQ3vL9wK6xY1zA2bC3dE4fG5hI6jK7lM8",
  "avgOutput": 52,
  "uptimeBps": 9500,
  "uptimePercent": 95.0,
  "submitter": "0x1234...abcd",
  "submittedAt": 1708486410,
  "txHash": "0xabc123...",
  "blockNumber": 12345,
  "disputed": false,
  "disputeReason": null,
  "readingCount": 10
}
```

---

## 6. POST `/api/batches/:id/verify`

Verify a specific reading against a batch's Merkle root. This is the core verification feature.

**Request body**:
```json
{
  "timestamp": 1708486200,
  "output": 5200,
  "uptime": true
}
```

**Response (verified)**:
```json
{
  "verified": true,
  "batchId": 567,
  "dataRoot": "0xabcdef...",
  "proof": [
    "0x1111111111111111111111111111111111111111111111111111111111111111",
    "0x2222222222222222222222222222222222222222222222222222222222222222",
    "0x3333333333333333333333333333333333333333333333333333333333333333"
  ],
  "leaf": {
    "timestamp": 1708486200,
    "output": 5200,
    "uptime": true
  },
  "onChainVerified": true
}
```

**Response (not found / invalid)**:
```json
{
  "verified": false,
  "batchId": 567,
  "error": "Reading not found in batch Merkle tree"
}
```

---

## 7. GET `/api/map/assets`

All assets with coordinates and latest generation — optimized for map rendering.

**Response**:
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
    },
    {
      "id": 1,
      "deviceType": 1,
      "deviceTypeLabel": "Wind Turbine",
      "status": 1,
      "statusLabel": "Active",
      "latitude": 25.0657,
      "longitude": 55.1713,
      "capacityKw": 200,
      "region": "MENA-UAE",
      "operator": "0x1234...abcd",
      "latestGeneration": {
        "avgOutput": 78,
        "uptimePercent": 93.2,
        "capacityFactor": 18.7,
        "lastUpdated": 1708486390
      }
    }
  ]
}
```

---

## 8. GET `/api/stats`

Network-wide stats for dashboard header.

**Response**:
```json
{
  "totalAssets": 48,
  "activeAssets": 45,
  "totalBatches": 2340,
  "totalGenerationKwh": 1250000,
  "avgCapacityFactor": 22.1,
  "avgUptime": 96.3,
  "disputedBatches": 2,
  "assetsByType": {
    "SolarArray": 20,
    "WindTurbine": 12,
    "HydroTurbine": 8,
    "SmartMeter": 8
  },
  "last24h": {
    "batchesSubmitted": 192,
    "generationKwh": 52000,
    "verificationsPerformed": 15
  }
}
```

---

## 9. GET `/api/compliance/:assetId/report`

Compliance report for an asset over a date range.

**Query params**: `?from=1706745600&to=1708473600` (unix timestamps)

**Response**:
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

## 10. POST `/api/ingest/readings`

Ingest raw readings from external source (Esyasoft, simulator, etc). Not typically called by frontend.

**Request body**:
```json
{
  "deviceId": 0,
  "source": "simulator",
  "readings": [
    { "timestamp": 1708486200, "output": 52.3, "uptime": true },
    { "timestamp": 1708486230, "output": 51.8, "uptime": true },
    { "timestamp": 1708486260, "output": 53.1, "uptime": true }
  ]
}
```

**Response**:
```json
{
  "accepted": true,
  "deviceId": 0,
  "readingsReceived": 3,
  "batchId": 568,
  "dataRoot": "0xabcdef...",
  "ipfsCid": "QmNewBatch...",
  "txHash": "0xdef456..."
}
```

---

## Enums Reference

### DeviceType
| Value | Label |
|-------|-------|
| 0 | Solar Array |
| 1 | Wind Turbine |
| 2 | Hydro Turbine |
| 3 | Smart Meter |

### DeviceStatus
| Value | Label |
|-------|-------|
| 0 | Pending |
| 1 | Active |
| 2 | Suspended |
| 3 | Decommissioned |

### Verification Status (for map markers)
- **green** — Active, batch submitted in last hour
- **amber** — Active, last batch > 1 hour ago
- **red** — Suspended or Decommissioned

---

## Error Format

All errors return:
```json
{
  "error": "Human-readable error message",
  "code": "ASSET_NOT_FOUND"
}
```

Common HTTP status codes: `400` (bad request), `404` (not found), `500` (server error)

---

## CORS

Dev: `http://localhost:3000` allowed
Prod: configured via `CORS_ORIGIN` env var

## Chain Info

- **Chain**: ADI Testnet (Chain ID 99999)
- **RPC**: `https://rpc.ab.testnet.adifoundation.ai/`
- **Contracts**: Addresses provided via env vars / config endpoint
