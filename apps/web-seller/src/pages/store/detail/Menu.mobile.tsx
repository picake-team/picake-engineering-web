/**
 * 휴대폰 스토어 탭 (SC-88, 디자인 7-D): 스토어 카드(좋아요·평점·리뷰, 링크 보내기) + 내 스토어 + 설정.
 * 가끔 쓰는 기능을 이 탭에 모은다. 로그아웃과 앱 버전은 마이페이지 안.
 */
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { AppScreen, TabHeader } from "@/apps/web-seller/common/ui/Screen";
import { CircleIconButton } from "@/apps/web-seller/common/ui/Button";
import { ListRowButton, ListRowLink } from "@/apps/web-seller/common/ui/List";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { CUSTOMER_SUPPORT_URL } from "@/apps/web-seller/common/constants/customer-web.constant";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import { useMyStores } from "@/apps/web-seller/features/store/hooks/queries/useMyStores";
import { StoreSwitchSheet } from "@/apps/web-seller/features/store/components/mobile/StoreSwitchSheet";
import { ShareLinkSheet } from "@/apps/web-seller/features/store/components/mobile/ShareLinkSheet";
import type { StoreResponseDto } from "@/apps/web-seller/features/store/types/store.dto";
import { businessHoursSummary } from "@/apps/web-seller/features/store/utils/store-mobile.util";

function StoreCard({
  store,
  switchable,
  onSwitch,
  onShare,
}: {
  store: StoreResponseDto;
  switchable: boolean;
  onSwitch: () => void;
  onShare: () => void;
}) {
  const stats = [
    { label: "좋아요", value: store.likeCount.toLocaleString("ko-KR") },
    { label: "평균 평점", value: store.totalReviewCount ? store.averageRating.toFixed(1) : "–" },
    { label: "리뷰", value: `${store.totalReviewCount.toLocaleString("ko-KR")}건` },
  ];
  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-card border border-ink-100 p-4">
      <div className="flex items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-card bg-brand-tint">
          {store.logoImageUrl ? (
            <img src={store.logoImageUrl} alt="" className="size-full object-cover" />
          ) : null}
        </span>
        {switchable ? (
          <button
            type="button"
            onClick={onSwitch}
            aria-haspopup="dialog"
            className="flex min-h-11 min-w-0 flex-1 items-center gap-1 text-left text-heading font-bold text-ink-900"
          >
            <span className="truncate">{store.name}</span>
            <span className="shrink-0 text-ink-600">
              <Icon name="chevronDown" size={18} strokeWidth={2} />
            </span>
            <span className="sr-only">스토어 바꾸기</span>
          </button>
        ) : (
          <span className="min-w-0 flex-1 truncate text-heading font-bold text-ink-900">
            {store.name}
          </span>
        )}
        <CircleIconButton
          icon="share"
          label="손님에게 링크 보내기"
          className="-m-0.5"
          onClick={onShare}
        />
      </div>
      <div className="-mx-4 -mb-4 mt-1 grid grid-cols-3 border-t border-ink-100">
        {stats.map((s, i) => (
          <span
            key={s.label}
            className={`flex flex-col items-center gap-1 py-3 ${i > 0 ? "border-l border-ink-100" : ""}`}
          >
            <span className="text-heading font-bold tabular-nums text-ink-900">{s.value}</span>
            <span className="text-caption text-ink-600">{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-1 text-sub font-bold text-ink-700">{children}</h2>;
}

export const StoreDetailMenuMobilePage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const { data: store } = useStoreDetail(storeId);
  const { stores } = useMyStores();
  const [switchOpen, setSwitchOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <AppScreen tab="store" storeId={storeId} header={<TabHeader title="스토어" />}>
      {store ? (
        <StoreCard
          store={store}
          switchable={stores.length > 1}
          onSwitch={() => setSwitchOpen(true)}
          onShare={() => setShareOpen(true)}
        />
      ) : (
        <span className="block h-[150px] animate-pulse rounded-card bg-ink-50" aria-busy="true" />
      )}

      <GroupLabel>내 스토어</GroupLabel>
      <div className="-mt-2">
        <ListRowLink
          to={ROUTES.STORE_DETAIL_EDIT(storeId)}
          title="스토어 정보"
          description="소개·연락처·주소·정산 계좌·환불 규정"
          divider={false}
        />
        <ListRowLink
          to={ROUTES.STORE_DETAIL_HOURS(storeId)}
          title="영업시간"
          description={businessHoursSummary(store)}
          divider={false}
        />
        <ListRowLink
          to={ROUTES.STORE_DETAIL_FEED_LIST(storeId)}
          title="피드"
          description="손님에게 보이는 스토어 소식"
          divider={false}
        />
        <ListRowLink
          to={ROUTES.STORE_DETAIL_STATISTICS_ORDERS(storeId)}
          title="주문 통계"
          description="매출·주문 수·잘 팔리는 상품"
          divider={false}
        />
      </div>

      <GroupLabel>설정</GroupLabel>
      <div className="-mt-2">
        <ListRowLink
          to={ROUTES.STORE_DETAIL_NOTIFICATIONS_SETTINGS(storeId)}
          title="알림 설정"
          divider={false}
        />
        <ListRowButton
          onClick={() => setSwitchOpen(true)}
          title="스토어 바꾸기·새로 만들기"
          chevron
          divider={false}
        />
        <ListRowLink
          to={ROUTES.MYPAGE}
          title="마이페이지"
          description="프로필·휴대폰 번호·약관·로그아웃"
          divider={false}
        />
        <a
          href={CUSTOMER_SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-14 w-full items-center gap-3 py-2 active:bg-ink-50"
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

      <StoreSwitchSheet
        open={switchOpen}
        currentStoreId={storeId}
        onClose={() => setSwitchOpen(false)}
      />
      {store && shareOpen ? (
        <ShareLinkSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          storeId={storeId}
          storeName={store.name}
        />
      ) : null}
    </AppScreen>
  );
};
