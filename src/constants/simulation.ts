import { FluidType } from '../models/Fluid';
import { SimulationParams } from '../types';

export const DEFAULT_PARAMS: SimulationParams = {
  fluid: 'water' as FluidType,
  irradiance: 1000,
  efficiency: 0.8,
  ambientTemp: 70, // 70°F
  flowRate: 1,
  tankVolume: 200,
  initialTemp: 68, // 68°F
  panelArea: 2,
  elevationDiff: 10,
};
