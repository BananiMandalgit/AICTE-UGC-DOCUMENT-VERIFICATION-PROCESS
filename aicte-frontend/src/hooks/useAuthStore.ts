import { create } from "zustand";
import { persist } from "zustand/middleware";

type Mode = "institute" | "admin" | "evaluator" | null;

interface AuthState {
  token: string | null;
  mode: Mode;
  setTokenMode: (token: string, mode: Mode) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      mode: null,
      setTokenMode: (token, mode) => set({ token, mode }),
      logout: () => set({ token: null, mode: null }),
    }),
    { name: "auth-store" }
  )
);
