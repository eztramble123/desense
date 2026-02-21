import { SensorReading } from "./solar";

export function generatePowerMeterReadings(count: number, intervalSeconds: number): SensorReading[] {
  const readings: SensorReading[] = [];
  const now = Math.floor(Date.now() / 1000);

  for (let i = 0; i < count; i++) {
    const ts = now - (count - i) * intervalSeconds;
    const date = new Date(ts * 1000);
    const hour = date.getUTCHours();
    const localHour = (hour + 4) % 24;

    // Base load: 200kW
    let base = 200;

    // Morning peak (8-10am): +150kW
    if (localHour >= 8 && localHour <= 10) {
      base += 150 * Math.sin(((localHour - 8) / 2) * Math.PI);
    }

    // Afternoon peak (14-18): +200kW
    if (localHour >= 14 && localHour <= 18) {
      base += 200 * Math.sin(((localHour - 14) / 4) * Math.PI);
    }

    // Night reduction (22-6): -30%
    if (localHour >= 22 || localHour <= 6) {
      base *= 0.7;
    }

    // Random noise +/- 10%
    const noise = base * (0.9 + Math.random() * 0.2);
    const output = Math.round(noise * 100) / 100;

    // 99% uptime
    const uptime = Math.random() > 0.01;

    readings.push({ timestamp: ts, output, uptime });
  }

  return readings;
}
