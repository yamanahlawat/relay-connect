import { create } from 'zustand';

interface CodeCascadeState {
  activeCode: string;
  language: string;
  isStreaming: boolean;
  isMultiLine: boolean;
  showCodeView: boolean;
  userOpenedPanel: boolean;
  lastSessionId: string; // Track the session
  setActiveCode: (code: string, language?: string, shouldShowPanel?: boolean) => void;
  setStreaming: (streaming: boolean, isMultiLine: boolean) => void;
  clearCode: () => void;
}

// Generate a unique session ID on page load
const generateSessionId = () => Date.now().toString();
const currentSessionId = generateSessionId();

export const useCodeCascade = create<CodeCascadeState>((set) => ({
  activeCode: '',
  language: '',
  isStreaming: false,
  isMultiLine: false,
  showCodeView: false,
  userOpenedPanel: false,
  lastSessionId: currentSessionId,

  setActiveCode: (code, language = '', shouldShowPanel = false) => {
    set((state) => {
      const userOpened = shouldShowPanel ? true : state.userOpenedPanel;
      const shouldShow = shouldShowPanel || userOpened;

      return {
        activeCode: code,
        language: language || state.language,
        showCodeView: shouldShow,
        userOpenedPanel: userOpened,
        lastSessionId: currentSessionId,
      };
    });
  },

  setStreaming: (streaming, isMultiLine = false) =>
    set((state) => {
      // If starting a stream in a new session (after page refresh)
      // clear the active code to prevent showing old code
      const isNewSession = state.lastSessionId !== currentSessionId;

      return {
        isStreaming: streaming,
        isMultiLine: isMultiLine,
        // Only show empty code view if starting streaming in a new session
        activeCode: streaming && isNewSession ? '' : state.activeCode,
        // When streaming starts for multi-line code, automatically show the code view
        showCodeView: streaming && isMultiLine ? true : state.showCodeView,
        // When streaming starts for multi-line code, set userOpenedPanel to true to keep it open
        userOpenedPanel: streaming && isMultiLine ? true : state.userOpenedPanel,
        // Always update to current session ID
        lastSessionId: currentSessionId,
      };
    }),

  clearCode: () =>
    set({
      activeCode: '',
      language: '',
      isMultiLine: false,
      showCodeView: false,
      userOpenedPanel: false,
      // Don't reset session ID on manual clear
    }),
}));
