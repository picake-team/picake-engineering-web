import { useQuery } from "@tanstack/react-query";
import { useAuthStore, useAuthHasHydrated } from "@/apps/web-user/common/store/auth.store";
import { alarmApi } from "@/apps/web-user/features/alarm/apis/alarm.api";
import { alarmQueryKeys } from "@/apps/web-user/features/alarm/constants/alarmQueryKeys.constant";

export function useAlarmUnreadCount() {
  const hasHydrated = useAuthHasHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);

  const query = useQuery({
    queryKey: [...alarmQueryKeys.all, "unread"] as const,
    queryFn: () => alarmApi.getUnreadCount(),
    enabled: hasHydrated && isAuthenticated && Boolean(accessToken),
  });
  // 위쪽 지역 이름·알림 숫자 같은 바탕 조회는 실패해도 오류 창을 띄우지 않는다(목록 화면의 "다시 시도"와 겹치지 않게)

  return query;
}
