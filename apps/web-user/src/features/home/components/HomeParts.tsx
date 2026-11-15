"use client";

/**
 * 손님 홈의 칸들(2026-11-15 운영자가 칸마다 고른 모양, 시안 모음 아티팩트에서 고름).
 */
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/apps/web-user/common/components/icons";
import { cn } from "@/apps/web-user/common/lib/utils";
import { isProduction } from "@/apps/web-user/common/utils/environment.util";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { FadeInImage } from "@/apps/web-user/common/components/motion/FadeInImage";
import CakeListSlider from "@/apps/web-user/common/components/sliders/CakeListSlider";
import { useAlarmUnreadCount } from "@/apps/web-user/features/alarm/hooks/queries/useAlarmUnreadCount";
import { designImageSrc, getDesign } from "@/apps/web-user/features/design/utils/design.util";
import { buildQuoteNewHref } from "@/apps/web-user/features/quote/components/entry/QuoteEntry";
import { useProductList } from "@/apps/web-user/features/product/hooks/queries/useProductList";
import {
  ProductCategoryType as C,
  SortBy,
  type Product,
} from "@/apps/web-user/features/product/types/product.type";
import { PRODUCT_CATEGORY_LABEL } from "@/apps/web-user/features/product/constants/product-category.constant";
import {
  buildCategorySearchHref,
  buildSizeSearchHref,
} from "@/apps/web-user/features/search/utils/search-category.util";

const productHref = (id: string) => `${PATHS.PRODUCT.DETAIL(id)}?entry_point=home`;
/** 테스트 서버(staging·로컬)에서만 QA 화면 입구를 둔다(앱 안에는 주소창이 없어서) */
const showQaButton = !isProduction(process.env.NEXT_PUBLIC_NODE_ENV);

/** 칸 사이를 나누는 회색 띠(배민·파리바게뜨처럼 화면 끝까지) */
export function GrayBand({ className }: { className?: string }) {
  return <div aria-hidden className={cn("h-2 bg-gray-50", className)} />;
}

/** 칸 제목: 앞 말만 주황("어떤 날 케이크가 필요하세요?") */
export function SectionTitle({
  accent,
  rest,
  right,
}: {
  accent: string;
  rest: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 px-5 pb-[14px]">
      <h2 className="min-w-0 text-xl font-bold leading-[28px] text-gray-900">
        <span className="text-primary">{accent}</span>
        {rest}
      </h2>
      {right}
    </div>
  );
}

/**
 * 맨 위 줄: 로고 · 알림(동네는 홈에 두지 않고 검색 결과에서 고른다).
 * 검색창은 배너 아래 흰 판에 있고, 그 검색창이 화면 위로 지나가면 여기 검색 아이콘이 나온다
 */
export function HomeTopBar({ showSearchIcon = false }: { showSearchIcon?: boolean }) {
  const { data: unread = 0 } = useAlarmUnreadCount();
  return (
    <header className="sticky top-0 z-50 flex h-[56px] items-center gap-4 bg-white px-5">
      <span role="img" aria-label="픽케이크" className="shrink-0">
        <Icon name="logoPicake" width={30} height={30} />
      </span>
      <span className="flex-1" />
      {showQaButton && (
        <Link
          href={PATHS.QA}
          className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-3 py-1.5 text-xs font-bold text-yellow-400"
        >
          QA
        </Link>
      )}
      {showSearchIcon && (
        <Link
          href={PATHS.SEARCH}
          aria-label="검색"
          className="flex h-6 w-6 shrink-0 items-center justify-center text-gray-900"
        >
          <Icon name="search" width={24} height={24} />
        </Link>
      )}
      <Link
        href={PATHS.ALARM}
        className="relative flex shrink-0 items-center justify-center text-gray-900"
        aria-label={unread > 0 ? `알람, 미읽음 ${unread}건` : "알람"}
      >
        <Icon name="alarm" width={24} height={24} />
        {unread > 0 && (
          <span className="absolute right-[1px] top-[1px] h-1 w-1 rounded-full bg-primary" />
        )}
      </Link>
    </header>
  );
}

type Tile = { key: string; label: string; icon: string; href: string };
const ICONS = "/images/contents";
const categoryTile = (value: C, icon: string): Tile => ({
  key: value,
  label: PRODUCT_CATEGORY_LABEL[value],
  icon: `${ICONS}/${icon}`,
  href: buildCategorySearchHref(value),
});
const sizeTile = (size: string, icon: string): Tile => ({
  key: `size-${size}`,
  label: size,
  icon: `${ICONS}/${icon}`,
  href: buildSizeSearchHref(size),
});

