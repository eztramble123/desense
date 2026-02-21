export interface SensorReading {
  timestamp: number;
  output: number;
  uptime: boolean;
}

const WINDOW_START = 1740441600; // 2025-02-25 00:00:00 UTC
const INTERVAL = 1800; // 30 minutes

const SEED = [0.82, 0.17, 0.55, 0.91, 0.33, 0.78, 0.44, 0.66, 0.29, 0.95,
              0.11, 0.73, 0.88, 0.42, 0.61, 0.37, 0.99, 0.24, 0.56, 0.83,
              0.14, 0.70, 0.48, 0.92, 0.35, 0.67, 0.22, 0.79, 0.53, 0.41,
              0.86, 0.19, 0.74, 0.62, 0.08, 0.97, 0.31, 0.58, 0.85, 0.26,
              0.72, 0.49, 0.93, 0.16, 0.64, 0.38, 0.77, 0.05];

function buildReadings(): SensorReading[] {
  return SEED.map((r, i) => {
    const ts = WINDOW_START + i * INTERVAL;
    const localHour = (new Date(ts * 1000).getUTCHours() + 4) % 24;
    let base = 0;
    if (localHour >= 6 && localHour <= 18) {
      base = Math.sin(((localHour - 6) / 12) * Math.PI) * 85;
    }
    const output = Math.round(Math.max(0, base * (0.90 + r * 0.15)) * 100) / 100;
    return { timestamp: ts, output, uptime: r > 0.03 };
  });
}

export const SAMPLE_READINGS: SensorReading[] = buildReadings();

const uptimeCount = SAMPLE_READINGS.filter((r) => r.uptime).length;
const outputs = SAMPLE_READINGS.map((r) => r.output);
const activeOutputs = SAMPLE_READINGS.filter((r) => r.uptime).map((r) => r.output);

export const SAMPLE_META = {
  deviceId: "ZEUS-SOLAR-0x4A2B",
  deviceType: "Rooftop Solar Array",
  windowStart: WINDOW_START,
  windowEnd: WINDOW_START + 48 * INTERVAL,
  avgOutput: Math.round((outputs.reduce((s, v) => s + v, 0) / 48) * 100) / 100,
  uptimeBps: Math.round((uptimeCount / 48) * 10000),
  peakOutput: Math.max(...outputs),
  minOutput: Math.min(...activeOutputs),
};
