"use client";

import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";
import { Button } from "@/apps/web-user/common/components/buttons/Button";

/**
 * 목록을 불러오지 못했을 때. "없어요" 빈 화면과 헷갈리지 않게 같은 자리·모양에 "다시 시도"를 둔다
 * (끊김·서버 오류에 "예약 내역이 없어요"처럼 보이던 것, 판매자 앱 LoadErrorState와 같은 뜻).
 */
export function LoadErrorState({
  onRetry,
  fill,
  fillOffset,
  className,
}: {
  onRetry: () => void;
  fill?: boolean;
  fillOffset?: number;
  className?: string;
}) {
  return (
    <EmptyState
      message="불러오지 못했어요. 잠시 뒤 다시 시도해 주세요."
      fill={fill}
      fillOffset={fillOffset}
      className={className}
    >
      <span>
        <Button variant="outline" size="md" className="px-[20px]" onClick={onRetry}>
          다시 시도
        </Button>
      </span>
    </EmptyState>
  );
}
