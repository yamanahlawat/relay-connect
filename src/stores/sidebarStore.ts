import { create } from 'zustand';

interface SidebarStore {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isSidebarOpen: true, // default open state
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
