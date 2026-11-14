/** 케이크 디자인 모음(기획 I-112) — 파일로 함께 배포하는 참고 사진과 미리 읽어 둔 값 */
import type { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";

/** 사진에서 가져올 것. ALL = 전체 */
export type DesignPart = "ALL" | "SHAPE" | "COLOR" | "DECORATION" | "LETTERING";

/** 출처 종류. 1단계는 Picake가 고른 무료 사진만 있다(손님·가게가 올리기는 나중) */
export type DesignCreditKind = "FREE_PHOTO";

export interface DesignCredit {
  kind: DesignCreditKind;
  author: string;
  site: "Unsplash" | "Pexels" | "Pixabay";
  pageUrl: string;
  /** 무료 라이선스를 확인한 날 */
  checkedAt: string;
}

/**
 * 사진에서 읽은 것 4가지(모양·색·장식·글자). 상세 화면 줄, "가져올 것" 칩, 요청서 설명 줄,
 * 가게 화면이 모두 이 이름을 쓴다. null은 사진에 없는 것(줄을 숨긴다)
 */
export interface DesignParts {
  shape: string;
  color: string;
  decoration: string | null;
  lettering: string | null;
}

export interface Design {
  id: string;
  name: string;
  /** 홈 카테고리로 거를 때(넓게) */
  occasions: ProductCategoryType[];
  /** 해시태그로 보이는 상황: 사진 속 글자 등으로 확실한 것만 */
  tagOccasions: ProductCategoryType[];
  /** 카드 둘째 줄의 모양 말(도시락·빈티지…) */
  style: string;
  seasonal: "CHRISTMAS" | null;
  image: { file: string; thumb: string; width: number; height: number };
  credit: DesignCredit;
  parts: DesignParts;
  /** 상세 화면 검색 설명(메타 description)에 쓰는 한 문장 */
  description: string;
  magazine: { order: number; title: string; subtitle: string } | null;
}
