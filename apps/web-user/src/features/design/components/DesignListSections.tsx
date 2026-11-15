"use client";

import { LoadErrorState } from "@/apps/web-user/common/components/fallbacks/LoadErrorState";
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
  categories,
  sizes = [],
  search,
}: {
  /** 필터·주소의 카테고리(묶음 안은 또는, 묶음끼리는 그리고) */
  categories: readonly ProductCategoryType[];
  /** 필터·주소의 사이즈(도시락만 디자인을 거른다) */
  sizes?: readonly string[];
  search: string;
}) {
  const categoryKey = categories.join(",");
  const sizeKey = sizes.join(",");
  // 배열은 새로 만들어져도 값이 같으면 다시 거르지 않게 글자로 비교한다
  const { items, matched } = useMemo(
    () =>
      searchDesigns({
        categories: categoryKey ? (categoryKey.split(",") as ProductCategoryType[]) : [],
        sizes: sizeKey ? sizeKey.split(",") : [],
        q: search,
      }),
    [categoryKey, sizeKey, search],
  );
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    const key = `${categoryKey}:${search}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    trackEvent("view_design_list", {
      category: categoryKey || null,
      result_count: matched ? items.length : 0,
    });
  }, [categoryKey, search, items.length, matched]);

  return (
    <div>
      <p className="py-3 text-sm font-bold text-gray-500">
        총 <span className="text-gray-900">{items.length}</span>개
      </p>
      {!matched && (
        <p className="-mt-[4px] mb-[16px] text-2sm text-gray-500">
          맞는 디자인이 없어 전체를 보여 드려요
        </p>
      )}
      <DesignGrid designs={items} from="search" />
    </div>
  );
}

/** 저장 › 디자인 탭: 좋아요한 디자인(최근 순) */
export function LikedDesignSection() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useDesignLikes();
  const designs = (data?.myLikes ?? []).map((id) => getDesign(id)).filter((d) => d !== null);
  // 다른 저장 탭과 같게: 불러오는 중은 회색 칸, 못 불러오면 "다시 시도"(빈 화면으로 보이지 않게)
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-[10px] px-[20px] pt-[16px]">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-gray-50" />
        ))}
      </div>
    );
  }
  if (isError) return <LoadErrorState onRetry={() => void refetch()} />;
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
