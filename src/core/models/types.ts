export interface ActivityWeights {
  id: string;
  name: string;
  weight: number;
  color: string;
  order: number;
}

export interface Objective {
  id: string;
  name: string;
  weights: Record<string, number>;
  isActive: boolean;
  createdAt: Date;
}

export interface DailyEntry {
  id: string;
  date: Date;
  activities: Record<string, number>;
  wakeUpTime?: number;
  sleepTime?: number;
  bonus?: number;
  notes?: string;
  updatedAt: Date;
}

export interface MonthlyData {
  year: number;
  month: number;
  entries: DailyEntry[];
  objectiveId: string;
  metaHours: number;
  metaPoints: number;
  createdAt: Date;
  updatedAt: Date;
}