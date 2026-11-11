import { create } from "zustand";

/**
 * 채팅 신호(기획 I-11). 알림 소켓의 `chat_updated`를 받으면 그 방의 숫자를 올려 열린 방이 바로 새 글을 가져온다.
 * 소켓이 붙어 있는지도 여기서 본다(끊기면 3초마다 확인).
 */
interface ChatSignalState {
  socketConnected: boolean;
  ticks: Record<string, number>;
  setSocketConnected: (connected: boolean) => void;
  signal: (threadId: string) => void;
}

export const useChatSignalStore = create<ChatSignalState>((set) => ({
  socketConnected: false,
  ticks: {},
  setSocketConnected: (connected) => set({ socketConnected: connected }),
  signal: (threadId) =>
    set((s) => ({ ticks: { ...s.ticks, [threadId]: (s.ticks[threadId] ?? 0) + 1 } })),
}));