/**
 * 카테고리 칸(11-15 운영자: 두 줄을 넘으면 옆으로 밀어서). 상황은 아래 "어떤 날" 칸이 맡고, 여기는 디자인·모양·크기·서비스.
 * 윗줄·아랫줄 순서 그대로 놓는다. 처음 화면에 왼쪽 다섯 칸씩(많이 찾는 것), 나머지는 밀면 나온다
 */
const TOP_ROW: Tile[] = [
  categoryTile(C.LETTERING, "category-lettering.svg"),
  categoryTile(C.DRAWING, "category-drawing.svg"),
  categoryTile(C.CHARACTER, "category-character.svg"),
  categoryTile(C.FLOWER, "category-flower.svg"),
  categoryTile(C.PHOTO, "category-photo.svg"),
  categoryTile(C.RIBBON, "category-ribbon.svg"),
  categoryTile(C.FRUIT, "category-fruit.svg"),
  categoryTile(C.SIMPLE, "category-simple.svg"),
];
const BOTTOM_ROW: Tile[] = [
  categoryTile(C.VINTAGE, "category-vintage.svg"),
  categoryTile(C.HEART, "category-heart.svg"),
  sizeTile("도시락", "category-lunchbox.svg"),
  categoryTile(C.SAME_DAY_PICKUP, "category-same-day-pickup.png"),
  categoryTile(C.SCULPTED, "category-sculpted.svg"),
  categoryTile(C.TWO_TIER, "category-two-tier.svg"),
  sizeTile("미니", "category-mini.svg"),
];
// 세로로 채워지는 격자라 윗줄·아랫줄을 번갈아 넣는다
const TILES_BY_COLUMN = TOP_ROW.flatMap((top, i) => [top, BOTTOM_ROW[i]].filter(Boolean));

