import { SensorReading } from "./solar";

export function generateTransformerReadings(count: number, intervalSeconds: number): SensorReading[] {
  const readings: SensorReading[] = [];
  const now = Math.floor(Date.now() / 1000);

  for (let i = 0; i < count; i++) {
    const ts = now - (count - i) * intervalSeconds;
    const date = new Date(ts * 1000);
    const localHour = (date.getUTCHours() + 4) % 24;

    // Transformer load follows power meter pattern but at higher scale
    let loadPercent = 50; // base 50% load

    // Peak hours increase
    if (localHour >= 8 && localHour <= 20) {
      loadPercent += 30 * Math.sin(((localHour - 8) / 12) * Math.PI);
    }

    // Temperature impact on health (higher temp = lower efficiency)
    const ambientTemp = 30 + 15 * Math.sin(((localHour - 6) / 12) * Math.PI); // 30-45°C Gulf
    const tempFactor = Math.max(0.8, 1 - (ambientTemp - 35) * 0.01);

    // Output = load * capacity * temp factor
    const output = Math.round(loadPercent * 10 * tempFactor * (0.95 + Math.random() * 0.1)) / 100;

    // 98% uptime (transformers are reliable)
    const uptime = Math.random() > 0.02;

    readings.push({ timestamp: ts, output: Math.max(0, output), uptime });
  }

  return readings;
}
