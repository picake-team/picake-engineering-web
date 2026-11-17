"use client";

/**
 * 손님 홈(2026-11-15 새 화면, 운영자가 칸마다 고름). 맨 위 줄(로고·알림)은 이 화면이 그린다(공통 머리줄 없음).
 * 로고·알림 → 배너(아래 흰 판이 30px 겹침) → 흰 판에 검색창·카테고리(6칸씩 두 줄 + 당일픽업 줄) → 회색 띠 → 어떤 날(동그란 사진 한 줄)
 * → 회색 띠 → 이런 디자인(카드 줄 끝에 견적 카드) → 회색 띠 → 바로 예약할 수 있는 케이크(탭)
 * → 회색 띠 → 운영사 정보(웹·앱 모두, 2026-11-17 네이버 로그인 검수 반려로 넣음).
 * 동네는 홈에 두지 않고 검색 결과에서 거른다. 배너는 서버가 미리 받아 넘기면(initialBanners) 첫 HTML에 그림이 들어간다(LCP).
 */
import { useEffect, useRef, useState } from "react";
import { BottomNav } from "@/apps/web-user/common/components/navigation/BottomNav";
import { BusinessInfoFooter } from "@/apps/web-user/common/components/layouts/BusinessInfoFooter";
import { SearchBar } from "@/apps/web-user/common/components/search/SearchBar";
import BannerSlider from "@/apps/web-user/features/home-banner/components/BannerSlider";
import { DesignMagazineSection } from "@/apps/web-user/features/design/components/DesignMagazineSection";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { useScrollRestoration } from "@/apps/web-user/common/hooks/useScrollRestoration";
import type { HomeBanner } from "@/apps/web-user/features/home-banner/types/home-banner.type";
import {
  CategoryTiles,
  GrayBand,
  HomeTopBar,
  OccasionGrid,
  ProductTabsSection,
  QuoteEndCard,
  SectionTitle,
} from "@/apps/web-user/features/home/components/HomeParts";

export default function HomeScreen({
  initialBanners,
  magazineIds = [],
  showSeason = false,
}: {
  initialBanners?: HomeBanner[];
  magazineIds?: string[];
  /** "어떤 날"에 시즌 칸(크리스마스)을 보일지. 서버가 날짜로 정해 넘긴다(매거진과 같게) */
  showSeason?: boolean;
}) {
  // 뒤로 오면 보던 자리 그대로(새로 들어오면 맨 위부터)
  useScrollRestoration();
  // 홈 화면 노출
  useEffect(() => {
    trackEvent("view_home");
  }, []);

  // 흰 판의 검색창이 맨 위 줄 아래로 지나가면 맨 위 줄에 검색 아이콘을 보인다
  const searchRef = useRef<HTMLDivElement>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  useEffect(() => {
    const el = searchRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSearchVisible(entry.isIntersecting),
      { rootMargin: "-56px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full pb-[110px]">
      <HomeTopBar showSearchIcon={!isSearchVisible} />
      <BannerSlider initialBanners={initialBanners} />
      <div className="relative z-10 -mt-[30px] rounded-t-4xl bg-white px-5 pb-[32px] pt-[20px] shadow-[0_-4px_32px_0_rgba(0,0,0,0.15)]">
        <div ref={searchRef}>
          {/* 홈에서는 입력받지 않고 누르면 바로 검색 페이지로 이동 */}
          <SearchBar placeholder="어떤 케이크를 찾으시나요?" asButton />
        </div>
        <div className="pt-[24px]">
          <CategoryTiles />
        </div>
      </div>
      <GrayBand />
      <section className="py-[28px]">
        <SectionTitle accent="어떤 날" rest=" 케이크가 필요하세요?" />
        <OccasionGrid showSeason={showSeason} />
      </section>
      <GrayBand />
      <DesignMagazineSection
        designIds={magazineIds}
        title={
          <>
            <span className="text-primary">이런 디자인</span>은 어떠세요?
          </>
        }
        tail={<QuoteEndCard />}
      />
      <GrayBand className="mb-[24px] mt-[28px]" />
      <ProductTabsSection />
      <GrayBand className="mt-[32px]" />
      <BusinessInfoFooter className="pt-[24px]" />
      <BottomNav />
    </div>
  );
}
