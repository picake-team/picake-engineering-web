import type { CakeSizeDisplayName } from "@/apps/web-seller/features/product/types/product.dto";

/** 네이버 상품 출처: 예약 상품(옵션까지) / 플레이스 메뉴(이름·가격·설명·사진만) */
export type NaverProductSource = "BOOKING" | "MENU";

export interface NaverProductLinkedDto {
  id: string;
  name: string;
}

export interface NaverProductListItemDto {
  itemKey: string;
  source: NaverProductSource;
  name: string;
  summary: string | null;
  priceText: string | null;
  imageUrl: string | null;
  isClosed: boolean;
  linkedProduct: NaverProductLinkedDto | null;
}

export interface NaverProductListResponseDto {
  source: NaverProductSource;
  fetchedAt: string;
  items: NaverProductListItemDto[];
  warnings: string[];
}

export interface NaverProductOptionDto {
  optionId: string;
  categoryName: string | null;
  name: string;
  desc: string | null;
  price: number | null;
  isSoldOut: boolean;
  role: "SIZE" | "FLAVOR" | "EXTRA" | "BASE";
  /** 옵션 사진 (미리보기용) */
  imageUrl: string | null;
  /** 추가 옵션으로 넣을 때의 그룹 이름 */
  groupName: string;
  /** 네이버에서 필수로 고르게 한 분류인지 */
  groupRequired: boolean;
  /** 이 옵션을 상품 하나로 이미 가져온 Picake 상품 */
  linkedProduct: NaverProductLinkedDto | null;
  sizeDisplayName: CakeSizeDisplayName | null;
  lengthCm: number | null;
  selectedByDefault: boolean;
  invalidReason: string | null;
}

export interface NaverProductDetailResponseDto {
  itemKey: string;
  source: NaverProductSource;
  fetchedAt: string;
  name: string;
  description: string | null;
  precautions: string | null;
  imageUrls: string[];
  options: NaverProductOptionDto[];
  suggestedSalePrice: number | null;
  isClosed: boolean;
  soldOutOptionNames: string[];
  /** 여러 상품을 옵션으로 묶은 네이버 상품(포장주문 등)으로 보이면 true */
  menuLike: boolean;
  linkedProduct: NaverProductLinkedDto | null;
  warnings: string[];
}

export interface ImportNaverImagesResponseDto {
  urls: string[];
  failedIndexes: number[];
}

export interface ProductNaverLinkResponseDto {
  productId: string;
  naverBizItemId: string | null;
  naverLinkedAt: string | null;
}

export interface ProductDescriptionDraftRequestDto {
  productName: string;
  sourceText?: string;
  sellerFacts?: string;
  optionSummary?: string;
}

export interface ProductDescriptionDraftResponseDto {
  paragraphs: string[];
  questions: string[];
  model: string;
}
