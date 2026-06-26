import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface NutritionLog {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water_ml: number;
}

interface NutritionState {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetWater: number;
  
  todayLog: NutritionLog;
  loading: boolean;
  
  fetchTodayLog: (userId: string) => Promise<void>;
  logWater: (userId: string, amountMl: number) => Promise<void>;
  logMacros: (userId: string, calories: number, protein: number, carbs: number, fat: number) => Promise<void>;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  targetCalories: 2500,
  targetProtein: 150,
  targetCarbs: 250,
  targetFat: 80,
  targetWater: 3000,
  
  todayLog: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    water_ml: 0,
  },
  loading: false,

  fetchTodayLog: async (userId) => {
    set({ loading: true });
    const today = new Date().toISOString().split('T')[0];
    try {
      // Evita chamadas caso o Supabase não esteja configurado com chaves válidas
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL.includes('your-project')) {
        throw new Error('Supabase não configurado');
      }

      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', today)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        set({
          todayLog: {
            calories: data.calories || 0,
            protein: data.protein || 0,
            carbs: data.carbs || 0,
            fat: data.fat || 0,
            water_ml: data.water_ml || 0,
          },
        });
      }
    } catch (err) {
      console.warn('Usando estado de nutrição local (Supabase não conectado/configurado):', err);
      // Mantém o estado local ativo
    } finally {
      set({ loading: false });
    }
  },

  logWater: async (userId, amountMl) => {
    const { todayLog } = get();
    const newWater = todayLog.water_ml + amountMl;
    
    // Atualiza local imediatamente para UX rápida
    set({ todayLog: { ...todayLog, water_ml: newWater } });

    try {
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL.includes('your-project')) return;
      const today = new Date().toISOString().split('T')[0];

      // Upsert para garantir registro
      const { error } = await supabase
        .from('nutrition_logs')
        .upsert({ 
          user_id: userId, 
          log_date: today, 
          water_ml: newWater 
        }, { onConflict: 'user_id,log_date' });

      if (error) throw error;
    } catch (err) {
      console.warn('Erro ao sincronizar água com Supabase (mantendo local):', err);
    }
  },

  logMacros: async (userId, calories, protein, carbs, fat) => {
    const { todayLog } = get();
    const newCal = todayLog.calories + calories;
    const newProt = todayLog.protein + protein;
    const newCarb = todayLog.carbs + carbs;
    const newFat = todayLog.fat + fat;

    // Atualiza local imediatamente
    set({
      todayLog: {
        calories: newCal,
        protein: newProt,
        carbs: newCarb,
        fat: newFat,
        water_ml: todayLog.water_ml,
      },
    });

    try {
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL.includes('your-project')) return;
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('nutrition_logs')
        .upsert({
          user_id: userId,
          log_date: today,
          calories: newCal,
          protein: newProt,
          carbs: newCarb,
          fat: newFat,
        }, { onConflict: 'user_id,log_date' });

      if (error) throw error;
    } catch (err) {
      console.warn('Erro ao sincronizar macros com Supabase (mantendo local):', err);
    }
  },
}));
export type { NutritionLog };
