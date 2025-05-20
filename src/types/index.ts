export type FluidType =
  | 'water'
  | 'ethylene_glycol'
  | 'mineral_oil'
  | 'silicone'
  | 'propylene_glycol';

export interface FluidProperties {
  name: string;
  label: string;
  specificHeat: number; // J/(kg·K)
  density: number; // kg/m^3
  viscosity: number; // kg/(m·s) at 20°C
}

export interface SimulationState {
  time: number;
  tankTemp: number;
  panelTemp: number;
  Q: number;
  Q_loss: number;
  running: boolean;
}

export interface SimulationParams {
  fluid: FluidType;
  irradiance: number; // W/m²
  efficiency: number; // 0-1
  ambientTemp: number; // K
  flowRate: number; // L/min
  tankVolume: number; // L
  initialTemp: number; // K
  panelArea: number; // m²
  elevationDiff: number; // meters, positive = tank above panel
}

export type SimulationAction =
  | { type: 'TICK'; payload: Omit<SimulationState, 'running'> }
  | { type: 'START'; payload: SimulationParams }
  | { type: 'PAUSE' }
  | { type: 'RESET'; payload: SimulationParams };
