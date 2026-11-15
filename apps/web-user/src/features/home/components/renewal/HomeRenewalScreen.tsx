"use client";

/**
 * 홈 새 화면 시안(디자이너 확인용, /preview/home). 지금 홈(HomeScreen)은 그대로 둔다.
 *
 * 2026-11-15 운영자가 칸마다 고른 조합(시안 모음 아티팩트 "자"):
 * 검색 줄 → 양옆이 보이는 배너 → 공지 한 줄 → 카테고리 10개 → 회색 띠 → 어떤 날(두 줄 사진)
 * → 회색 띠 → 케이크 디자인(제목만 바꿈, 카드 줄 끝에 견적 카드) → 회색 띠 → 바로 예약할 수 있는 케이크(탭).
 * 동네는 홈에 두지 않고 검색 결과에서 거른다. 확정되면 홈으로 옮기고 이 시안 주소는 지운다.
 */
import { BottomNav } from "@/apps/web-user/common/components/navigation/BottomNav";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { DesignMagazineSection } from "@/apps/web-user/features/design/components/DesignMagazineSection";
import type { HomeBanner } from "@/apps/web-user/features/home-banner/types/home-banner.type";
import {
  CategoryTiles,
  GrayBand,
  HomeTopBar,
  NoticeLine,
  OccasionGrid,
  PeekBanner,
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
      <div className="pt-[8px]">
        <PeekBanner initialBanners={initialBanners} />
      </div>
      <div className="px-5 pt-[14px]">
        <NoticeLine />
      </div>
      <div className="px-5 pb-[32px] pt-[24px]">
        <CategoryTiles />
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
