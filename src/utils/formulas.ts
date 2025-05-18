// Temperature-dependent air properties
// All temperatures are in Fahrenheit

// Temperature coefficient of efficiency for solar panels (typical value)
const TEMP_COEFFICIENT = -0.00222; // -0.4% per Fahrenheit

// Panel thermal properties per square meter
const PANEL_MASS_PER_M2 = 10; // kg/m² (typical mass of solar panel)
const PANEL_SPECIFIC_HEAT = 900; // J/(kg·°F) (typical for aluminum/glass construction)

// Calculate panel thermal mass based on area
function getPanelThermalMass(area: number): number {
  return PANEL_MASS_PER_M2 * area; // kg
}

// Calculate air pressure at given elevation (Pa)
function getAirPressure(elevationDiff: number): number {
  const seaLevelPressure = 101325; // Pa at sea level
  const g = 9.81; // m/s²
  const R = 287.05; // J/(kg·K)
  const T0 = 288.15; // K (15°C at sea level)

  // Convert elevation to meters (assuming positive is up)
  const elevationM = Math.max(0, elevationDiff);

  // Calculate pressure using barometric formula
  return seaLevelPressure * Math.exp(-(g * elevationM) / (R * T0));
}

// Air density as a function of temperature and elevation (kg/m³)
function getAirDensity(tempF: number, elevationDiff: number): number {
  // Using ideal gas law: ρ = P/(R*T)
  const pressure = getAirPressure(elevationDiff);
  const R = 287.05; // J/(kg·K)
  const tempR = tempF + 459.67; // Convert to Rankine
  const tempK = (tempR * 5) / 9; // Convert to Kelvin for calculation
  return pressure / (R * tempK);
}

// Air viscosity as a function of temperature (kg/(m·s))
function getAirViscosity(tempF: number): number {
  // Sutherland's formula for air viscosity
  const tempR = tempF + 459.67; // Convert to Rankine for calculation
  const S = 110.4; // Sutherland's constant for air (°R)
  const T0 = 491.67; // Reference temperature (°R)
  const mu0 = 1.716e-5; // Reference viscosity at T0 (kg/(m·s))
  return ((mu0 * (T0 + S)) / (tempR + S)) * Math.pow(tempR / T0, 1.5);
}

// Air thermal conductivity as a function of temperature (W/(m·°F))
function getAirThermalConductivity(tempF: number, irradiance: number): number {
  // Base thermal conductivity varies with irradiance (more solar energy = more molecular motion)
  const baseConductivity = 0.0242 * (1 + (irradiance / 1000) * 0.1); // 10% increase at 1000 W/m²
  const slope = 7.7e-5 * (1 + (irradiance / 1000) * 0.05); // 5% increase in temperature sensitivity
  return baseConductivity + slope * tempF;
}

// Prandtl number as a function of temperature and flow rate
function getPrandtlNumber(tempF: number, flowRate: number): number {
  // Prandtl number varies with temperature and flow rate
  // Higher flow rates increase turbulence and affect heat transfer
  const basePrandtl = 0.713 - 0.0001 * tempF;
  const flowEffect = Math.min(flowRate / 10, 1) * 0.1; // Up to 10% increase at high flow rates
  return basePrandtl * (1 + flowEffect);
}

// Compute heat input with temperature-dependent efficiency
export function computeHeatInput(
  irradiance: number,
  baseEfficiency: number,
  area: number,
  panelTempF: number
): number {
  // Reference temperature for efficiency (typically 77°F)
  const refTempF = 77;

  // Calculate temperature-dependent efficiency
  const tempDiff = panelTempF - refTempF;
  const efficiency = baseEfficiency * (1 + TEMP_COEFFICIENT * tempDiff);

  // Ensure efficiency doesn't go below 0
  const clampedEfficiency = Math.max(0, efficiency);

  return irradiance * clampedEfficiency * area; // W
}

export function computeHeatLoss(
  area: number,
  T_panelF: number,
  T_ambientF: number,
  h: number,
  elevationDiff: number
): number {
  // Heat loss increases with elevation due to lower air pressure
  const elevationFactor = 1 - (elevationDiff / 1000) * 0.1; // 10% reduction per 1000m
  return h * area * (T_panelF - T_ambientF) * elevationFactor; // convection loss in °F
}

// Compute temperature change with thermal mass consideration
export function computeTemperatureChange(
  Q_net: number,
  mass: number,
  specificHeat: number,
  isPanel: boolean = false,
  panelArea: number = 0
): number {
  const effectiveMass = isPanel ? getPanelThermalMass(panelArea) : mass;
  const effectiveSpecificHeat = isPanel ? PANEL_SPECIFIC_HEAT : specificHeat;
  return Q_net / (effectiveMass * effectiveSpecificHeat); // temperature change in °F
}

// Compute heat transfer coefficient using natural convection correlation
// Based on Churchill-Chu correlation for vertical plates
export function computeHeatTransferCoeff(
  panelTempF: number,
  ambientTempF: number,
  panelHeight: number = 1.5, // default panel height in meters
  irradiance: number = 0,
  flowRate: number = 0,
  elevationDiff: number = 0
): number {
  const deltaT = Math.abs(panelTempF - ambientTempF);
  if (deltaT < 0.1) return 5; // minimum value for very small temperature differences

  // Calculate air properties at the film temperature (average of panel and ambient)
  const filmTempF = (panelTempF + ambientTempF) / 2;
  const airDensity = getAirDensity(filmTempF, elevationDiff);
  const airViscosity = getAirViscosity(filmTempF);
  const airThermalConductivity = getAirThermalConductivity(filmTempF, irradiance);
  const prandtl = getPrandtlNumber(filmTempF, flowRate);

  // Compute Grashof number
  const beta = 1 / (filmTempF + 459.67); // thermal expansion coefficient
  const g = 9.81; // gravitational acceleration
  const Gr =
    (g * beta * deltaT * Math.pow(panelHeight, 3)) / Math.pow(airViscosity / airDensity, 2);

  // Compute Rayleigh number
  const Ra = Gr * prandtl;

  // Churchill-Chu correlation for natural convection
  const Nu =
    0.68 + (0.67 * Math.pow(Ra, 0.25)) / Math.pow(1 + Math.pow(0.492 / prandtl, 9 / 16), 4 / 9);

  // Compute heat transfer coefficient
  const h = (Nu * airThermalConductivity) / panelHeight;

  // Add a small forced convection component (simulating light wind)
  // Wind effect increases with elevation
  const windSpeed = 0.5 * (1 + elevationDiff / 1000); // m/s, increases with elevation
  const forcedConv = 5.7 + 3.8 * windSpeed;

  return h + forcedConv;
}
