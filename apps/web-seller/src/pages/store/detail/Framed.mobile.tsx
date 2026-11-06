/**
 * 휴대폰 디자인으로 아직 다시 그리지 않은 긴 입력 화면(상품 등록·수정, 피드, 스토어 정보).
 * 지금 PC 화면을 휴대폰 틀(뒤로 + 제목) 안에 담아 휴대폰에서도 모든 기능을 쓴다.
 */
import React from "react";
import { Link, useParams } from "react-router-dom";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { MobileFrame } from "@/apps/web-seller/common/components/layouts/MobileFrame";
import { StoreDetailProductCreatePage } from "@/apps/web-seller/pages/store/detail/products/Create";
import { StoreDetailProductDetailPage } from "@/apps/web-seller/pages/store/detail/products/Detail";
import { StoreDetailFeedListPage } from "@/apps/web-seller/pages/store/detail/feed/List";
import { StoreDetailFeedCreatePage } from "@/apps/web-seller/pages/store/detail/feed/Create";
import { StoreDetailFeedDetailPage } from "@/apps/web-seller/pages/store/detail/feed/Detail";
import { StoreDetailEditPage } from "@/apps/web-seller/pages/store/detail/Edit";
import { StoreCreatePage } from "@/apps/web-seller/pages/store/Create";

export const StoreDetailProductCreateMobilePage: React.FC = () => (
  <MobileFrame title="상품 등록">
    <StoreDetailProductCreatePage />
  </MobileFrame>
);

export const StoreDetailProductDetailMobilePage: React.FC = () => (
  <MobileFrame title="상품 수정">
    <StoreDetailProductDetailPage />
  </MobileFrame>
);

export const StoreDetailFeedListMobilePage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  return (
    <MobileFrame
      title="피드"
      actions={
        <Link
          to={ROUTES.STORE_DETAIL_FEED_CREATE(storeId)}
          className="mr-1 inline-flex min-h-11 items-center px-2 text-sub font-bold text-brand-ink"
        >
          + 피드 등록
        </Link>
      }
    >
      <StoreDetailFeedListPage />
    </MobileFrame>
  );
};

export const StoreDetailFeedCreateMobilePage: React.FC = () => (
  <MobileFrame title="피드 등록">
    <StoreDetailFeedCreatePage />
  </MobileFrame>
);

export const StoreDetailFeedDetailMobilePage: React.FC = () => (
  <MobileFrame title="피드 수정">
    <StoreDetailFeedDetailPage />
  </MobileFrame>
);

export const StoreDetailEditMobilePage: React.FC = () => (
  <MobileFrame title="스토어 정보">
    <StoreDetailEditPage />
  </MobileFrame>
);

/** 스토어 만들기(SC-65·66). 디자인 8-E·8-F로 다시 그리는 것은 다음 단계 */
export const StoreCreateMobilePage: React.FC = () => (
  <MobileFrame title="스토어 만들기">
    <StoreCreatePage />
  </MobileFrame>
);
