export type BuildingType = 'castle' | 'farm' | 'mine' | 'barracks' | 'tower';

export interface Building {
  id: number;
  userId: number;
  buildingType: BuildingType;
  level: number;
  lastCollectedAt: string;
}

export interface BuildingConfig {
  type: BuildingType;
  name: string;
  baseIncomePerHour: number;
  upgradeCostBase: number;
  upgradeCostMultiplier: number;
  maxLevel: number;
}
