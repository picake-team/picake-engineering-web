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
  role: "SIZE" | "EXTRA";
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
