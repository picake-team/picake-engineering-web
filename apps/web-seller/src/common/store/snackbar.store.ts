import { create } from "zustand";

/**
 * 휴대폰 화면 스낵바(한 일 + 되돌리기). 한 번에 하나만 보이고, 새로 띄우면 앞의 것을 바꾼다.
 * 짧은 안내·서버 오류·실시간 주문 알림은 위쪽 알림 배너(useAlertStore → ToastHost)를 쓴다.
 */
export interface SnackbarItem {
  id: number;
  message: string;
  /** 버튼 글자(예: "되돌리기") */
  actionLabel?: string;
  onAction?: () => void;
  /** 저절로 닫히기까지(ms) */
  duration?: number;
}

interface SnackbarStore {
  current: SnackbarItem | null;
  showSnackbar: (item: Omit<SnackbarItem, "id">) => void;
  hideSnackbar: (id: number) => void;
}

let nextId = 0;

export const useSnackbarStore = create<SnackbarStore>((set) => ({
  current: null,
  showSnackbar: (item) => {
    nextId += 1;
    set({ current: { ...item, id: nextId } });
  },
  hideSnackbar: (id) => set((s) => (s.current?.id === id ? { current: null } : s)),
}));
