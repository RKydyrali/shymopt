import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Id } from '@convex/_generated/dataModel';

interface AuthState {
  userId: Id<"users"> | null;
  role: 'farmer' | 'buyer' | null;
  login: (id: Id<"users">, role: 'farmer' | 'buyer') => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      role: null,
      login: (id, role) => set({ userId: id, role }),
      logout: () => set({ userId: null, role: null }),
    }),
    {
      name: 'shym-auth',
      merge: (persistedState: any, currentState) => {
        const merged = { ...currentState, ...persistedState };
        if (
          merged.userId &&
          (typeof merged.userId !== 'string' ||
            !merged.userId.startsWith('k') ||
            merged.userId.includes('_'))
        ) {
          return { ...currentState, userId: null, role: null };
        }
        return merged;
      }
    }
  )
);
