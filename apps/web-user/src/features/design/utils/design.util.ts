import { DESIGNS } from "@/apps/web-user/features/design/constants/designs.constant";
import type { Design, DesignPart } from "@/apps/web-user/features/design/types/design.type";
import { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";
import {
  PRODUCT_CATEGORY_GROUPS,
  PRODUCT_CATEGORY_LABEL,
  matchesProductCategories,
  productCategoryFromKeyword,
} from "@/apps/web-user/features/product/constants/product-category.constant";
import { buildCategorySearchHref } from "@/apps/web-user/features/search/utils/search-category.util";
import type { QuoteDraftPhoto } from "@/apps/web-user/features/quote/store/quote-draft.store";

export const DESIGN_IMAGE_BASE = "/images/designs";
export const designImageSrc = (file: string) => `${DESIGN_IMAGE_BASE}/${file}`;

const BY_ID = new Map(DESIGNS.map((d) => [d.id, d]));
export const getDesign = (id: string | null | undefined): Design | null =>
  (id && BY_ID.get(id)) || null;

/** 한국 시각 월·일 */
function kstMonthDay(now: Date): [number, number] {
  const k = new Date(now.getTime() + 9 * 3600_000);
  return [k.getUTCMonth() + 1, k.getUTCDate()];
}

/** 크리스마스 디자인은 11월 1일 ~ 12월 25일에만 보인다 */
export function isInSeason(d: Design, now = new Date()): boolean {
  if (d.seasonal !== "CHRISTMAS") return true;
  const [m, day] = kstMonthDay(now);
  return m === 11 || (m === 12 && day <= 25);
}

export function visibleDesigns(now = new Date()): Design[] {
  return DESIGNS.filter((d) => isInSeason(d, now));
}

/** 홈 매거진 카드(정해 둔 순서, 시즌이 지난 카드는 뺀다) */
export function magazineDesigns(now = new Date()): Design[] {
  return visibleDesigns(now)
    .filter((d) => d.magazine)
    .sort((a, b) => (a.magazine?.order ?? 0) - (b.magazine?.order ?? 0));
}

/**
 * 검색 결과 디자인 탭: 카테고리(묶음 안은 또는, 묶음끼리는 그리고) 또는 검색어로 거른다(맞는 게 없으면 전체).
 * 검색어가 카테고리와 같은 뜻이면(남친 → 연인·기념일) 그 카테고리 디자인도 찾는다(상품 검색과 같게)
 */
export function searchDesigns(
  { categories, q }: { categories: readonly ProductCategoryType[]; q: string },
  now = new Date(),
): { items: Design[]; matched: boolean } {
  const all = visibleDesigns(now);
  let items = all;
  if (categories.length)
    items = items.filter((d) => matchesProductCategories(d.occasions, categories));
  const trimmed = q.trim();
  const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length) {
    const keywordCategory = productCategoryFromKeyword(trimmed);
    items = items.filter((d) => {
      if (keywordCategory && d.occasions.includes(keywordCategory)) return true;
      const text = [d.name, d.style, d.description, ...Object.values(d.parts)]
        .join(" ")
        .toLowerCase();
      return words.every((w) => text.includes(w));
    });
  }
  return items.length ? { items, matched: true } : { items: all, matched: false };
}

/** 비슷한 디자인: 같은 모양 먼저, 그다음 같은 상황 */
export function similarDesigns(design: Design, limit = 6, now = new Date()): Design[] {
  const others = visibleDesigns(now).filter((d) => d.id !== design.id);
  const score = (d: Design) =>
    (d.style === design.style ? 2 : 0) +
    d.occasions.filter((o) => design.occasions.includes(o)).length;
  return others
    .map((d) => ({ d, s: score(d) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.d);
}

/** 상황 카테고리(무슨 날·누구에게) */
const SITUATIONS = new Set<ProductCategoryType>(
  PRODUCT_CATEGORY_GROUPS.find((group) => group.key === "situation")?.options.map((o) => o.value) ??
    [],
);

/** 해시태그 이름. 시즌은 그 디자인의 시즌 이름(크리스마스) */
function tagLabel(d: Design, value: ProductCategoryType): string {
  if (value === ProductCategoryType.SEASON && d.seasonal === "CHRISTMAS") return "크리스마스";
  return PRODUCT_CATEGORY_LABEL[value] ?? value;
}

/** 카드 둘째 줄: 사진으로 확실한 상황 하나 + 모양("생일 · 도시락", "크리스마스") */
export function designCaption(d: Design): string {
  const situation = d.tagOccasions.find((o) => SITUATIONS.has(o));
  return [situation ? tagLabel(d, situation) : null, d.style]
    .filter((v, i, all): v is string => !!v && all.indexOf(v) === i)
    .join(" · ");
}

/**
 * 상세 이름 아래 해시태그: 사진으로 확실한 카테고리(누르면 그 카테고리 디자인) + 모양 말(누르면 그 말로 찾기).
 * 모양 말이 카테고리와 같은 뜻이면(플라워 = 꽃, 크리스마스 = 시즌) 한 번만
 */
export function designHashtags(d: Design): { label: string; href: string }[] {
  const tags = d.tagOccasions.map((o) => ({
    label: `#${tagLabel(d, o)}`,
    href: buildCategorySearchHref(o, "design"),
  }));
  const styleCategory = productCategoryFromKeyword(d.style);
  const hasStyle =
    tags.some((t) => t.label === `#${d.style}`) ||
    (styleCategory !== undefined && d.tagOccasions.includes(styleCategory));
  if (!hasStyle)
    tags.push({
      label: `#${d.style}`,
      href: `/search?tab=design&q=${encodeURIComponent(d.style)}`,
    });
  return tags;
}

/** 사진 읽기 끄기(그 휴대폰에 기억) */
const READ_OFF_KEY = "picake:photoReadOff";
export function isPhotoReadOff(): boolean {
  try {
    return window.localStorage.getItem(READ_OFF_KEY) === "1";
  } catch {
    return false;
  }
}
export function setPhotoReadOff(off: boolean) {
  try {
    if (off) window.localStorage.setItem(READ_OFF_KEY, "1");
    else window.localStorage.removeItem(READ_OFF_KEY);
  } catch {
    /* 저장 못 해도 이번 화면에서는 따른다 */
  }
}

/** 디자인 모음 사진을 요청서 사진으로(파일 대신 주소와 디자인 번호) */
export function designPhotos(ids: string[], parts: DesignPart[] = ["ALL"]): QuoteDraftPhoto[] {
  return ids
    .map((id) => getDesign(id))
    .filter((d) => d !== null)
    .map((d) => ({
      id: `design-${d.id}-${Date.now()}`,
      dataUrl: designImageSrc(d.image.file),
      designId: d.id,
      parts,
    }));
}

/** 디자인 상세 주소(어디서 왔는지 from) */
export const designDetailHref = (id: string, from?: string) =>
  `/design/${encodeURIComponent(id)}${from ? `?from=${from}` : ""}`;

/** 디자인 상세·매거진에서 요청서로 가는 주소 */
export const designQuoteHref = (ids: string[], parts?: DesignPart[]) =>
  `/quote/new?entry=DESIGN&designId=${ids.map(encodeURIComponent).join(",")}${
    parts && !parts.includes("ALL") && parts.length ? `&parts=${parts.join(",")}` : ""
  }`;
