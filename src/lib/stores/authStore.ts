import { createWithEqualityFn } from 'zustand/traditional';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export type AuthSession = {
  user: User | null;
  token: string | null;
  expiresAt?: number;
};

export const useAuthStore = createWithEqualityFn<AuthState>()(
  persist(
    set => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: updates =>
        set(state => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'MaiWatch-auth-storage',
    }
  )
);

// Selectors
export const useAuth = () =>
  useAuthStore(state => ({
    isAuthenticated: state.isAuthenticated,
    token: state.token,
  }));

export const useUser = () => useAuthStore(state => state.user);

export const useSession = () =>
  useAuthStore(state => ({
    user: state.user,
    token: state.token,
  }));

export const useAuthActions = () =>
  useAuthStore(state => ({
    login: state.login,
    logout: state.logout,
    updateUser: state.updateUser,
  }));
