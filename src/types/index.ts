import { FluidType } from '../models/Fluid';

export interface SimulationState {
  time: number;
  tankTemp: number;
  panelTemp: number;
  Q: number;
  qLoss: number;
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
