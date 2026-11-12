import { useQuery } from "@tanstack/react-query";
import { useAuthStore, useAuthHasHydrated } from "@/apps/web-user/common/store/auth.store";
import { alarmApi } from "@/apps/web-user/features/alarm/apis/alarm.api";
import { alarmQueryKeys } from "@/apps/web-user/features/alarm/constants/alarmQueryKeys.constant";
import type { Alarm, AlarmNotificationItem } from "@/apps/web-user/features/alarm/types/alarm.type";
import { formatAlarmListLabels } from "@/apps/web-user/features/alarm/utils/format-alarm-datetime.util";

function mapNotificationsToAlarms(items: AlarmNotificationItem[]): Alarm[] {
  return items.map((n) => {
    const { date, time } = formatAlarmListLabels(n.createdAt);
    return {
      id: n.id,
      orderId: n.orderId ?? undefined,
      quoteRequestId: n.quoteRequestId ?? undefined,
      read: n.read,
      title: n.title,
      content: n.body,
      date,
      time,
    };
  });
}

export function useAlarmList() {
  const hasHydrated = useAuthHasHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);

  const query = useQuery({
    queryKey: alarmQueryKeys.list(),
    queryFn: async () => {
      const { items } = await alarmApi.getNotifications({ page: 1, limit: 100 });
      return mapNotificationsToAlarms(items);
    },
    enabled: hasHydrated && isAuthenticated && Boolean(accessToken),
  });
  // 조회 실패는 목록 화면이 "불러오지 못했어요 · 다시 시도"로 알린다(오류 창 없음)

  return query;
}
