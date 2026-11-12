import type { PaginationMeta } from "@/apps/web-user/common/types/api.type";

/** 알림 탭(`/alarm`) 목록 한 줄 UI 모델 */
export interface Alarm {
  id: string;
  /** 주문 알림인 경우 예약 상세로 이동할 때 사용 */
  orderId?: string;
  /** 견적 알림(기획 I-46 ②)이면 견적 요청 상세로 */
  quoteRequestId?: string;
  read?: boolean;
  imageUrl?: string;
  title: string;
  content: string;
  date: string;
  time: string;
}

/** GET `/notifications` 응답의 한 건 (USER_WEB 주문·견적 알림) */
export interface AlarmNotificationItem {
  id: string;
  createdAt: string;
  appSurface: "USER_WEB";
  title: string;
  body: string;
  read: boolean;
  /** 견적 알림이 생기기 전 서버는 이 칸을 보내지 않았다 */
  category?: "ORDER" | "QUOTE";
  storeId: string | null;
  orderId: string | null;
  quoteRequestId?: string | null;
}

export interface AlarmNotificationListResult {
  items: AlarmNotificationItem[];
  meta: PaginationMeta;
}
