import { create } from 'zustand';

export type SidebarTab = 'create' | 'projects' | 'history' | 'templates' | 'settings';
export type AppTab = 'generate' | 'editor';

interface AppStore {
  sidebarTab: SidebarTab;
  appTab: AppTab;
  sidebarCollapsed: boolean;
  setSidebarTab: (tab: SidebarTab) => void;
  setAppTab: (tab: AppTab) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarTab: 'create',
  appTab: 'generate',
  sidebarCollapsed: false,
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setAppTab: (tab) => set({ appTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
