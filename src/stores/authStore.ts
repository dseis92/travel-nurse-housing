import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

interface AuthState {
  // State
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  profile: null,
  session: null,
  loading: true,
  initialized: false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile }),

  setSession: (session) => set({ session }),

  setLoading: (loading) => set({ loading }),

  setInitialized: (initialized) => set({ initialized }),

  reset: () => set(initialState),
}));
