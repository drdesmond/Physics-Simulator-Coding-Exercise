export interface SolarPanelProps {
  area: number; // m^2
  efficiency: number; // 0-1
}

export function computeHeatOutput(irradiance: number, efficiency: number, area: number): number {
  return irradiance * efficiency * area; // W
}