export function CategoryTiles() {
  return (
    <nav
      aria-label="카테고리"
      // 칸 너비는 화면 폭과 상관없이 다섯 칸 반이 보이게(좁은 320은 56px 아래로 줄이지 않아 네 칸 반) — 잘린 칸이 밀 수 있다는 표시
      className="scrollbar-hide -mx-5 grid auto-cols-[max(56px,calc((100%_-_40px)/5.5))] grid-flow-col grid-rows-2 gap-x-[12px] gap-y-4 overflow-x-auto px-5"
    >
      {TILES_BY_COLUMN.map(({ key, label, icon, href }) => (
        <Link key={key} href={href} className="press flex w-full flex-col items-center gap-[6px]">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-gray-50">
            {/* 그림 PNG의 흰 바탕은 곱하기로 지운다 */}
            <Image
              src={icon}
              alt=""
              width={30}
              height={30}
              unoptimized
              className="h-[30px] w-[30px] object-contain mix-blend-multiply"
            />
          </span>
          <span className="whitespace-nowrap text-xs text-gray-700">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

/**
 * 어떤 날 칸: 상황 카테고리 7개(무슨 날·누구에게), 칸마다 정해 둔 디자인 사진.
 * 누르면 그 상황의 케이크 디자인. 시즌 칸은 그 시즌 디자인이 보일 때만(크리스마스 11월 1일 ~ 12월 25일)
 */
const OCCASIONS: { value: C; label: string; designId: string; seasonal?: boolean }[] = [
  { value: C.BIRTHDAY, label: "생일", designId: "sprinkle-mint-lettering" },
  { value: C.COUPLE, label: "연인·기념일", designId: "heart-love-red" },
  { value: C.THANKS, label: "부모님·감사", designId: "carnation-pearl" },
  { value: C.BABY, label: "백일·돌", designId: "baegil-gold-lettering" },
  { value: C.CONGRATS, label: "축하", designId: "white-wave-sparkler" },
  { value: C.WEDDING, label: "결혼·프로포즈", designId: "heart-white-engaged" },
  { value: C.SEASON, label: "크리스마스", designId: "christmas-wreath-lettering", seasonal: true },
];

/** 두 줄로 옆으로 넘기는 90px 사진, 이름은 사진 안 흰 이름표(11-15 운영자: E5) */
export function OccasionGrid({ showSeason }: { showSeason: boolean }) {
  const ordered = useMemo(() => {
    const items = OCCASIONS.filter((o) => showSeason || !o.seasonal).map((o) => {
      const design = getDesign(o.designId);
      return { ...o, src: design ? designImageSrc(design.image.thumb) : undefined };
    });
    // 세로로 채워지는 격자라, 윗줄이 앞 절반·아랫줄이 뒤 절반이 되게 섞는다
    const half = Math.ceil(items.length / 2);
    return items.slice(0, half).flatMap((o, i) => [o, items[i + half]].filter(Boolean));
  }, [showSeason]);
  return (
    <div className="scrollbar-hide grid auto-cols-[90px] grid-flow-col grid-rows-2 gap-x-[12px] gap-y-[12px] overflow-x-auto px-5">
      {ordered.map((o) => (
        <Link
          key={o.value}
          href={buildCategorySearchHref(o.value, "design")}
          className="press relative block h-[90px] w-[90px] overflow-hidden rounded-[22px] bg-gray-50"
        >
          {o.src && (
            // 이름표 글자가 같은 이름을 읽어 주므로 사진은 읽지 않는다
            <FadeInImage src={o.src} alt="" fill sizes="90px" className="object-cover" />
          )}
          <span className="absolute bottom-[6px] left-[6px] rounded-full bg-white/95 px-[8px] py-[3px] text-xs font-bold text-gray-900">
            {o.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

/** 케이크 디자인 카드 줄 맨 끝 견적 카드(11-15 운영자: Q3 자리 + T7 모양) */
export function QuoteEndCard() {
  return (
    <Link href={buildQuoteNewHref("HOME")} className="absolute inset-0 flex flex-col bg-white">
      <span className="relative block h-[58%]">
        <Image
          src="/images/quote/cake-bento.jpg"
          alt=""
          fill
          sizes="300px"
          className="object-cover"
        />
        <span className="absolute left-[12px] top-[12px] rounded-full bg-white/90 px-[10px] py-[4px] text-xs font-bold text-gray-900">
          견적
        </span>
      </span>
      <span className="flex flex-1 flex-col px-[18px] pb-[18px] pt-[16px]">
        <span className="block text-lg font-bold leading-[1.35] text-gray-900">
          찾는 디자인이 없으면
          <br />
          사진으로 물어보세요
        </span>
        <span className="mt-[6px] block text-sm text-gray-500">
          사진만 올리면 근처 가게 견적이 와요
        </span>
        <span className="mt-auto block text-[15px] font-bold text-primary">견적 받기 ›</span>
      </span>
    </Link>
  );
}

/** 바로 예약할 수 있는 케이크: 새로 들어온 / 많이 저장한 탭(11-15 운영자: P2). 동네로 거르지 않는다 */
const PRODUCT_TAB_KEY = "picake:homeProductTab";

export function ProductTabsSection() {
  const [tab, setTab] = useState<"latest" | "saved">("latest");
  // 상품을 보고 뒤로 오면 고르던 탭 그대로(첫 그림은 서버와 같게 "새로 들어온", 붙은 뒤 바꾼다)
  useEffect(() => {
    try {
      if (sessionStorage.getItem(PRODUCT_TAB_KEY) === "saved") setTab("saved");
    } catch {
      /* 저장소를 못 쓰면 처음 탭 */
    }
  }, []);
  const chooseTab = (next: "latest" | "saved") => {
    setTab(next);
    try {
      sessionStorage.setItem(PRODUCT_TAB_KEY, next);
    } catch {
      /* 저장소를 못 써도 이번 화면에서는 바뀐다 */
    }
  };
  const latest = useProductList({ sortBy: SortBy.LATEST, limit: 10 });
  const saved = useProductList({ sortBy: SortBy.POPULAR, limit: 10 });
  const current = tab === "latest" ? latest : saved;
  const products: Product[] = current.data?.pages?.[0]?.data?.slice(0, 10) ?? [];
  const tabs = [
    { key: "latest", label: "새로 들어온" },
    { key: "saved", label: "많이 저장한" },
  ] as const;

  return (
    <section>
      <SectionTitle
        accent="바로 예약"
        rest="할 수 있는 케이크"
        right={
          <Link href={`${PATHS.SEARCH}?tab=product`} className="shrink-0 text-sm text-gray-500">
            더 보기 ›
          </Link>
        }
      />
      <div role="tablist" aria-label="상품 순서" className="flex gap-[8px] px-5 pb-[16px]">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`home-product-tab-${key}`}
            aria-controls="home-product-panel"
            aria-selected={tab === key}
            onClick={() => chooseTab(key)}
            className={cn(
              "h-[34px] rounded-full px-[14px] text-sm",
              tab === key ? "bg-primary-50 font-bold text-primary" : "bg-gray-50 text-gray-700",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="home-product-panel" aria-labelledby={`home-product-tab-${tab}`}>
        <CakeListSlider
          products={products}
          isLoading={current.isLoading}
          onRetry={current.isError && !current.data ? () => void current.refetch() : undefined}
          getProductHref={productHref}
        />
      </div>
    </section>
  );
}
