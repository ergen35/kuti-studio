import { persist } from "zustand/middleware";
import { create } from "zustand";

export type ThemeMode = "light" | "dark";
export type Locale = "en" | "fr";

type UIState = {
  theme: ThemeMode;
  locale: Locale;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setLocale: (locale: Locale) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "light",
      locale: "en",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "kuti-ui",
      partialize: (state) => ({ theme: state.theme, locale: state.locale }),
    },
  ),
);
