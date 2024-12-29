import { create } from 'zustand';

interface CodeCascadeState {
  activeCode: string | null;
  language: string | null;
  isStreaming: boolean;
  showCodeView: boolean;
  streamBuffer: string;
}

interface CodeCascadeActions {
  setActiveCode: (code: string, lang?: string) => void;
  appendStreamingCode: (chunk: string) => void;
  clearCode: () => void;
  setIsStreaming: (streaming: boolean) => void;
}

type CodeCascadeStore = CodeCascadeState & CodeCascadeActions;

export const useCodeCascade = create<CodeCascadeStore>((set, get) => ({
  // Initial state
  activeCode: null,
  language: null,
  isStreaming: false,
  showCodeView: false,
  streamBuffer: '',

  // Actions
  setActiveCode: (code, lang) =>
    set({
      activeCode: code,
      language: lang,
      showCodeView: true,
      streamBuffer: '',
    }),

  appendStreamingCode: (chunk) => {
    const state = get();
    if (state.isStreaming) {
      set({
        streamBuffer: state.streamBuffer + chunk,
        showCodeView: true,
      });
    } else {
      set({
        activeCode: (state.activeCode || '') + chunk,
        showCodeView: true,
      });
    }
  },

  clearCode: () =>
    set({
      activeCode: null,
      language: null,
      isStreaming: false,
      showCodeView: false,
      streamBuffer: '',
    }),

  setIsStreaming: (streaming) => {
    const state = get();
    set({ isStreaming: streaming });

    if (!streaming && state.streamBuffer) {
      set({
        activeCode: (state.activeCode || '') + state.streamBuffer,
        streamBuffer: '',
      });
    }
  },
}));
