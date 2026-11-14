/** 케이크 디자인 모음(기획 I-112) — 파일로 함께 배포하는 참고 사진과 미리 읽어 둔 값 */
import type { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";
import type { QuoteCakeSize, QuoteCream } from "@/apps/web-user/features/quote/types/quote.type";

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

/** "사진에서 읽은 것" 한 줄. value가 없으면 "사진으로는 알 수 없어요" */
export interface DesignReadRow {
  label: string;
  value: string | null;
}

/** 여러 장을 합칠 때 쓰는 조각(명사구) */
export interface DesignParts {
  shape: string;
  color: string;
  decoration: string | null;
  lettering: string | null;
}

export interface Design {
  id: string;
  name: string;
  occasions: ProductCategoryType[];
  /** 카드 둘째 줄의 모양 말(도시락·빈티지…) */
  style: string;
  seasonal: "CHRISTMAS" | null;
  image: { file: string; thumb: string; width: number; height: number };
  credit: DesignCredit;
  read: DesignReadRow[];
  parts: DesignParts;
  /** 한 장만 골랐을 때 설명 칸에 넣는 글("사진처럼 …") */
  description: string;
  size: QuoteCakeSize | null;
  creams: QuoteCream[];
  requestNote: string;
  tip: string | null;
  magazine: { order: number; title: string; subtitle: string } | null;
}
