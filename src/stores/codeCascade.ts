import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CodeCascadeState {
  activeCode: string;
  language: string;
  isStreaming: boolean;
  showCodeView: boolean;
  userOpenedPanel: boolean;
  lastSessionId: string; // Track the session
  setActiveCode: (code: string, language?: string, shouldShowPanel?: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  clearCode: () => void;
}

// Generate a unique session ID on page load
const generateSessionId = () => Date.now().toString();
const currentSessionId = generateSessionId();

export const useCodeCascade = create<CodeCascadeState>()(
  persist(
    (set) => ({
      activeCode: '',
      language: '',
      isStreaming: false,
      showCodeView: false,
      userOpenedPanel: false,
      lastSessionId: currentSessionId, // Initialize with current session

      setActiveCode: (code, language = '', shouldShowPanel = false) => {
        set((state) => {
          const userOpened = shouldShowPanel ? true : state.userOpenedPanel;
          const shouldShow = shouldShowPanel || userOpened;

          return {
            activeCode: code,
            language: language || state.language,
            showCodeView: shouldShow,
            userOpenedPanel: userOpened,
            lastSessionId: currentSessionId, // Update session ID with current
          };
        });
      },

      setStreaming: (streaming) =>
        set((state) => {
          // If starting a stream in a new session (after page refresh)
          // clear the active code to prevent showing old code
          const isNewSession = state.lastSessionId !== currentSessionId;

          return {
            isStreaming: streaming,
            // Only show empty code view if starting streaming in a new session
            activeCode: streaming && isNewSession ? '' : state.activeCode,
            // When streaming starts, automatically show the code view
            showCodeView: streaming ? true : state.showCodeView,
            // When streaming starts, set userOpenedPanel to true to keep it open
            userOpenedPanel: streaming ? true : state.userOpenedPanel,
            // Always update to current session ID
            lastSessionId: currentSessionId,
          };
        }),

      clearCode: () =>
        set({
          activeCode: '',
          language: '',
          showCodeView: false,
          userOpenedPanel: false,
          // Don't reset session ID on manual clear
        }),
    }),
    {
      name: 'code-cascade-storage', // localStorage key
      // Only persist these fields
      partialize: (state) => ({
        activeCode: state.activeCode,
        language: state.language,
        lastSessionId: state.lastSessionId,
      }),
    }
  )
);
