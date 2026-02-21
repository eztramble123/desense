import { SensorReading } from "../generators";

export interface BatchData {
  deviceId: number;
  windowStart: number;
  windowEnd: number;
  readings: SensorReading[];
  avgOutput: number;
  uptimeBps: number; // basis points 0-10000
}

export function createBatch(deviceId: number, readings: SensorReading[]): BatchData {
  if (readings.length === 0) {
    throw new Error("Cannot create batch from empty readings");
  }

  const windowStart = readings[0].timestamp;
  const windowEnd = readings[readings.length - 1].timestamp;

  const totalOutput = readings.reduce((sum, r) => sum + r.output, 0);
  const avgOutput = Math.round(totalOutput / readings.length);

  const uptimeCount = readings.filter((r) => r.uptime).length;
  const uptimeBps = Math.round((uptimeCount / readings.length) * 10000);

  return {
    deviceId,
    windowStart,
    windowEnd,
    readings,
    avgOutput,
    uptimeBps,
  };
}
