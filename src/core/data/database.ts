import Dexie, { Table } from 'dexie';
import { 
  ActivityWeights, 
  Objective, 
  DailyEntry, 
  MonthlyData 
} from '../models/types';

// CORREÇÃO: Defina a chave primária de cada tipo
export class StudyControlDB extends Dexie {
  // ActivityWeights tem chave primária 'id' que é number
  activityWeights!: Table<ActivityWeights, number>;
  
  // Objective tem chave primária 'id' que é number  
  objectives!: Table<Objective, number>;
  
  // DailyEntry tem chave primária 'id' que é string (por ser data)
  dailyEntries!: Table<DailyEntry, string>;
  
  // MonthlyData tem chave primária 'id' que é string (por ser ano-mês)
  monthlyData!: Table<MonthlyData, string>;

  constructor() {
    super('StudyControlDB');
    
    console.log('🔄 Inicializando banco de dados StudyControlDB...');
    
    // VERSÃO 6: Corrigindo problemas de chave primária
    this.version(6).stores({
      activityWeights: '++id, order',        // ++ = auto-increment, chave é number
      objectives: '++id',                    // ++ = auto-increment, chave é number
      dailyEntries: '&id',                   // & = chave primária (única), chave é string
      monthlyData: '&id'                     // & = chave primária (única), chave é string
    });
    
    // Hook para popular dados iniciais
    this.on('populate', async () => {
      console.log('📝 Populando banco com dados iniciais...');
      await this.initializeDefaultData();
    });
  }
  
  async initialize(): Promise<void> {
    try {
      if (!this.isOpen()) {
        await this.open();
      }
      
      // Forçar upgrade para versão 6 se necessário
      if (this.verno < 6) {
        await this.open();
      }
      
      // Verifica se tem dados
      const weightsCount = await this.activityWeights.count();
      const objectivesCount = await this.objectives.count();
      
      console.log(`📊 Banco inicializado. Pesos: ${weightsCount}, Objetivos: ${objectivesCount}`);
      
    } catch (error) {
      console.error('❌ Erro ao inicializar banco:', error);
      throw error;
    }
  }
  
  private async initializeDefaultData(): Promise<void> {
    try {
      console.log('📝 Adicionando dados padrão...');
      
      // 1. PESOS (3 atividades - SEM ACORDAR!)
      const defaultWeights = [
        { 
          name: 'Estudo', 
          weight: 1.6, 
          color: '#3b82f6', 
          order: 1,
          target: 3 // 3 horas de meta diária
        },
        { 
          name: 'Inglês', 
          weight: 1.3, 
          color: '#10b981', 
          order: 2,
          target: 1 // 1 hora de meta diária
        },
        { 
          name: 'Trabalho', 
          weight: 0.7, 
          color: '#8b5cf6', 
          order: 3,
          target: 2 // 2 horas de meta diária
        }
      ];
      
      await this.activityWeights.bulkAdd(defaultWeights);
      console.log(`✅ ${defaultWeights.length} pesos adicionados`);
      
      // 2. OBJETIVO - SEM ACORDAR!
      const defaultObjective = {
        name: 'Objetivo Principal',
        weights: {
          'Estudo': 1.6,
          'Inglês': 1.3,
          'Trabalho': 0.7
        },
        isActive: true,
        createdAt: new Date()
      };
      
      await this.objectives.add(defaultObjective);
      console.log('✅ Objetivo padrão adicionado');
      
      console.log('🎉 Dados iniciais configurados com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao adicionar dados padrão:', error);
    }
  }
  
  async getMonthlyData(year: number, month: number): Promise<MonthlyData> {
    const id = `${year}-${month.toString().padStart(2, '0')}`;
    
    console.log(`📅 Buscando mês: ${id} (${month}/${year})`);
    
    try {
      // Tenta pegar do banco
      let monthlyData = await this.monthlyData.get(id);
      
      if (!monthlyData) {
        console.log(`📝 Mês não encontrado, criando novo: ${id}`);
        monthlyData = await this.createNewMonth(year, month);
      } else {
        console.log(`✅ Mês encontrado: ${id} com ${monthlyData.entries.length} entradas`);
      }
      
      return monthlyData;
      
    } catch (error) {
      console.error('❌ Erro grave ao buscar mês:', error);
      // Retorna um mês vazio em caso de erro
      return this.createEmptyMonth(year, month);
    }
  }
  
