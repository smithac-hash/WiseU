import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import moment from 'moment';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      currentMonth: moment().format('YYYY-MM'),
      
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setMonth: (month) => set({ currentMonth: month }),
      
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'wiseu-auth-storage',
    }
  )
);

export default useAuthStore;
