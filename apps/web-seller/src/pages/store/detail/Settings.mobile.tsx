/**
 * 휴대폰 설정 (SC-98): 스토어 탭 위쪽 오른쪽 톱니로 연다. 스토어와 관계없는 설정을 모은다(운영자 결정).
 * 알림 설정(이 스토어의 주문 알림·아침 요약·테스트 알림), 마이페이지(프로필·휴대폰 번호·약관·로그아웃·탈퇴, 앱 버전),
 * 문의하기(손님 앱 고객센터, 앱이면 휴대폰 브라우저로).
 */
import React from "react";
import { useParams } from "react-router-dom";
import { AppScreen, BackHeader } from "@/apps/web-seller/common/ui/Screen";
import { ListRowLink } from "@/apps/web-seller/common/ui/List";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { CUSTOMER_SUPPORT_URL } from "@/apps/web-seller/common/constants/customer-web.constant";
import { externalHref } from "@/apps/web-seller/common/utils/webview.bridge";

export const StoreSettingsMobilePage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  return (
    <AppScreen header={<BackHeader title="설정" />} bodyClassName="pt-2">
      <div className="-mt-1">
        <ListRowLink
          to={ROUTES.STORE_DETAIL_NOTIFICATIONS_SETTINGS(storeId)}
          title="알림 설정"
          description="주문 알림·아침 요약·테스트 알림"
          divider={false}
        />
        <ListRowLink
          to={ROUTES.MYPAGE}
          title="마이페이지"
          description="프로필·휴대폰 번호·약관·로그아웃"
          divider={false}
        />
        <a
          href={externalHref(CUSTOMER_SUPPORT_URL)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-13 w-full items-center gap-3 py-2 active:bg-ink-50"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-body font-semibold text-ink-900">문의하기</span>
            <span className="text-caption text-ink-600">손님 앱 고객센터로 열려요</span>
          </span>
          <span className="shrink-0 text-ink-400">
            <Icon name="external" size={18} strokeWidth={1.9} />
          </span>
        </a>
      </div>
    </AppScreen>
  );
};
