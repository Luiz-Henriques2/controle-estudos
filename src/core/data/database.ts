import Dexie, { Table } from 'dexie';
import { 
  ActivityWeights, 
  Objective, 
  DailyEntry, 
  MonthlyData 
} from '../models/types';

export class StudyControlDB extends Dexie {
  activityWeights!: Table<ActivityWeights, string>;
  objectives!: Table<Objective, string>;
  dailyEntries!: Table<DailyEntry, string>;
  monthlyData!: Table<MonthlyData, string>;

  constructor() {
    super('StudyControlDB');
    
    this.version(1).stores({
      activityWeights: 'id, order',
      objectives: 'id, isActive',
      dailyEntries: 'id, date',
      monthlyData: '[year+month], year, month'
    });
    
    // Inicializa com dados padrão
    this.on('populate', async () => {
      await this.initializeDefaultData();
    });
  }
  
  private async initializeDefaultData() {
    // Pesos padrão
    const defaultWeights: ActivityWeights[] = [
      { 
        id: 'estudo', 
        name: 'Estudo', 
        weight: 1.6, 
        color: '#3b82f6', 
        order: 1 
      },
      { 
        id: 'ingles', 
        name: 'Inglês', 
        weight: 1.3, 
        color: '#10b981', 
        order: 2 
      },
      { 
        id: 'trabalho', 
        name: 'Trabalho', 
        weight: 0.7, 
        color: '#8b5cf6', 
        order: 3 
      },
      { 
        id: 'acordar', 
        name: 'Acordar', 
        weight: 0.1, 
        color: '#f59e0b', 
        order: 4 
      },
    ];
    
    await this.activityWeights.bulkAdd(defaultWeights);
    
    // Objetivo padrão
    const defaultObjective: Objective = {
      id: 'objetivo-1',
      name: 'Objetivo Principal',
      weights: {
        estudo: 1.6,
        ingles: 1.3,
        trabalho: 0.7,
        acordar: 0.1
      },
      isActive: true,
      createdAt: new Date()
    };
    
    await this.objectives.add(defaultObjective);
  }
  
  async getMonthlyData(year: number, month: number): Promise<MonthlyData> {
    const id = `${year}-${month.toString().padStart(2, '0')}`;
    
    let monthlyData = await this.monthlyData.get(id);
    
    if (!monthlyData) {
      monthlyData = await this.createNewMonth(year, month);
    }
    
    return monthlyData;
  }
  
  private async createNewMonth(year: number, month: number): Promise<MonthlyData> {
    const daysInMonth = new Date(year, month, 0).getDate();
    const now = new Date();
    
    const entries: DailyEntry[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      entries.push({
        id: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        date,
        activities: {},
        updatedAt: now
      });
    }
    
    const activeObjective = await this.objectives
      .where('isActive')
      .equals(true)
      .first();
    
    const monthlyData: MonthlyData = {
      year,
      month,
      entries,
      objectiveId: activeObjective?.id || 'objetivo-1',
      metaHours: 100,
      metaPoints: 10000,
      createdAt: now,
      updatedAt: now
    };
    
    await this.monthlyData.add(monthlyData);
    return monthlyData;
  }
  
  async updateDailyEntry(entry: DailyEntry): Promise<void> {
    entry.updatedAt = new Date();
    await this.dailyEntries.put(entry);
  }
}

export const db = new StudyControlDB();