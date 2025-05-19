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
  thermalConductivity: number; // W/(m·K) at 20°C
  freezingPoint: number; // °F
  boilingPoint: number; // °F
}

export const FLUIDS: Record<FluidType, FluidProperties> = {
  water: {
    name: 'water',
    label: 'Water',
    specificHeat: 4186, // J/(kg·K)
    density: 998, // kg/m^3 at 20°C
    viscosity: 0.001002, // kg/(m·s) at 20°C
    thermalConductivity: 0.598, // W/(m·K) at 20°C
    freezingPoint: 32, // °F
    boilingPoint: 212, // °F
  },
  ethylene_glycol: {
    name: 'ethylene_glycol',
    label: 'Ethylene Glycol',
    specificHeat: 2382, // J/(kg·K) at 20°C
    density: 1113, // kg/m^3 at 20°C
    viscosity: 0.0161, // kg/(m·s) at 20°C
    thermalConductivity: 0.258, // W/(m·K) at 20°C
    freezingPoint: 8.6, // °F (50% solution)
    boilingPoint: 225, // °F (50% solution)
  },
  mineral_oil: {
    name: 'mineral_oil',
    label: 'Mineral Oil',
    specificHeat: 1880, // J/(kg·K) at 20°C
    density: 850, // kg/m^3 at 20°C
    viscosity: 0.034, // kg/(m·s) at 20°C
    thermalConductivity: 0.138, // W/(m·K) at 20°C
    freezingPoint: -40, // °F
    boilingPoint: 320, // °F
  },
  silicone: {
    name: 'silicone',
    label: 'Silicone Oil',
    specificHeat: 1465, // J/(kg·K) at 20°C
    density: 920, // kg/m^3 at 20°C
    viscosity: 0.048, // kg/(m·s) at 20°C
    thermalConductivity: 0.1, // W/(m·K) at 20°C
    freezingPoint: -76, // °F
    boilingPoint: 392, // °F
  },
  propylene_glycol: {
    name: 'propylene_glycol',
    label: 'Propylene Glycol',
    specificHeat: 2480, // J/(kg·K) at 20°C
    density: 1036, // kg/m^3 at 20°C
    viscosity: 0.042, // kg/(m·s) at 20°C
    thermalConductivity: 0.147, // W/(m·K) at 20°C
    freezingPoint: -60, // °F (50% solution)
    boilingPoint: 230, // °F (50% solution)
  },
};
