export { generateSolarReadings, SensorReading } from "./solar";
export { generatePowerMeterReadings } from "./powerMeter";
export { generateTransformerReadings } from "./transformer";
export { generateWindReadings } from "./wind";

import { generateSolarReadings } from "./solar";
import { generatePowerMeterReadings } from "./powerMeter";
import { generateTransformerReadings } from "./transformer";
import { generateWindReadings } from "./wind";
import { SensorReading } from "./solar";

// DeviceType enum matches contract: 0=SolarArray, 1=WindTurbine, 2=HydroTurbine, 3=SmartMeter
export function generateReadings(deviceType: number, count: number, intervalSeconds: number): SensorReading[] {
  switch (deviceType) {
    case 0: return generateSolarReadings(count, intervalSeconds);
    case 1: return generateWindReadings(count, intervalSeconds);
    case 2: return generateTransformerReadings(count, intervalSeconds); // HydroTurbine
    case 3: return generatePowerMeterReadings(count, intervalSeconds); // SmartMeter
    default: throw new Error(`Unknown device type: ${deviceType}`);
  }
}
