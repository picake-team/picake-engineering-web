"use client";

import { useEffect } from "react";
import Header from "@/apps/web-user/common/components/headers/Header";
import { Tabs } from "@/apps/web-user/common/components/tabs/Tabs";
import {
  UpcomingOrderList,
  useUpcomingOrderCount,
} from "@/apps/web-user/features/mypage/order/components/UpcomingOrderList";
import {
  PastOrderList,
  usePastOrderCount,
} from "@/apps/web-user/features/mypage/order/components/PastOrderList";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import type { ReservationTabName } from "@/apps/web-user/common/types/analytics.type";
import { IosCustomSchemeRedirect } from "@/apps/web-user/common/components/deep-link/IosCustomSchemeRedirect";
import { useScrollRestoration } from "@/apps/web-user/common/hooks/useScrollRestoration";

export default function MyOrdersPage() {
  // 뒤로 오면 보던 자리 그대로(새로 들어오면 맨 위부터)
  useScrollRestoration();
  const upcomingCount = useUpcomingOrderCount();
  const pastCount = usePastOrderCount();

  // "내 예약" 메뉴 진입 - 전체 예약 목록 화면 노출
  useEffect(() => {
    trackEvent("view_reservation_list");
  }, []);

  return (
    <div>
      <IosCustomSchemeRedirect />
      <Header variant="back-title" title="내 예약" />
      <Tabs
        defaultTab="upcoming"
        onTabChange={(tabId) => {
          trackEvent("engage_reservation_tab", { tab_name: tabId as ReservationTabName });
        }}
        tabs={[
          {
            id: "upcoming",
            label: `픽업 예정 ${upcomingCount}`,
            content: <UpcomingOrderList />,
          },
          {
            id: "past",
            label: `지난 예약 ${pastCount}`,
            content: <PastOrderList />,
          },
        ]}
      />
    </div>
  );
}
