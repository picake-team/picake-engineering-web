"use client";

import { useEffect, useRef, useState } from "react";

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  /** 탭 이름 옆 작은 숫자(예: 답할 대화). 0이나 없으면 안 보임 */
  badge?: number;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  /** 탭 클릭 시 탭 바가 상단 헤더 바로 아래로 오도록 스크롤할지 여부 (기본 false) */
  scrollOnSelect?: boolean;
  /** 스크롤 시 제외할 상단 고정 헤더 높이 (px, 기본 52 = 탭 바 sticky 기준) */
  scrollOffset?: number;
  /** 콘텐츠 영역을 좌우로 스와이프해 이전/다음 탭으로 이동 (기본 false) */
  swipeable?: boolean;
  /** 탭이 전환될 때(클릭/스와이프 공통) 호출 — 애널리틱스 등 부가 로직용 */
  onTabChange?: (tabId: string) => void;
  /** 주면 바깥에서 고른 탭을 정한다(버튼으로 다른 탭으로 보낼 때). 바꾸는 것은 onTabChange에서 */
  activeTab?: string;
  /** 내용 칸 여백·바탕(기본 좌우 20·위아래 24, 흰 바탕) */
  contentClassName?: string;
}

/** 스와이프로 인정할 최소 가로 이동 거리(px) */
const SWIPE_THRESHOLD = 60;
/** 세로 스크롤과 구분하기 위한 가로/세로 이동 비율 */
const SWIPE_RATIO = 1.5;

/**
 * 터치 시작 지점이 가로 스크롤 요소(Swiper, 가로 리스트 등) 안이면 true.
 * 해당 요소의 자체 가로 제스처를 탭 전환이 가로채지 않도록 한다.
 */
function isInsideHorizontalScroller(target: EventTarget | null, boundary: HTMLElement | null) {
  let el = target instanceof HTMLElement ? target : null;
  while (el && el !== boundary) {
    if (el.classList.contains("swiper") || el.scrollWidth > el.clientWidth + 1) return true;
    el = el.parentElement;
  }
  return false;
}

export function Tabs({
  tabs,
  defaultTab,
  scrollOnSelect = false,
  scrollOffset = 52,
  swipeable = false,
  onTabChange,
  activeTab: controlledTab,
  contentClassName,
}: TabsProps) {
  const [ownTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id || "");
  const activeTab = controlledTab ?? ownTab;
  // sticky 탭 바는 붙어있을 때 위치가 52px로 고정돼 위치 계산이 불가하므로,
  // 바로 앞에 둔 비-sticky 앵커로 스크롤한다(scrollIntoView가 스크롤 컨테이너를 자동 탐색).
  const anchorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  // 탭 전환 애니메이션 방향 (1: 다음 탭, -1: 이전 탭)
  const [direction, setDirection] = useState<1 | -1>(1);
  // 콘텐츠 영역이 화면 하단까지만 정확히 채우도록 실측한 최소 높이 (px)
  const [contentMinHeight, setContentMinHeight] = useState<number>();

  // 콘텐츠 상단 위치는 위쪽 영역(스토어 소개 등) 높이에 따라 달라지므로 CSS 고정값으로는
  // 표현할 수 없다. 실제 위치를 재서 "화면 높이 - 콘텐츠 상단"을 최소 높이로 준다.
  // 값이 크면 페이지가 넘쳐 불필요한 스크롤이 생기므로 실측이 필요하다.
  useEffect(() => {
    if (!swipeable) return;
    const el = contentRef.current;
    if (!el) return;

    const measure = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      setContentMinHeight(Math.max(0, window.innerHeight - top));
    };

    measure();

    // 위쪽 콘텐츠(이미지 로드 등)로 레이아웃이 바뀌면 다시 측정
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [swipeable]);

  /** 방향을 계산해 탭을 전환. 같은 탭이거나 없는 탭이면 무시 */
  const selectTab = (tabId: string) => {
    const from = tabs.findIndex((tab) => tab.id === activeTab);
    const to = tabs.findIndex((tab) => tab.id === tabId);
    if (to === -1 || to === from) return false;

    setDirection(to > from ? 1 : -1);
    setActiveTab(tabId);
    onTabChange?.(tabId);
    return true;
  };

  const handleTabClick = (tabId: string) => {
    selectTab(tabId);

    if (!scrollOnSelect) return;

    // 콘텐츠 스왑 후 레이아웃이 반영된 다음 프레임에 스크롤
    requestAnimationFrame(() => {
      // scroll-margin-top(scrollOffset) 덕분에 헤더 높이만큼 띄워서 멈춘다
      anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!swipeable) return;
    if (isInsideHorizontalScroller(e.target, contentRef.current)) {
      touchStartRef.current = null;
      return;
    }
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!swipeable || !start) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    // 세로 스크롤 중이거나 이동량이 작으면 무시
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return;

    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (currentIndex === -1) return;

    // 왼쪽으로 스와이프 → 다음 탭, 오른쪽 → 이전 탭. 양 끝에서는 그대로 유지
    const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= tabs.length) return;

    selectTab(tabs[nextIndex].id);
  };

  return (
    <div className="bg-white rounded-xl">
      {/* 스크롤 기준 앵커 (sticky 아님: 탭 바의 실제 위치를 가리킴)
          scrollMarginTop = 헤더 높이만큼 띄워서 멈추도록 */}
      <div ref={anchorRef} aria-hidden className="h-0" style={{ scrollMarginTop: scrollOffset }} />
      {/* 탭 헤더 */}
      <div className="flex justify-center border-b border-gray-100 p-0 sticky top-[52px] bg-white z-30">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className="flex-1 h-[44px] flex items-center justify-center text-sm border-0 bg-transparent cursor-pointer transition-all duration-base"
          >
            <span
              className={`h-full flex items-center justify-center ${activeTab === tab.id ? "font-bold text-gray-900 border-b-2 border-gray-900" : "font-medium text-gray-500 border-b-2 border-transparent"}`}
            >
              {tab.label}
              {!!tab.badge && (
                <span className="ml-[4px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary-50 px-[5px] text-2xs font-bold text-primary">
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 (스와이프 시: 콘텐츠가 짧아도 화면 아래까지 터치 영역을 확보) */}
      <div
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`${contentClassName ?? "py-[24px] px-[20px]"} ${swipeable ? "flex flex-col" : ""}`}
        style={swipeable ? { minHeight: contentMinHeight } : undefined}
      >
        {/* key로 탭이 바뀔 때마다 진입 애니메이션을 다시 재생시킨다 */}
        <div
          key={swipeable ? activeTab : undefined}
          className={
            swipeable
              ? `flex flex-1 flex-col motion-reduce:animate-none ${
                  direction === 1 ? "animate-tab-in-forward" : "animate-tab-in-backward"
                }`
              : undefined
          }
        >
          {tabs.find((tab) => tab.id === activeTab)?.content}
        </div>
      </div>
    </div>
  );
}
