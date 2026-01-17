export interface ActivityWeights {
  id?: number;
  name: string;
  weight?: number; // Depreciado - usar importance
  importance?: number; // Importância de 1-5 estrelas
  color: string;
  order: number;
  target?: number; // Meta padrão de horas diárias (depreciado - usar targetsByDay)
  targetsByDay?: Record<string, number>; // Metas específicas por dia da semana (Seg, Ter, Qua, etc)
  hidden?: boolean; // Se a atividade está oculta (não deletada)
}

export interface Objective {
  id?: number;
  name: string;
  weights: Record<string, number>;
  isActive: boolean;
  createdAt: Date;
}

export interface DailyEntry {
  id: string; // Formato: YYYY-MM-DD
  date: Date;
  activities: Record<string, number>;
  targets?: Record<string, number>; // Metas personalizadas por atividade para este dia
  wakeUpTime?: number;
  sleepTime?: number;
  bonus?: number;
  notes?: string;
  updatedAt: Date;
}

export interface MonthlyData {
  id: string; // Formato: YYYY-MM
  year: number;
  month: number;
  entries: DailyEntry[];
  objectiveId: string;
  metaHours: number;
  metaPoints: number;
  createdAt: Date;
  updatedAt: Date;
}