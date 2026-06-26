import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  role: 'user' | 'trainer';
  level: number;
  xp: number;
  daily_streak: number;
  last_active_date: string | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  setSession: (session: Session | null) => Promise<void>;
  fetchProfile: (userId: string) => Promise<Profile | null>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
  addXp: (amount: number) => Promise<{ leveledUp: boolean; newLevel: number }>;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  initialized: false,

  setSession: async (session) => {
    const user = session?.user ?? null;
    set({ session, user, loading: !!user });
    if (user) {
      const profile = await get().fetchProfile(user.id);
      set({ profile, loading: false });
    } else {
      set({ profile: null, loading: false });
    }
  },

  fetchProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as Profile;
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      return null;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, session: null });
  },

  updateProfile: async (updates) => {
    const { user, profile } = get();
    if (!user || !profile) return false;
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      set({ profile: { ...profile, ...updates } });
      return true;
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      return false;
    }
  },

  addXp: async (amount) => {
    const { user, profile } = get();
    if (!user || !profile) return { leveledUp: false, newLevel: profile?.level || 1 };
    
    try {
      const newXp = (profile.xp || 0) + amount;
      // Fórmula de Level: 1 nível a cada 500 XP
      const newLevel = Math.floor(newXp / 500) + 1;
      const leveledUp = newLevel > (profile.level || 1);

      const updates = {
        xp: newXp,
        level: newLevel,
      };

      const success = await get().updateProfile(updates);
      if (success) {
        return { leveledUp, newLevel };
      }
      return { leveledUp: false, newLevel: profile.level };
    } catch (err) {
      console.error('Erro ao adicionar XP:', err);
      return { leveledUp: false, newLevel: profile.level };
    }
  },

  initializeAuth: () => {
    if (get().initialized) return;

    // Escuta mudanças no estado de autenticação
    supabase.auth.onAuthStateChange((_event, session) => {
      get().setSession(session);
    });

    // Pega a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      get().setSession(session);
    });

    set({ initialized: true });
  },
}));
