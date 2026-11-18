import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import type { SellerNotificationItem } from "@/apps/web-seller/features/notification/types/notification.dto";

/**
 * 판매자 알림을 누르면 갈 곳. 주문 알림은 그 주문 상세, 스토어 안내(정산 계좌가 바뀜 등, 2026-11-18)는 스토어 정보 수정.
 * 옛 서버는 category를 보내지 않으므로 orderId가 있으면 주문 알림으로 본다.
 */
export function sellerNotificationPath(
  n: Pick<SellerNotificationItem, "storeId" | "orderId" | "category">,
): string {
  if (n.category !== "STORE" && n.orderId)
    return ROUTES.STORE_DETAIL_ORDERS_DETAIL(n.storeId, n.orderId);
  return ROUTES.STORE_DETAIL_EDIT(n.storeId);
}
