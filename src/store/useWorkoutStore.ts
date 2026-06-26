import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { useAuthStore } from './useAuthStore';

export interface WorkoutSet {
  reps: number;
  weight: number;
  completed: boolean;
  previousWeight?: number;
  previousReps?: number;
}

export interface ActiveExercise {
  id: string;
  name: string;
  category: string;
  sets: WorkoutSet[];
}

export interface ActiveWorkout {
  name: string;
  startTime: string;
  durationSeconds: number;
  exercises: ActiveExercise[];
  templateId?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: {
    id: string;
    name: string;
    category: string;
    sets_count: number;
  }[];
}

export interface WorkoutLog {
  id: string;
  name: string;
  duration_seconds: number;
  xp_gained: number;
  created_at: string;
}

interface WorkoutState {
  templates: WorkoutTemplate[];
  logs: WorkoutLog[];
  activeWorkout: ActiveWorkout | null;
  loading: boolean;

  // Rest Timer State
  restTimerDuration: number;
  restTimerRemaining: number;
  restTimerActive: boolean;
  restTimerExerciseName: string;

  // Actions
  fetchTemplates: (userId: string) => Promise<void>;
  fetchLogs: (userId: string) => Promise<void>;
  startWorkout: (template: WorkoutTemplate) => void;
  startEmptyWorkout: () => void;
  addExerciseToActive: (exercise: { id: string; name: string; category: string }) => void;
  removeExerciseFromActive: (index: number) => void;
  addSetToActiveExercise: (exerciseIndex: number) => void;
  removeSetFromActiveExercise: (exerciseIndex: number, setIndex: number) => void;
  updateSet: (exerciseIndex: number, setIndex: number, updates: Partial<WorkoutSet>) => void;
  toggleSetComplete: (exerciseIndex: number, setIndex: number, autoTimerCallback?: (secs: number, name: string) => void) => void;
  finishWorkout: (userId: string) => Promise<{ xp: number; leveledUp: boolean; newLevel: number } | null>;
  cancelWorkout: () => void;
  tickWorkoutTimer: () => void;

  // Rest Timer Actions
  startRestTimer: (seconds: number, exerciseName: string) => void;
  stopRestTimer: () => void;
  tickRestTimer: () => void;
  adjustRestTimer: (seconds: number) => void;
}

