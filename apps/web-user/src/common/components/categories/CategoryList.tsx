import Image from "next/image";
import Link from "next/link";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";
import { MAP_LIST_CATEGORY_OPTIONS } from "@/apps/web-user/features/store/constants/map.constant";
import { SEARCH_CATEGORY_PARAM } from "@/apps/web-user/features/search/utils/search-category.util";

/**
 * 홈 카테고리 그림. 파일은 빈 테두리 없이 칠해진 부분만 담는다 —
 * 그래서 칸 끝이 곧 그림 끝이고, 양 끝 칸의 그림이 검색창 양 끝과 맞는다.
 */
const CATEGORY_ICONS: Partial<Record<ProductCategoryType, string>> = {
  [ProductCategoryType.BIRTHDAY]: "/images/contents/category-birthday.png",
  [ProductCategoryType.LOVER]: "/images/contents/category-lover.png",
  [ProductCategoryType.FRIEND]: "/images/contents/category-friend.png",
  [ProductCategoryType.FAMILY]: "/images/contents/category-family.svg",
  [ProductCategoryType.ANNIVERSARY]: "/images/contents/category-anniversary.svg",
  [ProductCategoryType.SAME_DAY_PICKUP]: "/images/contents/category-same-day-pickup.png",
  [ProductCategoryType.CHARACTER]: "/images/contents/category-character.svg",
  [ProductCategoryType.SIMPLE]: "/images/contents/category-simple.svg",
  [ProductCategoryType.FLOWER]: "/images/contents/category-flower.svg",
  [ProductCategoryType.PHOTO]: "/images/contents/category-photo.svg",
};

/** 한 줄에 놓는 칸 수. 5칸씩 두 줄이면 화면 폭에 다 들어가 옆으로 넘기지 않는다 */
const PER_ROW = 5;

/** 이 카테고리로 좁힌 검색 결과 주소. 검색 화면이 category 값을 필터 "유형"에 넣는다 */
export function buildCategorySearchHref(category: ProductCategoryType): string {
  return `${PATHS.SEARCH}?${SEARCH_CATEGORY_PARAM}=${category}`;
}

/** 홈 카테고리: 검색 필터 "유형"과 같은 10개를 같은 순서로 */
export default function CategoryList() {
  const items = MAP_LIST_CATEGORY_OPTIONS.filter((option) => CATEGORY_ICONS[option.value]);
  const rows = [items.slice(0, PER_ROW), items.slice(PER_ROW)];

  return (
    <nav aria-label="카테고리" className="flex flex-col gap-6 py-5">
      {rows.map((row, index) => (
        <div key={index} className="flex justify-between">
          {row.map(({ value, label }) => (
            <Link
              key={value}
              href={buildCategorySearchHref(value)}
              // 그림 칸(36)보다 넓게 눌리도록 둘레를 넓힌다
              className="press relative flex w-9 flex-col items-center gap-2 after:absolute after:-inset-x-3 after:-inset-y-2 after:content-['']"
            >
              <Image
                src={CATEGORY_ICONS[value] as string}
                alt=""
                width={36}
                height={36}
                unoptimized
                className="h-9 w-9 object-contain"
              />
              <span className="whitespace-nowrap text-xs text-gray-700">{label}</span>
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
