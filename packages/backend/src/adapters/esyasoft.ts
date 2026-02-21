/**
 * Esyasoft MDM Adapter
 *
 * Maps Esyasoft's Meter Data Management format to Zeus SensorReading format.
 * Esyasoft (Gartner top-10 MDM, 25M+ meters globally) provides:
 * - Smart meter readings (kWh, timestamps, meter ID)
 * - Meter metadata (location, capacity, type)
 * - VEE (Validation, Estimation, Editing) processed data
 *
 * For MVP: mock adapter that generates realistic Esyasoft-format data.
 * Real integration would use their REST API framework.
 */

import { SensorReading } from "../services/attestation";

// Esyasoft MDM data format (simplified)
export interface EsyasoftMeterReading {
  meterId: string;
  timestamp: string; // ISO 8601
  intervalKwh: number;
  cumulativeKwh: number;
  quality: "ACTUAL" | "ESTIMATED" | "SUBSTITUTED";
  meterStatus: "ONLINE" | "OFFLINE" | "MAINTENANCE";
}

export interface EsyasoftMeterInfo {
  meterId: string;
  meterType: "SOLAR_PV" | "WIND_GEN" | "HYDRO_GEN" | "GRID_METER";
  location: { latitude: number; longitude: number };
  ratedCapacityKw: number;
  installDate: string;
  utility: string;
}

// Map Esyasoft meter type to Zeus DeviceType enum
const METER_TYPE_MAP: Record<string, number> = {
  SOLAR_PV: 0,   // SolarArray
  WIND_GEN: 1,   // WindTurbine
  HYDRO_GEN: 2,  // HydroTurbine
  GRID_METER: 3, // SmartMeter
};

// Mapping of Esyasoft meter IDs to Zeus asset IDs
// In production this would be stored in DB
const meterToAssetMap = new Map<string, number>();

export function registerMeterMapping(meterId: string, assetId: number) {
  meterToAssetMap.set(meterId, assetId);
}

export function getAssetIdForMeter(meterId: string): number | undefined {
  return meterToAssetMap.get(meterId);
}

export function getDeviceTypeForMeter(meterType: string): number {
  return METER_TYPE_MAP[meterType] ?? 3; // default to SmartMeter
}

/**
 * Convert Esyasoft meter readings to Zeus SensorReading format
 */
export function convertEsyasoftReadings(readings: EsyasoftMeterReading[]): SensorReading[] {
  return readings.map((r) => ({
    timestamp: Math.floor(new Date(r.timestamp).getTime() / 1000),
    output: r.intervalKwh,
    uptime: r.meterStatus === "ONLINE" && r.quality === "ACTUAL",
  }));
}

/**
 * Generate mock Esyasoft-format readings for demo purposes
 */
export function generateMockEsyasoftReadings(
  meterId: string,
  meterType: string,
  count: number = 10,
  intervalMinutes: number = 15
): EsyasoftMeterReading[] {
  const readings: EsyasoftMeterReading[] = [];
  const now = Date.now();
  let cumulative = 10000 + Math.random() * 50000; // starting cumulative

  for (let i = 0; i < count; i++) {
    const ts = new Date(now - (count - i) * intervalMinutes * 60 * 1000);
    const hour = ts.getUTCHours();

    let intervalKwh: number;
    switch (meterType) {
      case "SOLAR_PV": {
        const localHour = (hour + 4) % 24; // Gulf UTC+4
        intervalKwh = localHour >= 6 && localHour <= 18
          ? Math.sin(((localHour - 6) / 12) * Math.PI) * 20 * (0.9 + Math.random() * 0.2)
          : 0;
        break;
      }
      case "WIND_GEN":
        intervalKwh = Math.random() * 35 * (0.7 + Math.random() * 0.6);
        break;
      case "HYDRO_GEN":
        intervalKwh = 40 + Math.random() * 20;
        break;
      default:
        intervalKwh = 50 + Math.random() * 100;
    }

    intervalKwh = Math.round(intervalKwh * 100) / 100;
    cumulative += intervalKwh;

    readings.push({
      meterId,
      timestamp: ts.toISOString(),
      intervalKwh,
      cumulativeKwh: Math.round(cumulative * 100) / 100,
      quality: Math.random() > 0.02 ? "ACTUAL" : "ESTIMATED",
      meterStatus: Math.random() > 0.03 ? "ONLINE" : "OFFLINE",
    });
  }

  return readings;
}
