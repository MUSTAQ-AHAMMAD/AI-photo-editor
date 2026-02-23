import { create } from 'zustand';

export type SidebarTab = 'create' | 'projects' | 'history' | 'templates' | 'settings';
export type AppTab = 'generate' | 'editor';

export interface GenerationSettings {
  genPrompt: string;
  genNegativePrompt: string;
  genEngineId: string;
  genStylePreset: string;
  genAspectRatio: string;
  genLighting: string;
  genCameraAngle: string;
  genGuidanceScale: number;
  genSeed: string;
  genOutputFormat: 'png' | 'jpeg' | 'webp';
}

interface AppStore extends GenerationSettings {
  sidebarTab: SidebarTab;
  appTab: AppTab;
  sidebarCollapsed: boolean;
  setSidebarTab: (tab: SidebarTab) => void;
  setAppTab: (tab: AppTab) => void;
  toggleSidebar: () => void;
  setGenSettings: (settings: Partial<GenerationSettings>) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarTab: 'create',
  appTab: 'generate',
  sidebarCollapsed: false,
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setAppTab: (tab) => set({ appTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  // Generation settings
  genPrompt: '',
  genNegativePrompt: '',
  genEngineId: 'placeholder',
  genStylePreset: 'none',
  genAspectRatio: '1:1',
  genLighting: 'natural',
  genCameraAngle: 'eye level',
  genGuidanceScale: 7.5,
  genSeed: '',
  genOutputFormat: 'png',
  setGenSettings: (settings) => set(settings),
}));
