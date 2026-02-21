import { SensorReading } from "./solar";

// Simplified Weibull distribution for wind speed
function weibullRandom(scale: number, shape: number): number {
  const u = Math.random();
  return scale * Math.pow(-Math.log(1 - u), 1 / shape);
}

// Power curve: cut-in at 3m/s, rated at 12m/s, cut-out at 25m/s
function windPower(windSpeed: number, ratedPower: number): number {
  if (windSpeed < 3) return 0;
  if (windSpeed > 25) return 0; // cut-out protection
  if (windSpeed >= 12) return ratedPower;

  // Cubic relationship between cut-in and rated
  const fraction = (windSpeed - 3) / (12 - 3);
  return ratedPower * Math.pow(fraction, 3);
}

export function generateWindReadings(count: number, intervalSeconds: number): SensorReading[] {
  const readings: SensorReading[] = [];
  const now = Math.floor(Date.now() / 1000);

  // Gulf region: moderate winds, scale ~6m/s, shape ~2 (Rayleigh)
  const scale = 6;
  const shape = 2;
  const ratedPower = 150; // kW

  for (let i = 0; i < count; i++) {
    const ts = now - (count - i) * intervalSeconds;

    const windSpeed = weibullRandom(scale, shape);
    const output = Math.round(windPower(windSpeed, ratedPower) * 100) / 100;

    // 95% uptime (more maintenance than solar)
    const uptime = Math.random() > 0.05;

    readings.push({ timestamp: ts, output, uptime });
  }

  return readings;
}
