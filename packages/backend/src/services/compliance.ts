import { getComplianceData } from "../db/queries";
import { fetchSLAFromChain } from "./chain";
import { DEVICE_TYPE_LABELS } from "../config";

export interface ComplianceReport {
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

export async function generateComplianceReport(
  assetId: number,
  from: number,
  to: number
): Promise<ComplianceReport> {
  const { asset, batches, aggregates } = getComplianceData(assetId, from, to);

  if (!asset) {
    throw new Error("Asset not found");
  }

  const days = Math.max(1, Math.round((to - from) / 86400));
  const totalBatches = aggregates.total_batches || 0;
  const totalGeneration = aggregates.total_generation || 0;
  const avgUptimeBps = totalBatches > 0 ? Math.round(aggregates.avg_uptime_bps) : 0;
  const disputedBatches = aggregates.disputed_batches || 0;

  // Capacity factor = (totalGeneration / (ratedCapacity_kW * totalHours)) * 100
  const capacityKw = asset.capacity / 1000;
  const totalHours = days * 24;
  const capacityFactor = capacityKw > 0
    ? Math.round((totalGeneration / (capacityKw * totalHours)) * 10000) / 100
    : 0;

  // Daily generation stats
  const dailyMap = new Map<string, number>();
  for (const batch of batches) {
    const day = new Date(batch.submitted_at * 1000).toISOString().split("T")[0];
    dailyMap.set(day, (dailyMap.get(day) || 0) + batch.avg_output);
  }
  const dailyValues = Array.from(dailyMap.values());
  const peakDayKwh = dailyValues.length > 0 ? Math.max(...dailyValues) : 0;
  const minDayKwh = dailyValues.length > 0 ? Math.min(...dailyValues) : 0;

  // Freshness from chain SLA
  let freshnessPenalties = 0;
  try {
    const sla = await fetchSLAFromChain(assetId);
    freshnessPenalties = sla.freshnessPenalties;
  } catch { /* use 0 if chain unavailable */ }

  const freshnessScore = totalBatches > 0
    ? Math.round(((totalBatches - freshnessPenalties) / totalBatches) * 10000) / 100
    : 100;

  // REC calculation: 1 REC = 1 MWh
  const eligibleMwh = Math.round(totalGeneration / 10) / 100; // round to 2 decimals
  const recCount = Math.floor(eligibleMwh);

  return {
    assetId,
    deviceType: asset.device_type,
    deviceTypeLabel: DEVICE_TYPE_LABELS[asset.device_type] || "Unknown",
    region: asset.region,
    operator: asset.operator,
    period: { from, to, days },
    generation: {
      totalKwh: totalGeneration,
      dailyAvgKwh: Math.round(totalGeneration / days),
      peakDayKwh,
      minDayKwh,
    },
    performance: {
      capacityFactor,
      avgUptime: avgUptimeBps / 100,
      avgUptimeBps,
      totalBatches,
      freshnessPenalties,
      freshnessScore,
      disputedBatches,
    },
    verification: {
      totalReadings: totalBatches * 10, // estimate 10 readings per batch
      verifiedReadings: 0, // would need to track actual verifications
      verificationRate: 0,
    },
    recs: {
      eligibleMwh,
      recCount,
      note: "1 REC = 1 MWh verified renewable generation",
    },
    attestations: {
      onChainBatches: totalBatches - disputedBatches,
      contractAddress: process.env.DATA_COMMITMENT_ADDRESS || process.env.NEXT_PUBLIC_DATA_COMMITMENT || "",
      chainId: 99999,
      chainName: "ADI Testnet",
    },
  };
}
