"use client";

import clsx from "clsx";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Icon } from "@/apps/web-user/common/components/icons";

interface EmptyStateProps {
  /** 안내 문구 */
  message: string;
  /** 컨테이너 클래스 오버라이드 (높이/패딩 등). 미지정 시 기본 py-10 적용 */
  className?: string;
  /**
   * 화면 하단까지 높이를 채우고 그 안에서 세로 가운데 정렬할지 여부.
   * 목록/탭처럼 화면 전체를 차지하는 빈 상태에 사용한다.
   * 슬라이더·바텀시트처럼 다른 UI 안에 박혀 있는 경우엔 켜지 않는다.
   */
  fill?: boolean;
  /** fill 사용 시 화면 하단에서 제외할 높이 (px). 하단 고정 네비가 있는 화면에서 사용 */
  fillOffset?: number;
  /** 문구 하단에 붙일 추가 요소 (버튼 등) */
  children?: ReactNode;
}

/**
 * 데이터가 없는 경우(빈 상태)를 표현하는 공용 컴포넌트.
 * 예약 내역 없음, 검색 결과 없음, 등록된 상품 없음 등 모든 no-data 상황에서 사용한다.
 * UI는 지도 스토어 목록(MapStoreListSection)의 빈 상태 디자인과 동일하다.
 */
export function EmptyState({
  message,
  className,
  fill = false,
  fillOffset = 0,
  children,
}: EmptyStateProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number>();

  // 자기 자신의 문서상 위치를 재서 "화면 높이 - 상단 위치"를 최소 높이로 잡는다.
  // 부모가 flex 컨테이너인지와 무관하게 동작하고, 화면을 넘겨 스크롤을 만들지도 않는다.
  useEffect(() => {
    if (!fill) return;
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      setMinHeight(Math.max(0, window.innerHeight - top - fillOffset));
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
  }, [fill, fillOffset]);

  return (
    <div
      ref={ref}
      className={clsx(
        "flex flex-col items-center justify-center",
        className ?? (fill ? "" : "py-10"),
      )}
      style={{ gap: 20, minHeight: fill ? minHeight : undefined }}
    >
      <Icon name="noData" width={62} height={57} className="shrink-0" />
      <span
        style={{
          fontWeight: 400,
          fontSize: 14,
          lineHeight: "140%",
          color: "#686864",
        }}
      >
        {message}
      </span>
      {children}
    </div>
  );
}
