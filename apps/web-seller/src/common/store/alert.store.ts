import { create } from "zustand";

export const ALERT_ERROR_TITLE = "알림";

export interface AlertItem {
  id: string;
  message: string;
  title?: string;
  severity: "error" | "warning" | "info" | "success";
  variant?: "filled" | "outlined" | "standard";
  autoHideDuration?: number | null; // null이면 자동으로 사라지지 않음
  /** 안내 오른쪽 글자 버튼(휴대폰 화면 "되돌리기" 등). 누르면 안내를 닫는다 */
  action?: { label: string; onClick: () => void };
}

interface AlertStore {
  alerts: AlertItem[];
  addAlert: (alert: Omit<AlertItem, "id">) => string;
  removeAlert: (id: string) => void;
  clearAllAlerts: () => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [],

  addAlert: (alert) => {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const title =
      alert.title === "오류"
        ? ALERT_ERROR_TITLE
        : (alert.title ?? (alert.severity === "error" ? ALERT_ERROR_TITLE : undefined));
    const newAlert: AlertItem = {
      ...alert,
      title,
      id,
      autoHideDuration: alert.autoHideDuration ?? 6000, // 기본 6초
    };

    set((state) => ({
      alerts: [...state.alerts, newAlert],
    }));

    return id;
  },

  removeAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== id),
    }));
  },

  clearAllAlerts: () => {
    set({ alerts: [] });
  },
}));