  private async createNewMonth(year: number, month: number): Promise<MonthlyData> {
    console.log(`🔨 CRIANDO NOVO MÊS: ${month}/${year}`);
    
    // PASSO 1: Calcular número de dias
    const daysInMonth = new Date(year, month, 0).getDate();
    console.log(`📅 O mês ${month}/${year} tem ${daysInMonth} dias`);
    
    // PASSO 2: Criar as entradas diárias
    const now = new Date();
    const entries: DailyEntry[] = [];
    
    console.log(`🔄 Criando ${daysInMonth} entradas diárias...`);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const entryId = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      entries.push({
        id: entryId,
        date,
        activities: {},
        updatedAt: now
      });
    }
    
    console.log(`✅ ${entries.length} entradas criadas`);
    
    // PASSO 3: Pegar objetivo ativo
    let activeObjective;
    try {
      const allObjectives = await this.objectives.toArray();
      activeObjective = allObjectives.find(obj => obj.isActive === true);
      console.log(`🎯 Objetivo ativo encontrado: ${activeObjective ? 'Sim' : 'Não'}`);
    } catch (error) {
      console.error('❌ Erro ao buscar objetivo ativo:', error);
      activeObjective = null;
    }
    
    // PASSO 4: Criar objeto MonthlyData
    const monthlyId = `${year}-${month.toString().padStart(2, '0')}`;
    const monthlyData: MonthlyData = {
      id: monthlyId,
      year,
      month,
      entries,
      objectiveId: activeObjective?.id ? String(activeObjective.id) : '1',
      metaHours: 100,
      metaPoints: 10000,
      createdAt: now,
      updatedAt: now
    };
    
    // PASSO 5: Salvar no banco e salvar cada entrada individualmente
    try {
      await this.monthlyData.add(monthlyData);
      console.log(`🎉 Mês ${monthlyId} salvo no banco com ${entries.length} dias!`);
      
      // Salvar cada entrada individualmente também
      for (const entry of entries) {
        await this.dailyEntries.put(entry);
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar mês:', error);
      // Se já existe, retorna o que já tem
      if (error.name === 'ConstraintError') {
        const existing = await this.monthlyData.get(monthlyId);
        if (existing) {
          console.log(`⚠️ Mês já existe, retornando existente`);
          return existing;
        }
      }
    }
    
    return monthlyData;
  }
  
  private createEmptyMonth(year: number, month: number): MonthlyData {
    const now = new Date();
    const monthlyId = `${year}-${month.toString().padStart(2, '0')}`;
    
    console.log(`⚠️ Criando mês vazio: ${monthlyId}`);
    
    return {
      id: monthlyId,
      year,
      month,
      entries: [],
      objectiveId: '1',
      metaHours: 100,
      metaPoints: 10000,
      createdAt: now,
      updatedAt: now
    };
  }
  
