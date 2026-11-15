"use client";

/**
 * 홈 새 화면 시안(디자이너 확인용, /preview/home). 지금 홈(HomeScreen)은 그대로 둔다.
 *
 * 2026-11-15 운영자가 칸마다 고른 조합(시안 모음 아티팩트 "자"):
 * 검색 줄 → 배너(지금 홈 슬라이더 그대로, 11-15 운영자) → 공지 한 줄 → 카테고리 10개 → 회색 띠 → 어떤 날(두 줄 사진)
 * → 회색 띠 → 케이크 디자인(제목만 바꿈, 카드 줄 끝에 견적 카드) → 회색 띠 → 바로 예약할 수 있는 케이크(탭).
 * 동네는 홈에 두지 않고 검색 결과에서 거른다. 확정되면 홈으로 옮기고 이 시안 주소는 지운다.
 */
import { BottomNav } from "@/apps/web-user/common/components/navigation/BottomNav";
import BannerSlider from "@/apps/web-user/features/home-banner/components/BannerSlider";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { DesignMagazineSection } from "@/apps/web-user/features/design/components/DesignMagazineSection";
import type { HomeBanner } from "@/apps/web-user/features/home-banner/types/home-banner.type";
import {
  CategoryTiles,
  GrayBand,
  HomeTopBar,
  NoticeLine,
  OccasionGrid,
  ProductTabsSection,
  QuoteEndCard,
  SectionTitle,
} from "@/apps/web-user/features/home/components/renewal/HomeRenewalParts";

export default function HomeRenewalScreen({
  initialBanners,
  magazineIds = [],
}: {
  initialBanners?: HomeBanner[];
  magazineIds?: string[];
}) {
  return (
    <div className="w-full pb-[110px]">
      <HomeTopBar />
      {/* 배너는 지금 홈 슬라이더 그대로. 아래 흰 판이 지금 홈처럼 30px 겹쳐 올라온다(점 표시 자리가 그 기준) */}
      <BannerSlider initialBanners={initialBanners} />
      <div className="relative z-10 -mt-[30px] rounded-t-4xl bg-white px-5 pb-[32px] pt-[20px] shadow-[0_-4px_32px_0_rgba(0,0,0,0.15)]">
        <NoticeLine />
        <div className="pt-[24px]">
          <CategoryTiles />
        </div>
      </div>
      <GrayBand className="mb-[24px]" />
      <section className="pb-[28px]">
        <SectionTitle accent="어떤 날" rest=" 케이크가 필요하세요?" />
        <OccasionGrid />
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
      <BottomNav activePath={PATHS.HOME} />
    </div>
  );
}
