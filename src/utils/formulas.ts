// Temperature-dependent air properties
// All temperatures should be in Kelvin for calculations

// Temperature coefficient of efficiency for solar panels (typical value)
const TEMP_COEFFICIENT = -0.004; // -0.4% per Kelvin

// Air density as a function of temperature (kg/m³)
function getAirDensity(tempK: number): number {
  // Using ideal gas law: ρ = P/(R*T)
  // At standard pressure (101325 Pa) and using gas constant for air (287.05 J/(kg·K))
  return 101325 / (287.05 * tempK);
}

// Air viscosity as a function of temperature (kg/(m·s))
function getAirViscosity(tempK: number): number {
  // Sutherland's formula for air viscosity
  const S = 110.4; // Sutherland's constant for air (K)
  const T0 = 273.15; // Reference temperature (K)
  const mu0 = 1.716e-5; // Reference viscosity at T0 (kg/(m·s))
  return ((mu0 * (T0 + S)) / (tempK + S)) * Math.pow(tempK / T0, 1.5);
}

// Air thermal conductivity as a function of temperature (W/(m·K))
function getAirThermalConductivity(tempK: number): number {
  // Linear approximation for thermal conductivity
  const k0 = 0.0242; // Thermal conductivity at 273.15K (W/(m·K))
  const slope = 7.7e-5; // Temperature coefficient (W/(m·K²))
  return k0 + slope * (tempK - 273.15);
}

// Prandtl number as a function of temperature
function getPrandtlNumber(tempK: number): number {
  // Prandtl number is relatively constant for air in the temperature range of interest
  // Using a simplified model that varies slightly with temperature
  return 0.713 - 0.0001 * (tempK - 293.15);
}

// Compute heat input with temperature-dependent efficiency
export function computeHeatInput(
  irradiance: number,
  baseEfficiency: number,
  area: number,
  panelTempK: number
): number {
  // Reference temperature for efficiency (typically 25°K = 298.15K)
  const refTempK = 298.15;

  // Calculate temperature-dependent efficiency
  const tempDiff = panelTempK - refTempK;
  const efficiency = baseEfficiency * (1 + TEMP_COEFFICIENT * tempDiff);

  // Ensure efficiency doesn't go below 0
  const clampedEfficiency = Math.max(0, efficiency);

  return irradiance * clampedEfficiency * area; // W
}

export function computeHeatLoss(
  area: number,
  T_panel: number,
  T_ambient: number,
  h: number
): number {
  return h * area * (T_panel - T_ambient); // convection loss
}

export function computeTemperatureChange(
  Q_net: number,
  mass: number,
  specificHeat: number
): number {
  return Q_net / (mass * specificHeat);
}

// Compute heat transfer coefficient using natural convection correlation
// Based on Churchill-Chu correlation for vertical plates
export function computeHeatTransferCoeff(
  panelTempK: number,
  ambientTempK: number,
  panelHeight: number = 1.5 // default panel height in meters
): number {
  const deltaT = Math.abs(panelTempK - ambientTempK);
  if (deltaT < 0.1) return 5; // minimum value for very small temperature differences

  // Calculate air properties at the film temperature (average of panel and ambient)
  const filmTempK = (panelTempK + ambientTempK) / 2;
  const airDensity = getAirDensity(filmTempK);
  const airViscosity = getAirViscosity(filmTempK);
  const airThermalConductivity = getAirThermalConductivity(filmTempK);
  const prandtl = getPrandtlNumber(filmTempK);

  // Compute Grashof number
  const beta = 1 / filmTempK; // thermal expansion coefficient
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
  const windSpeed = 0.5; // m/s
  const forcedConv = 5.7 + 3.8 * windSpeed;

  return h + forcedConv;
}