  async updateDailyEntry(entry: DailyEntry): Promise<void> {
    try {
      entry.updatedAt = new Date();
      
      // Salva na tabela dailyEntries (esta é a tabela principal para persistência)
      await this.dailyEntries.put(entry);
      console.log(`💾 Entrada salva na tabela dailyEntries: ${entry.id}`);
      
      // Também atualiza no monthlyData correspondente
      const date = entry.date;
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthlyId = `${year}-${month.toString().padStart(2, '0')}`;
      
      const monthlyData = await this.monthlyData.get(monthlyId);
      if (monthlyData) {
        const entryIndex = monthlyData.entries.findIndex(e => e.id === entry.id);
        if (entryIndex !== -1) {
          monthlyData.entries[entryIndex] = entry;
        } else {
          monthlyData.entries.push(entry);
        }
        monthlyData.updatedAt = new Date();
        await this.monthlyData.put(monthlyData);
        console.log(`💾 Entrada também atualizada no mês ${monthlyId}`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar entrada:', error);
      console.error('Detalhes da entrada:', entry);
      throw error;
    }
  }
  
  async getWeights(): Promise<ActivityWeights[]> {
    return await this.activityWeights.orderBy('order').toArray();
  }
  
  async addWeight(weight: Omit<ActivityWeights, 'id'>): Promise<number> {
    return await this.activityWeights.add(weight as ActivityWeights);
  }
  
  async updateWeight(id: number, weight: Partial<ActivityWeights>): Promise<number> {
    return await this.activityWeights.update(id, weight);
  }
  
  async deleteWeight(id: number): Promise<void> {
    await this.activityWeights.delete(id);
  }
  
  async getActiveObjective(): Promise<Objective | undefined> {
    try {
      const allObjectives = await this.objectives.toArray();
      return allObjectives.find(obj => obj.isActive === true);
    } catch (error) {
      console.error('❌ Erro ao buscar objetivo ativo:', error);
      return undefined;
    }
  }
  
  // Método para carregar todas as entradas de um mês da tabela dailyEntries
  async loadDailyEntriesForMonth(year: number, month: number): Promise<DailyEntry[]> {
    const monthPrefix = `${year}-${month.toString().padStart(2, '0')}-`;
    
    try {
      const allEntries = await this.dailyEntries.toArray();
      const monthEntries = allEntries.filter(entry => 
        entry.id.startsWith(monthPrefix)
      );
      
      console.log(`📊 Carregadas ${monthEntries.length} entradas da tabela dailyEntries para ${monthPrefix}`);
      return monthEntries;
    } catch (error) {
      console.error('❌ Erro ao carregar entradas:', error);
      return [];
    }
  }
  
  async debugInfo(): Promise<any> {
    try {
      const weights = await this.activityWeights.toArray();
      const objectives = await this.objectives.toArray();
      const monthlyData = await this.monthlyData.toArray();
      const dailyEntries = await this.dailyEntries.toArray();
      
      return {
        version: 6,
        weightsCount: weights.length,
        objectivesCount: objectives.length,
        monthlyDataCount: monthlyData.length,
        dailyEntriesCount: dailyEntries.length,
        weights: weights.map(w => ({ 
          id: w.id, 
          name: w.name, 
          weight: w.weight,
          color: w.color 
        })),
        objectives: objectives.map(o => ({ 
          id: o.id, 
          name: o.name, 
          isActive: o.isActive 
        })),
        monthlyData: monthlyData.map(m => ({
          id: m.id,
          year: m.year,
          month: m.month,
          entries: m.entries.length,
          firstEntries: m.entries.slice(0, 3).map(e => ({
            id: e.id,
            date: e.date?.toISOString()?.split('T')[0] || 'sem data',
            activities: e.activities
          }))
        })),
        dailyEntries: dailyEntries.slice(0, 5).map(e => ({
          id: e.id,
          date: e.date?.toISOString()?.split('T')[0] || 'sem data',
          activities: e.activities
        }))
      };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  /**
   * Retorna todos os registros mensais para cálculo de estatísticas globais
   */
  async getAllHistory(): Promise<MonthlyData[]> {
    try {
      return await this.monthlyData.toArray();
    } catch (error) {
      console.error('Erro ao buscar histórico completo:', error);
      return [];
    }
  }

  // CORREÇÃO: Tipo de retorno para calculateCurrentStreak
  async calculateCurrentStreak(activityName: string, fromDate: Date = new Date()): Promise<number> {
    let streak = 0;
    let checkDate = new Date(fromDate);
    
    // Normalizar para garantir que não haja problemas com horas
    checkDate.setHours(0, 0, 0, 0);

    // Variáveis para cache do mês carregado
    let loadedYear = -1;
    let loadedMonth = -1;
    let currentMonthData: MonthlyData | null = null;

    while (true) {
      const year = checkDate.getFullYear();
      const month = checkDate.getMonth() + 1;
      const day = checkDate.getDate();

      // Se mudou o mês em relação à iteração anterior, carrega o novo mês do banco
      if (year !== loadedYear || month !== loadedMonth) {
        try {
          currentMonthData = await this.getMonthlyData(year, month);
          loadedYear = year;
          loadedMonth = month;
        } catch (e) {
          break;
        }
      }

      // Se não tem dados para este mês, a ofensiva acabou
      if (!currentMonthData || !currentMonthData.entries) {
        break;
      }

      // Busca a entrada do dia específico
      const entry = currentMonthData.entries.find((e) => {
        const d = new Date(e.date);
        return d.getDate() === day;
      });

      const value = entry?.activities?.[activityName] || 0;
      const MINIMUM_MINUTES = 0.5;

      if (value >= MINIMUM_MINUTES) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (checkDate.getTime() === fromDate.getTime()) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue; 
        }
        break;
      }
      
      if (streak > 2000) break;
    }

    return streak;
  }
}

export const db = new StudyControlDB();

// Expor para debug
if (typeof window !== 'undefined') {
  (window as any).studyDB = db;
}