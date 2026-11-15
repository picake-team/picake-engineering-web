"use client";

/**
 * 홈 새 화면 시안(/preview/home)의 칸들. 2026-11-15 운영자가 칸마다 고른 모양이다.
 * 디자이너가 확인하면 지금 홈(HomeScreen)으로 옮기고, 그때 이 파일 이름도 정리한다.
 */
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { Icon } from "@/apps/web-user/common/components/icons";
import { cn } from "@/apps/web-user/common/lib/utils";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { FadeInImage } from "@/apps/web-user/common/components/motion/FadeInImage";
import { Skeleton } from "@/apps/web-user/common/components/skeleton/Skeleton";
import CakeListSlider from "@/apps/web-user/common/components/sliders/CakeListSlider";
import { buildCategorySearchHref } from "@/apps/web-user/common/components/categories/CategoryList";
import { useAlarmUnreadCount } from "@/apps/web-user/features/alarm/hooks/queries/useAlarmUnreadCount";
import { useHomeBanners } from "@/apps/web-user/features/home-banner/hooks/queries/useHomeBanners";
import type { HomeBanner } from "@/apps/web-user/features/home-banner/types/home-banner.type";
import { noticeApi } from "@/apps/web-user/features/notice/apis/notice.api";
import { noticeQueryKeys } from "@/apps/web-user/features/notice/constants/noticeQueryKeys.constant";
import type { Notice } from "@/apps/web-user/features/notice/types/notice.type";
import { MAP_LIST_CATEGORY_OPTIONS } from "@/apps/web-user/features/store/constants/map.constant";
import { designImageSrc, visibleDesigns } from "@/apps/web-user/features/design/utils/design.util";
import { buildQuoteNewHref } from "@/apps/web-user/features/quote/components/entry/QuoteEntry";
import { useProductList } from "@/apps/web-user/features/product/hooks/queries/useProductList";
import { SortBy, type Product } from "@/apps/web-user/features/product/types/product.type";

const productHref = (id: string) => `${PATHS.PRODUCT.DETAIL(id)}?entry_point=home`;

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

/** 맨 위 줄: 로고 · 검색창 · 알림(동네는 홈에 두지 않고 검색 결과에서 고른다) */
export function HomeTopBar() {
  const { data: unread = 0 } = useAlarmUnreadCount();
  return (
    <div className="sticky top-0 z-50 flex h-[56px] items-center gap-3 bg-white px-5">
      <span role="img" aria-label="픽케이크" className="shrink-0">
        <Icon name="logoPicake" width={30} height={30} />
      </span>
      <Link
        href={PATHS.SEARCH}
        className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-gray-50 px-4"
      >
        <Icon name="search" width={18} height={18} className="shrink-0 text-gray-800" />
        <span className="truncate text-sm text-gray-500">어떤 케이크를 찾으시나요?</span>
      </Link>
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
    </div>
  );
}

