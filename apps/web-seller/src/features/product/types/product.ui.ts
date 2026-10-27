import type {
  CreateProductRequestDto,
  CustomOptionDto,
  GetSellerProductsRequestDto,
  ProductType,
} from "@/apps/web-seller/features/product/types/product.dto";

/** UI 폼 상태 (CreateProductRequestDto에서 storeId 제외, 폼에서 채움) */
export type ProductForm = Omit<
  CreateProductRequestDto,
  "storeId" | "originalPrice" | "salePrice" | "productType" | "customOptions"
> & {
  originalPrice?: number;
  salePrice?: number;
  /** 신규 등록 시 판매자가 고르기 전까지 비어 있음 */
  productType?: ProductType;
  customOptions: CustomOptionDto[];
};

/** 쿼리 키/옵션용 (page 제외, 클라이언트 전용) */
export type GetSellerProductsQueryParams = Omit<GetSellerProductsRequestDto, "page">;
