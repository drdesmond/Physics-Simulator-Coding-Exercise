// Temperature-dependent air properties
// All temperatures are in Fahrenheit

// Temperature coefficient of efficiency for solar panels (typical value)
const TEMP_COEFFICIENT = -0.00222; // -0.4% per Fahrenheit

// Panel thermal properties per square meter
const PANEL_MASS_PER_M2 = 10; // kg/m² (typical mass of solar panel)
const PANEL_SPECIFIC_HEAT = 900; // J/(kg·K) (typical for aluminum/glass construction)

// Calculate panel thermal mass based on area
function getPanelThermalMass(area: number): number {
  return PANEL_MASS_PER_M2 * area; // kg
}

// Air density as a function of temperature (kg/m³)
function getAirDensity(tempF: number): number {
  // Using ideal gas law: ρ = P/(R*T)
  // At standard pressure (101325 Pa) and using gas constant for air (287.05 J/(kg·K))
  const tempR = tempF + 459.67; // Convert to Rankine
  return 101325 / (287.05 * ((tempR * 5) / 9)); // Convert Rankine to Kelvin for calculation
}

// Air viscosity as a function of temperature (kg/(m·s))
function getAirViscosity(tempF: number): number {
  // Sutherland's formula for air viscosity
  const tempR = tempF + 459.67; // Convert to Rankine
  const tempK = (tempR * 5) / 9; // Convert to Kelvin for calculation
  const S = 110.4; // Sutherland's constant for air (K)
  const T0 = 273.15; // Reference temperature (K)
  const mu0 = 1.716e-5; // Reference viscosity at T0 (kg/(m·s))
  return ((mu0 * (T0 + S)) / (tempK + S)) * Math.pow(tempK / T0, 1.5);
}

// Air thermal conductivity as a function of temperature (W/(m·K))
function getAirThermalConductivity(tempF: number): number {
  // Linear approximation for thermal conductivity
  const tempR = tempF + 459.67; // Convert to Rankine
  const tempK = (tempR * 5) / 9; // Convert to Kelvin for calculation
  const k0 = 0.0242; // Thermal conductivity at 32°F (W/(m·K))
  const slope = 7.7e-5; // Temperature coefficient (W/(m·K²))
  return k0 + slope * (tempK - 273.15);
}

// Prandtl number as a function of temperature
function getPrandtlNumber(tempF: number): number {
  // Prandtl number is relatively constant for air in the temperature range of interest
  // Using a simplified model that varies slightly with temperature
  const tempR = tempF + 459.67; // Convert to Rankine
  const tempK = (tempR * 5) / 9; // Convert to Kelvin for calculation
  return 0.713 - 0.0001 * (tempK - 293.15);
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
  h: number
): number {
  const T_panelR = T_panelF + 459.67; // Convert to Rankine
  const T_ambientR = T_ambientF + 459.67; // Convert to Rankine
  const T_panelK = (T_panelR * 5) / 9; // Convert to Kelvin
  const T_ambientK = (T_ambientR * 5) / 9; // Convert to Kelvin
  return h * area * (T_panelK - T_ambientK); // convection loss
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
  const deltaTK = Q_net / (effectiveMass * effectiveSpecificHeat);
  return (deltaTK * 9) / 5; // Convert Kelvin to Fahrenheit
}

// Compute heat transfer coefficient using natural convection correlation
// Based on Churchill-Chu correlation for vertical plates
export function computeHeatTransferCoeff(
  panelTempF: number,
  ambientTempF: number,
  panelHeight: number = 1.5 // default panel height in meters
): number {
  const panelTempR = panelTempF + 459.67; // Convert to Rankine
  const ambientTempR = ambientTempF + 459.67; // Convert to Rankine
  const panelTempK = (panelTempR * 5) / 9; // Convert to Kelvin
  const ambientTempK = (ambientTempR * 5) / 9; // Convert to Kelvin
  const deltaT = Math.abs(panelTempK - ambientTempK);
  if (deltaT < 0.1) return 5; // minimum value for very small temperature differences

  // Calculate air properties at the film temperature (average of panel and ambient)
  const filmTempF = (panelTempF + ambientTempF) / 2;
  const airDensity = getAirDensity(filmTempF);
  const airViscosity = getAirViscosity(filmTempF);
  const airThermalConductivity = getAirThermalConductivity(filmTempF);
  const prandtl = getPrandtlNumber(filmTempF);

  // Compute Grashof number
  const filmTempK = ((filmTempF + 459.67) * 5) / 9; // Convert to Kelvin
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
