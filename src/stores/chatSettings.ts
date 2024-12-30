import { defaultChatSettings } from '@/lib/defaults';
import { ChatSettings } from '@/types/chat';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatSettingsState {
  settings: ChatSettings;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  resetToDefaults: () => void;
}

export const useChatSettings = create<ChatSettingsState>()(
  persist(
    (set) => ({
      settings: defaultChatSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetToDefaults: () => set({ settings: defaultChatSettings }),
    }),
    {
      name: 'chat-settings-storage',
    }
  )
);
