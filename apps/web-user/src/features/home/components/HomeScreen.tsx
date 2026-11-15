"use client";

import { useEffect, useRef } from "react";
import { SearchBar } from "@/apps/web-user/common/components/search/SearchBar";
import BannerSlider from "@/apps/web-user/features/home-banner/components/BannerSlider";
import CakeListSlider from "@/apps/web-user/common/components/sliders/CakeListSlider";
import CategoryList from "@/apps/web-user/common/components/categories/CategoryList";
import { useProductList } from "@/apps/web-user/features/product/hooks/queries/useProductList";
import { SortBy, Product } from "@/apps/web-user/features/product/types/product.type";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { useHeaderStore } from "@/apps/web-user/common/store/header.store";
import { BottomNav } from "@/apps/web-user/common/components/navigation/BottomNav";
import { DesignMagazineSection } from "@/apps/web-user/features/design/components/DesignMagazineSection";
import { QuoteHomeCard } from "@/apps/web-user/features/quote/components/entry/QuoteEntry";
import { useRegionFilter } from "@/apps/web-user/common/hooks/useRegionFilter";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { useScrollRestoration } from "@/apps/web-user/common/hooks/useScrollRestoration";
import type { HomeBanner } from "@/apps/web-user/features/home-banner/types/home-banner.type";

const getHomeProductHref = (productId: string) =>
  `${PATHS.PRODUCT.DETAIL(productId)}?entry_point=home`;

/**
 * 손님 홈. 배너는 서버가 미리 받아 넘기면(initialBanners) 첫 HTML에 그림이 들어가 바로 받기 시작한다(첫 화면 LCP).
 */
export default function HomeScreen({
  initialBanners,
  magazineIds = [],
}: {
  initialBanners?: HomeBanner[];
  magazineIds?: string[];
}) {
  // 뒤로 오면 보던 자리 그대로(새로 들어오면 맨 위부터)
  useScrollRestoration();
  // 홈 화면 노출
  useEffect(() => {
    trackEvent("view_home");
  }, []);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const { setIsHomeSearchVisible } = useHeaderStore();
  // 헤더에서 고른 동네로 거르기(검색 결과와 같은 값)
  const { regions, isRegionSettled } = useRegionFilter();

  const {
    data: latestData,
    isLoading: isLatestLoading,
    isError: isLatestError,
    refetch: refetchLatest,
  } = useProductList({
    sortBy: SortBy.LATEST,
    limit: 10,
    regions,
    enabled: isRegionSettled,
  });

  const {
    data: popularData,
    isLoading: isPopularLoading,
    isError: isPopularError,
    refetch: refetchPopular,
  } = useProductList({
    sortBy: SortBy.POPULAR,
    limit: 10,
    regions,
    enabled: isRegionSettled,
  });

  useEffect(() => {
    const el = searchBarRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsHomeSearchVisible(entry.isIntersecting),
      { rootMargin: "-52px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [setIsHomeSearchVisible]);

  // 페이지 벗어날 때 초기화
  useEffect(() => {
    return () => setIsHomeSearchVisible(true);
  }, [setIsHomeSearchVisible]);

  const latestProducts: Product[] = latestData?.pages?.[0]?.data?.slice(0, 10) || [];
  const popularProducts: Product[] = popularData?.pages?.[0]?.data?.slice(0, 10) || [];

  return (
    <div className="w-full pb-[110px]">
      {/* 배너 */}
      <BannerSlider initialBanners={initialBanners} />
      {/* 검색 바 */}
      <div className="w-full relative -mt-[30px] pt-[20px] pb-[48px] px-[24px] z-10 rounded-t-4xl bg-white bg-[url('/images/contents/category_bg.png')] bg-bottom bg-no-repeat shadow-[0_-4px_32px_0_rgba(0,0,0,0.15)]">
        <div ref={searchBarRef} className="w-full mb-[20px]">
          {/* 홈에서는 입력받지 않고 누르면 바로 검색 페이지로 이동 */}
          <SearchBar placeholder="어떤 케이크를 찾으시나요?" asButton />
        </div>
        {/* 카테고리 */}
        <CategoryList />
      </div>

      {/* 신규케이크 (최신순) */}
      <div className="relative z-20 bg-white">
        {/* 견적 요청 카드(기획 I-46 SC-12): 카테고리 아래, 항상 같은 자리 */}
        <div className="px-[20px] pb-[8px]">
          <QuoteHomeCard />
        </div>
        {/* 케이크 디자인 매거진(기획 I-112): 견적 카드 아래, 신규케이크 위 */}
        <DesignMagazineSection designIds={magazineIds} />
        <CakeListSlider
          title="신규케이크"
          products={latestProducts}
          isLoading={!isRegionSettled || isLatestLoading}
          onRetry={isLatestError && !latestData ? () => void refetchLatest() : undefined}
          getProductHref={getHomeProductHref}
        />
      </div>

      {/* 인기케이크 (인기순) */}
      <CakeListSlider
        title="인기케이크"
        products={popularProducts}
        isLoading={!isRegionSettled || isPopularLoading}
        onRetry={isPopularError && !popularData ? () => void refetchPopular() : undefined}
        getProductHref={getHomeProductHref}
      />
      <BottomNav />
    </div>
  );
}
