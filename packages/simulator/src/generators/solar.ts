export interface SensorReading {
  timestamp: number;
  output: number; // kWh
  uptime: boolean;
}

export function generateSolarReadings(count: number, intervalSeconds: number): SensorReading[] {
  const readings: SensorReading[] = [];
  const now = Math.floor(Date.now() / 1000);

  for (let i = 0; i < count; i++) {
    const ts = now - (count - i) * intervalSeconds;
    const date = new Date(ts * 1000);
    const hour = date.getUTCHours();

    // Sine curve peaking at noon (UTC+4 for Gulf)
    const localHour = (hour + 4) % 24;
    let base = 0;
    if (localHour >= 6 && localHour <= 18) {
      base = Math.sin(((localHour - 6) / 12) * Math.PI) * 80;
    }

    // Weather noise (-10% to +5%)
    const noise = base * (0.95 + Math.random() * 0.15 - 0.1);
    const output = Math.max(0, Math.round(noise * 100) / 100);

    // 97% uptime
    const uptime = Math.random() > 0.03;

    readings.push({ timestamp: ts, output, uptime });
  }

  return readings;
}