/** 양옆 배너가 조금 보이는 배너(놀·캐치테이블). 누르면 지금 배너처럼 링크로 */
export function PeekBanner({ initialBanners }: { initialBanners?: HomeBanner[] }) {
  const { data: banners = [], isLoading } = useHomeBanners(initialBanners);
  if (isLoading) {
    return (
      <div className="px-5">
        <Skeleton className="aspect-[1672/984] w-full rounded-2xl" />
      </div>
    );
  }
  if (banners.length === 0) return null;
  return (
    <Swiper
      modules={[Autoplay]}
      slidesPerView="auto"
      centeredSlides
      spaceBetween={8}
      loop={banners.length > 2}
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      className="w-full"
    >
      {banners.map((b, i) => {
        const body = (
          <span className="relative block aspect-[1672/984] overflow-hidden rounded-2xl bg-gray-50">
            <Image
              src={b.imageUrl}
              alt={`배너 ${i + 1}`}
              fill
              sizes="(max-width: 640px) 90vw, 600px"
              className="object-cover"
              priority={i === 0}
            />
            <span className="absolute bottom-[12px] right-[12px] rounded-full bg-black/35 px-[9px] py-[3px] text-2xs font-medium tabular-nums text-white">
              {i + 1} / {banners.length}
            </span>
          </span>
        );
        return (
          <SwiperSlide key={b.id} style={{ width: "calc(100% - 40px)" }}>
            {b.linkUrl ? (
              b.linkUrl.startsWith("http") ? (
                <a href={b.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
                  {body}
                </a>
              ) : (
                <Link href={b.linkUrl} className="block">
                  {body}
                </Link>
              )
            ) : (
              body
            )}
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}

/** 배너 아래 한 줄: 가장 최근 공지. 공지가 없거나 받지 못하면 줄을 그리지 않는다(오류 창 없음) */
export function NoticeLine() {
  const { data } = useQuery<Notice[]>({
    queryKey: noticeQueryKeys.list(),
    queryFn: async () => (await noticeApi.getNotices()).data,
  });
  const latest = useMemo(
    () => [...(data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],
    [data],
  );
  if (!latest) return null;
  return (
    <Link
      href={PATHS.NOTICE}
      className="flex h-[44px] items-center gap-[10px] rounded-xl bg-gray-50 px-[14px]"
    >
      <span className="shrink-0 text-sm font-bold text-gray-900">공지</span>
      <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{latest.title}</span>
      <span aria-hidden className="shrink-0 text-gray-400">
        ›
      </span>
    </Link>
  );
}

const CATEGORY_ICONS: Record<string, string> = {
  BIRTHDAY: "/images/contents/category-birthday.png",
  LOVER: "/images/contents/category-lover.png",
  FRIEND: "/images/contents/category-friend.png",
  FAMILY: "/images/contents/category-family.svg",
  ANNIVERSARY: "/images/contents/category-anniversary.svg",
  SAME_DAY_PICKUP: "/images/contents/category-same-day-pickup.png",
  CHARACTER: "/images/contents/category-character.svg",
  SIMPLE: "/images/contents/category-simple.svg",
  FLOWER: "/images/contents/category-flower.svg",
  PHOTO: "/images/contents/category-photo.svg",
};

/** 카테고리 10개(5×2). 지금 그림 그대로, 회색 둥근 칸 */
export function CategoryTiles() {
  const items = MAP_LIST_CATEGORY_OPTIONS.filter((o) => CATEGORY_ICONS[o.value]);
  const rows = [items.slice(0, 5), items.slice(5)];
  return (
    <nav aria-label="카테고리" className="flex flex-col gap-4">
      {rows.map((row, r) => (
        <div key={r} className="flex justify-between">
          {row.map(({ value, label }) => (
            <Link
              key={value}
              href={buildCategorySearchHref(value)}
              // 320px 폭에서는 다섯 칸(58px)이 서로 붙어 조금 작아지게
              className="press flex w-[58px] max-w-[19%] flex-col items-center gap-[6px]"
            >
              <span className="flex aspect-square w-full items-center justify-center rounded-[18px] bg-gray-50">
                {/* 그림 PNG의 흰 바탕은 곱하기로 지운다 */}
                <Image
                  src={CATEGORY_ICONS[value]}
                  alt=""
                  width={34}
                  height={34}
                  unoptimized
                  className="h-[34px] w-[34px] object-contain mix-blend-multiply"
                />
              </span>
              <span className="whitespace-nowrap text-xs text-gray-700">{label}</span>
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

/** 어떤 날 칸: 케이크 디자인 모음에서 그 상황의 사진(시즌 사진은 뒤로) */
const OCCASIONS: { value: string; label: string }[] = [
  { value: "BIRTHDAY", label: "생일" },
  { value: "LOVER", label: "연인" },
  { value: "FRIEND", label: "친구" },
  { value: "FAMILY", label: "가족" },
  { value: "ANNIVERSARY", label: "기념일" },
  { value: "FLOWER", label: "꽃" },
  { value: "LETTERING", label: "레터링" },
  { value: "SIMPLE", label: "심플" },
];

/** 두 줄로 옆으로 넘기는 90px 사진, 이름은 사진 안 흰 이름표(11-15 운영자: E5) */
export function OccasionGrid() {
  const items = useMemo(() => {
    const all = visibleDesigns();
    const used = new Set<string>();
    return OCCASIONS.map((o) => {
      const has = (d: (typeof all)[number]) => (d.occasions as string[]).includes(o.value);
      // 같은 사진이 두 칸에 나오지 않게, 크리스마스처럼 시즌 사진은 맞는 게 없을 때만
      const d =
        all.find((x) => has(x) && !used.has(x.id) && !x.seasonal) ??
        all.find((x) => has(x) && !used.has(x.id)) ??
        all.find(has);
      if (d) used.add(d.id);
      return { ...o, src: d ? designImageSrc(d.image.thumb) : undefined };
    });
  }, []);
  // 세로로 채워지는 격자라, 윗줄이 앞 4개·아랫줄이 뒤 4개가 되게 섞는다
  const ordered = items.slice(0, 4).flatMap((o, i) => [o, items[i + 4]].filter(Boolean));
  return (
    <div className="scrollbar-hide grid auto-cols-[90px] grid-flow-col grid-rows-2 gap-x-[12px] gap-y-[12px] overflow-x-auto px-5">
      {ordered.map((o) => (
        <Link
          key={o.value}
          href={`/search?tab=design&category=${o.value}`}
          className="press relative block h-[90px] w-[90px] overflow-hidden rounded-[22px] bg-gray-50"
        >
          {o.src && (
            <FadeInImage src={o.src} alt={o.label} fill sizes="90px" className="object-cover" />
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
export function ProductTabsSection() {
  const [tab, setTab] = useState<"latest" | "saved">("latest");
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
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "h-[34px] rounded-full px-[14px] text-sm",
              tab === key ? "bg-primary-50 font-bold text-primary" : "bg-gray-50 text-gray-700",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <CakeListSlider
        products={products}
        isLoading={current.isLoading}
        onRetry={current.isError && !current.data ? () => void current.refetch() : undefined}
        getProductHref={productHref}
      />
    </section>
  );
}
