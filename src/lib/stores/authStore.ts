/**
 * Consolidated Auth Store
 * Handles user authentication state and session management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  displayName?: string;
  role: 'user' | 'admin' | 'moderator';
  permissions: string[];
  preferences: {
    notifications: boolean;
    publicProfile: boolean;
    shareWatchHistory: boolean;
  };
  metadata?: {
    joinDate: string;
    lastLogin: string;
    subscriptionType: 'free' | 'premium' | 'pro';
    subscriptionExpiry?: string;
  };
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: 'Bearer';
  scope: string[];
}

export interface AuthState {
  // User state
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Registration/login flow state
  isRegistering: boolean;
  isLoggingIn: boolean;
  isRefreshing: boolean;
  
  // Actions
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // User actions
  updateUser: (updates: Partial<User>) => void;
  updatePreferences: (preferences: Partial<User['preferences']>) => void;
  updateAvatar: (avatar: string) => void;
  
  // State actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Token management
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  
  // Utility actions
  hasPermission: (permission: string) => boolean;
  hasRole: (role: User['role']) => boolean;
  isTokenExpired: () => boolean;
  refreshTokenIfNeeded: () => Promise<void>;
}

// Mock API functions (replace with real API calls)
const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === 'demo@novastream.com' && credentials.password === 'demo') {
      return {
        user: {
          id: 'demo-user',
          username: 'demo',
          email: credentials.email,
          displayName: 'Demo User',
          role: 'user' as const,
          permissions: ['watch', 'library'],
          preferences: {
            notifications: true,
            publicProfile: false,
            shareWatchHistory: false,
          },
          metadata: {
            joinDate: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            subscriptionType: 'free' as const,
          },
        },
        session: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
          tokenType: 'Bearer' as const,
          scope: ['read', 'write'],
        },
      };
    }
    
    throw new Error('Invalid credentials');
  },
  
  register: async (userData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      user: {
        id: 'new-user',
        username: userData.username,
        email: userData.email,
        displayName: userData.displayName || userData.username,
        role: 'user' as const,
        permissions: ['watch', 'library'],
        preferences: {
          notifications: true,
          publicProfile: false,
          shareWatchHistory: false,
        },
        metadata: {
          joinDate: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          subscriptionType: 'free' as const,
        },
      },
      session: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: Date.now() + (60 * 60 * 1000),
        tokenType: 'Bearer' as const,
        scope: ['read', 'write'],
      },
    };
  },
  
  refresh: async (refreshToken: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      accessToken: 'new-mock-access-token',
      refreshToken: 'new-mock-refresh-token',
      expiresAt: Date.now() + (60 * 60 * 1000),
      tokenType: 'Bearer' as const,
      scope: ['read', 'write'],
    };
  },
  
  logout: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  },
};

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isRegistering: false,
        isLoggingIn: false,
        isRefreshing: false,

        // Login action
        login: async (credentials) => {
          set({ isLoading: true, isLoggingIn: true, error: null });
          
          try {
            const response = await authApi.login(credentials);
            
            set({
              user: response.user,
              session: response.session,
              isAuthenticated: true,
              isLoading: false,
              isLoggingIn: false,
              error: null,
            });
            
            // Initialize sync with server
            window.dispatchEvent(new CustomEvent('auth:login', {
              detail: { user: response.user }
            }));
            
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Login failed',
              isLoading: false,
              isLoggingIn: false,
            });
          }
        },

        // Register action
        register: async (userData) => {
          set({ isLoading: true, isRegistering: true, error: null });
          
          try {
            const response = await authApi.register(userData);
            
            set({
              user: response.user,
              session: response.session,
              isAuthenticated: true,
              isLoading: false,
              isRegistering: false,
              error: null,
            });
            
            window.dispatchEvent(new CustomEvent('auth:register', {
              detail: { user: response.user }
            }));
            
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Registration failed',
              isLoading: false,
              isRegistering: false,
            });
          }
        },

        // Logout action
        logout: async () => {
          const { session } = get();
          
          set({ isLoading: true });
          
          try {
            if (session?.refreshToken) {
              await authApi.logout();
            }
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
            
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
        },

        // Refresh session action
        refreshSession: async () => {
          const { session, isRefreshing } = get();
          
          if (!session?.refreshToken || isRefreshing) return;
          
          set({ isRefreshing: true });
          
          try {
            const newSession = await authApi.refresh(session.refreshToken);
            
            set({
              session: newSession,
              isRefreshing: false,
              error: null,
            });
            
          } catch (error) {
            console.error('Session refresh failed:', error);
            
            // Refresh failed, logout user
            get().logout();
          }
        },

        // User actions
        updateUser: (updates) => 
          set((state) => ({
            user: state.user ? { 
              ...state.user, 
              ...updates,
              preferences: updates.preferences ? { ...state.user.preferences, ...updates.preferences } : state.user.preferences,
            } : null,
          })),

        updatePreferences: (preferences) => 
          set((state) => ({
            user: state.user 
              ? { ...state.user, preferences: { ...state.user.preferences, ...preferences } }
              : null,
          })),

        updateAvatar: (avatar) => 
          set((state) => ({
            user: state.user ? { ...state.user, avatar } : null,
          })),

        // State actions
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // Token management
        setSession: (session) => 
          set({ session, isAuthenticated: !!session.accessToken }),

        clearSession: () => 
          set({ session: null, isAuthenticated: false }),

        // Utility actions
        hasPermission: (permission) => {
          const { user, isAuthenticated } = get();
          return isAuthenticated && (user?.permissions.includes(permission) || user?.role === 'admin');
        },

        hasRole: (role) => {
          const { user } = get();
          return user?.role === role;
        },

        isTokenExpired: () => {
          const { session } = get();
          return session ? Date.now() >= session.expiresAt : true;
        },

        refreshTokenIfNeeded: async () => {
          const { isTokenExpired, refreshSession, isRefreshing } = get();
          
          if (isTokenExpired() && !isRefreshing) {
            await refreshSession();
          }
        },
      }),
      {
        name: 'novastream-auth',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          session: state.session,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);

// Selectors for optimized subscriptions
export const useAuth = () => 
  useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
  }), shallow);

export const useUser = () => useAuthStore((state) => state.user);

export const useSession = () => 
  useAuthStore((state) => ({
    session: state.session,
    isAuthenticated: state.isAuthenticated,
    isExpired: state.isTokenExpired(),
  }), shallow);

export const useAuthActions = () => 
  useAuthStore((state) => ({
    login: state.login,
    register: state.register,
    logout: state.logout,
    refreshSession: state.refreshSession,
    updateUser: state.updateUser,
    updatePreferences: state.updatePreferences,
    setLoading: state.setLoading,
    clearError: state.clearError,
  }));

// Token refresh middleware
if (typeof window !== 'undefined') {
  // Check token expiration periodically
  setInterval(() => {
    const authStore = useAuthStore.getState();
    if (authStore.isAuthenticated && authStore.isTokenExpired() && !authStore.isRefreshing) {
      authStore.refreshSession();
    }
  }, 60000); // Check every minute
  
  // Setup automatic token refresh before expiration
  useAuthStore.subscribe(
    (state) => state.session?.expiresAt,
    (expiresAt) => {
      if (expiresAt) {
        const timeUntilExpiry = expiresAt - Date.now();
        const refreshTime = timeUntilExpiry - (5 * 60 * 1000); // Refresh 5 minutes before expiry
        
        if (refreshTime > 0) {
          setTimeout(() => {
            const authStore = useAuthStore.getState();
            if (authStore.isAuthenticated && !authStore.isRefreshing) {
              authStore.refreshSession();
            }
          }, refreshTime);
        }
      }
    }
  );
}

// Development utilities
if (process.env.NODE_ENV === 'development') {
  useAuthStore.subscribe(
    (state) => state.isAuthenticated,
    (isAuthenticated) => {
      console.log(`🔐 Authentication state changed: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
    }
  );
}