// Fallback de Templates para funcionamento imediato offline/demo
const defaultTemplates: WorkoutTemplate[] = [
  {
    id: 'tpl-a',
    name: 'Treino A - Peito, Tríceps e Ombros',
    description: 'Foco em força e hipertrofia de empurrar.',
    exercises: [
      { id: '1', name: 'Supino Reto com Barra', category: 'Peito', sets_count: 4 },
      { id: '2', name: 'Desenvolvimento com Halteres', category: 'Ombros', sets_count: 3 },
      { id: '3', name: 'Tríceps Corda na Polia', category: 'Braços', sets_count: 3 },
    ],
  },
  {
    id: 'tpl-b',
    name: 'Treino B - Costas, Bíceps e Abdômen',
    description: 'Rotina de puxar e fortalecimento do core.',
    exercises: [
      { id: '4', name: 'Puxada Alta na Polia (Lat Pulldown)', category: 'Costas', sets_count: 4 },
      { id: '5', name: 'Rosca Direta com Barra W', category: 'Braços', sets_count: 3 },
      { id: '6', name: 'Prancha Abdominal Isométrica', category: 'Core', sets_count: 3 },
    ],
  },
  {
    id: 'tpl-c',
    name: 'Treino C - Pernas Completo',
    description: 'Membros inferiores com foco em quadríceps e posterior.',
    exercises: [
      { id: '7', name: 'Agachamento Livre com Barra', category: 'Pernas', sets_count: 4 },
      { id: '8', name: 'Cadeira Extensora', category: 'Pernas', sets_count: 3 },
      { id: '9', name: 'Mesa Flexora', category: 'Pernas', sets_count: 3 },
    ],
  },
];

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  templates: defaultTemplates,
  logs: [],
  activeWorkout: null,
  loading: false,

  // Rest Timer defaults
  restTimerDuration: 90,
  restTimerRemaining: 0,
  restTimerActive: false,
  restTimerExerciseName: '',

  fetchTemplates: async (userId) => {
    set({ loading: true });
    try {
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL.includes('your-project')) {
        throw new Error('Supabase não conectado');
      }

      const { data, error } = await supabase
        .from('workout_templates')
        .select(`
          id, name, description,
          workout_template_exercises(
            exercise_id, sets_count, order_index,
            exercises(id, name, category)
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      if (data && data.length > 0) {
        const formatted = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          exercises: d.workout_template_exercises
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((ex: any) => ({
              id: ex.exercises.id,
              name: ex.exercises.name,
              category: ex.exercises.category,
              sets_count: ex.sets_count,
            })),
        }));
        set({ templates: formatted });
      }
    } catch (err) {
      console.warn('Erro ao carregar templates do Supabase (usando padrão):', err);
      // Mantém defaultTemplates
      set({ templates: defaultTemplates });
    } finally {
      set({ loading: false });
    }
  },

  fetchLogs: async (userId) => {
    try {
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL.includes('your-project')) {
        throw new Error('Supabase não conectado');
      }
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ logs: data || [] });
    } catch (err) {
      console.warn('Erro ao carregar logs do Supabase:', err);
    }
  },

  startWorkout: (template) => {
    const activeExercises: ActiveExercise[] = template.exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      sets: Array.from({ length: ex.sets_count }).map(() => ({
        reps: 10,
        weight: 10,
        completed: false,
        previousWeight: 10,
        previousReps: 10,
      })),
    }));

    set({
      activeWorkout: {
        name: template.name,
        startTime: new Date().toISOString(),
        durationSeconds: 0,
        exercises: activeExercises,
        templateId: template.id,
      },
    });
  },

  startEmptyWorkout: () => {
    set({
      activeWorkout: {
        name: 'Treino Livre',
        startTime: new Date().toISOString(),
        durationSeconds: 0,
        exercises: [],
      },
    });
  },

  addExerciseToActive: (exercise) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;

    const newExercise: ActiveExercise = {
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      sets: [
        { reps: 10, weight: 10, completed: false, previousReps: 10, previousWeight: 10 },
      ],
    };

    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: [...activeWorkout.exercises, newExercise],
      },
    });
  },

  removeExerciseFromActive: (index) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;

    const filtered = activeWorkout.exercises.filter((_, i) => i !== index);
    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: filtered,
      },
    });
  },

  addSetToActiveExercise: (exerciseIndex) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;

    const updatedExercises = [...activeWorkout.exercises];
    const targetEx = updatedExercises[exerciseIndex];
    const lastSet = targetEx.sets[targetEx.sets.length - 1] || { reps: 10, weight: 10 };

    targetEx.sets.push({
      reps: lastSet.reps,
      weight: lastSet.weight,
      completed: false,
      previousWeight: lastSet.weight,
      previousReps: lastSet.reps,
    });

    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: updatedExercises,
      },
    });
  },

  removeSetFromActiveExercise: (exerciseIndex, setIndex) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;

    const updatedExercises = [...activeWorkout.exercises];
    const targetEx = updatedExercises[exerciseIndex];
    if (targetEx.sets.length <= 1) return; // Mantém pelo menos uma série

    targetEx.sets = targetEx.sets.filter((_, i) => i !== setIndex);
    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: updatedExercises,
      },
    });
  },

  updateSet: (exerciseIndex, setIndex, updates) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;

    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[exerciseIndex].sets[setIndex] = {
      ...updatedExercises[exerciseIndex].sets[setIndex],
      ...updates,
    };

    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: updatedExercises,
      },
    });
  },

  toggleSetComplete: (exerciseIndex, setIndex, autoTimerCallback) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;

    const updatedExercises = [...activeWorkout.exercises];
    const setItem = updatedExercises[exerciseIndex].sets[setIndex];
    const wasCompleted = setItem.completed;
    setItem.completed = !wasCompleted;

    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: updatedExercises,
      },
    });

    // Se acabou de marcar como concluído, dispara o cronômetro de descanso
    if (!wasCompleted) {
      const exerciseName = updatedExercises[exerciseIndex].name;
      get().startRestTimer(90, exerciseName);
      if (autoTimerCallback) {
        autoTimerCallback(90, exerciseName);
      }
    }
  },

  finishWorkout: async (userId) => {
    const { activeWorkout, logs } = get();
    if (!activeWorkout) return null;

    // Calcular XP ganho (100 XP base por treino finalizado + 10 XP por série completada)
    let totalCompletedSets = 0;
    activeWorkout.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed) totalCompletedSets++;
      });
    });

    const xpGained = 100 + (totalCompletedSets * 10);
    const duration = activeWorkout.durationSeconds;

    // 1. Salvar no Supabase (se houver conexão)
    try {
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL.includes('your-project')) {
        throw new Error('Supabase não conectado');
      }

      // Salva o log de treino
      const { data: logData, error: logError } = await supabase
        .from('workout_logs')
        .insert({
          user_id: userId,
          template_id: activeWorkout.templateId || null,
          name: activeWorkout.name,
          duration_seconds: duration,
          xp_gained: xpGained,
        })
        .select()
        .single();

      if (logError) throw logError;

      // Salva as séries realizadas
      if (logData) {
        const setInserts = activeWorkout.exercises.flatMap((ex) => 
          ex.sets.map((s, idx) => ({
            workout_log_id: logData.id,
            exercise_id: ex.id,
            set_index: idx,
            reps: s.reps,
            weight: s.weight,
            is_completed: s.completed,
          }))
        );

        // Se forem ids de mockup temporários (ex: 1, 2, 3), pode dar erro se o exercício não existir no banco.
        // Nesses casos, o fallback trata o erro para continuar
        const { error: setsError } = await supabase.from('set_logs').insert(setInserts);
        if (setsError) console.warn('Erro ao salvar as séries individuais:', setsError.message);
      }
    } catch (err) {
      console.warn('Erro ao salvar treino no Supabase (treino salvo localmente):', err);
    }

    // 2. Adicionar XP ao Perfil através da useAuthStore
    const authStore = useAuthStore.getState();
    const result = await authStore.addXp(xpGained);

    // 3. Atualizar logs locais
    const newLog: WorkoutLog = {
      id: Math.random().toString(),
      name: activeWorkout.name,
      duration_seconds: duration,
      xp_gained: xpGained,
      created_at: new Date().toISOString(),
    };

    set({
      logs: [newLog, ...logs],
      activeWorkout: null,
    });

    get().stopRestTimer();

    return {
      xp: xpGained,
      leveledUp: result.leveledUp,
      newLevel: result.newLevel,
    };
  },

  cancelWorkout: () => {
    set({ activeWorkout: null });
    get().stopRestTimer();
  },

  tickWorkoutTimer: () => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;
    set({
      activeWorkout: {
        ...activeWorkout,
        durationSeconds: activeWorkout.durationSeconds + 1,
      },
    });
  },

  // Rest Timer actions
  startRestTimer: (seconds, exerciseName) => {
    set({
      restTimerDuration: seconds,
      restTimerRemaining: seconds,
      restTimerActive: true,
      restTimerExerciseName: exerciseName,
    });
  },

  stopRestTimer: () => {
    set({
      restTimerActive: false,
      restTimerRemaining: 0,
    });
  },

  tickRestTimer: () => {
    const { restTimerRemaining, restTimerActive } = get();
    if (!restTimerActive || restTimerRemaining <= 0) return;

    if (restTimerRemaining === 1) {
      // Finalizou o timer
      set({
        restTimerRemaining: 0,
        restTimerActive: false,
      });
    } else {
      set({
        restTimerRemaining: restTimerRemaining - 1,
      });
    }
  },

  adjustRestTimer: (seconds) => {
    const { restTimerRemaining, restTimerActive } = get();
    if (!restTimerActive) return;
    const newRemaining = Math.max(restTimerRemaining + seconds, 0);
    if (newRemaining === 0) {
      set({
        restTimerRemaining: 0,
        restTimerActive: false,
      });
    } else {
      set({
        restTimerRemaining: newRemaining,
      });
    }
  },
}));
