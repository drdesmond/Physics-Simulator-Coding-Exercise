export interface StorageTankProps {
  volume: number; // liters
  initialTemp: number; // °K
}

export class StorageTank {
  temp: number;
  volume: number;

  constructor({ volume, initialTemp }: StorageTankProps) {
    this.volume = volume;
    this.temp = initialTemp;
  }

  // Q in Joules, fluid in kg, specificHeat in J/(kg·K)
  applyHeat(Q: number, fluidMass: number, specificHeat: number) {
    const deltaT = Q / (fluidMass * specificHeat);
    this.temp += deltaT;
  }
}
