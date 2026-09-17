import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  name?: string;
  role: string;
  isOnboarded: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize from localStorage
  const storedToken = localStorage.getItem('auth_token');
  const storedUser = localStorage.getItem('auth_user');

  let initialUser: User | null = null;
  let initialToken: string | null = null;

  if (storedToken && storedUser) {
    try {
      initialUser = JSON.parse(storedUser);
      initialToken = storedToken;
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: !!initialToken,
    setAuth: (user: User, token: string) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      set({ user: null, token: null, isAuthenticated: false });
    },
    setUser: (user: User) => {
      localStorage.setItem('auth_user', JSON.stringify(user));
      set({ user });
    },
  };
});