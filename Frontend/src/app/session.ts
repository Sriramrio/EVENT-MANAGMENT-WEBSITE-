import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../domain/models';

interface SessionState {
  user: User | null;
  setUser: (user: User | null) => void;
  hasPermission: (permission: string) => boolean;
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      hasPermission: (permission) => {
        const user = get().user;
        if (!user || !Array.isArray(user.permissions)) return false;
        return user.permissions.includes(permission);
      },
    }),
    {
      name: 'msme_auth_session',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
