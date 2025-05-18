export interface EnvironmentProps {
  ambientTemp: number; // °K
  h: number; // heat transfer coefficient, W/(m^2·K)
}

export function calculateHeatLoss(
  area: number,
  T_panel: number,
  T_ambient: number,
  h: number
): number {
  return h * area * (T_panel - T_ambient); // convection loss
}
