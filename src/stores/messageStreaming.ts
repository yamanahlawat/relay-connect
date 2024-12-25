import { create } from 'zustand';

interface MessageStreamingState {
  initialMessageId: string | null;
  setInitialMessageId: (id: string | null) => void;
  clearInitialMessageId: () => void;
}

export const useMessageStreamingStore = create<MessageStreamingState>((set) => ({
  initialMessageId: null,
  setInitialMessageId: (id) => set({ initialMessageId: id }),
  clearInitialMessageId: () => set({ initialMessageId: null }),
}));
