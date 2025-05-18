export type FluidType = 'water' | 'glycol';

export interface FluidProperties {
  name: string;
  specificHeat: number; // J/(kg·K)
  density: number; // kg/m^3
}

export const FLUIDS: Record<FluidType, FluidProperties> = {
  water: {
    name: 'Water',
    specificHeat: 4186, // J/(kg·K)
    density: 997, // kg/m^3
  },
  glycol: {
    name: 'Glycol',
    specificHeat: 3500, // J/(kg·K) (approximate)
    density: 1050, // kg/m^3 (approximate)
  },
};
