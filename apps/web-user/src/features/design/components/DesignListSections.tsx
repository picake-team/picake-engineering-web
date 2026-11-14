"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import type { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";
import { DesignGrid } from "@/apps/web-user/features/design/components/DesignCard";
import { useDesignLikes } from "@/apps/web-user/features/design/hooks/useDesignLikes";
import { getDesign, searchDesigns } from "@/apps/web-user/features/design/utils/design.util";

/** 검색 결과 "디자인" 탭(기획 I-112 ②) */
export function DesignSearchSection({
  category,
  search,
}: {
  category: ProductCategoryType | null;
  search: string;
}) {
  const { items, matched } = useMemo(
    () => searchDesigns({ category, q: search }),
    [category, search],
  );
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    const key = `${category ?? ""}:${search}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    trackEvent("view_design_list", { category, result_count: matched ? items.length : 0 });
  }, [category, search, items.length, matched]);

  return (
    <div>
      <p className="py-3 text-sm font-bold text-gray-500">
        총 <span className="text-gray-900">{items.length}</span>개
      </p>
      <p className="-mt-[4px] mb-[16px] text-2sm text-gray-500">
        {matched ? (
          <>
            <span className="text-primary">✦</span> 고르면 견적 요청서가 저절로 채워져요
          </>
        ) : (
          "맞는 디자인이 없어 전체를 보여 드려요"
        )}
      </p>
      <DesignGrid designs={items} from="search" />
    </div>
  );
}

/** 저장 › 디자인 탭: 좋아요한 디자인(최근 순) */
export function LikedDesignSection() {
  const router = useRouter();
  const { data, isLoading } = useDesignLikes();
  const designs = (data?.myLikes ?? []).map((id) => getDesign(id)).filter((d) => d !== null);
  if (isLoading) return null;
  if (designs.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-260px)] flex-col items-center justify-center px-5 text-center">
        <p className="text-base font-bold text-gray-900">저장한 디자인이 없어요</p>
        <p className="mt-[8px] text-sm text-gray-500">디자인 모음에서 ♥를 누르면 여기에 모여요</p>
        <div className="mt-[18px] w-[160px]">
          <Button variant="outline" size="md" onClick={() => router.push("/search?tab=design")}>
            디자인 둘러보기
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="px-5 pb-[24px] pt-[18px]">
      <DesignGrid designs={designs} from="saved" />
    </div>
  );
}

/** 저장 탭 이름의 숫자 */
export function useLikedDesignCount(): number {
  const { data } = useDesignLikes();
  return (data?.myLikes ?? []).filter((id) => getDesign(id)).length;
}
