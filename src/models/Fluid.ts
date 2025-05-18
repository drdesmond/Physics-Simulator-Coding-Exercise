export type FluidType =
  | 'water'
  | 'glycol'
  | 'mineral_oil'
  | 'silicone_oil'
  | 'propylene_glycol'
  | 'ethylene_glycol';

export interface FluidProperties {
  name: string;
  specificHeat: number; // J/(kg·K)
  density: number; // kg/m^3
  freezingPoint: number; // °F
  boilingPoint: number; // °F
  viscosity: number; // cP at 68°F
  thermalConductivity: number; // W/(m·K)
}

export const FLUIDS: Record<FluidType, FluidProperties> = {
  water: {
    name: 'Water',
    specificHeat: 4186, // J/(kg·K)
    density: 997, // kg/m^3 at 68°F
    freezingPoint: 32, // °F
    boilingPoint: 212, // °F
    viscosity: 1.0, // cP at 68°F
    thermalConductivity: 0.6, // W/(m·K)
  },
  glycol: {
    name: 'Glycol (50/50 Mix)',
    specificHeat: 3500, // J/(kg·K)
    density: 1050, // kg/m^3 at 68°F
    freezingPoint: -35, // °F
    boilingPoint: 225, // °F
    viscosity: 3.5, // cP at 68°F
    thermalConductivity: 0.4, // W/(m·K)
  },
  mineral_oil: {
    name: 'Mineral Oil',
    specificHeat: 1880, // J/(kg·K)
    density: 850, // kg/m^3 at 68°F
    freezingPoint: -40, // °F
    boilingPoint: 300, // °F
    viscosity: 20, // cP at 68°F
    thermalConductivity: 0.15, // W/(m·K)
  },
  silicone_oil: {
    name: 'Silicone Oil',
    specificHeat: 1460, // J/(kg·K)
    density: 920, // kg/m^3 at 68°F
    freezingPoint: -76, // °F
    boilingPoint: 392, // °F
    viscosity: 50, // cP at 68°F
    thermalConductivity: 0.1, // W/(m·K)
  },
  propylene_glycol: {
    name: 'Propylene Glycol (100%)',
    specificHeat: 2480, // J/(kg·K)
    density: 1036, // kg/m^3 at 68°F
    freezingPoint: -76, // °F
    boilingPoint: 370, // °F
    viscosity: 40, // cP at 68°F
    thermalConductivity: 0.34, // W/(m·K)
  },
  ethylene_glycol: {
    name: 'Ethylene Glycol (100%)',
    specificHeat: 2380, // J/(kg·K)
    density: 1113, // kg/m^3 at 68°F
    freezingPoint: -9, // °F
    boilingPoint: 387, // °F
    viscosity: 16.1, // cP at 68°F
    thermalConductivity: 0.26, // W/(m·K)
  },
};
