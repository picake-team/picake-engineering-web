import { sellerClient } from "@/apps/web-seller/common/config/axios.config";
import type {
  ImportNaverImagesResponseDto,
  NaverProductDetailResponseDto,
  NaverProductListResponseDto,
  ProductDescriptionDraftRequestDto,
  ProductDescriptionDraftResponseDto,
  ProductNaverLinkResponseDto,
} from "@/apps/web-seller/features/product/types/product-naver.dto";

/** 네이버 상품 가져오기·연결, 상세설명 AI 초안 (I-43) */
export const productNaverApi = {
  // 연결한 네이버 매장의 상품 목록
  getNaverProducts: async (storeId: string): Promise<NaverProductListResponseDto> => {
    const response = await sellerClient.get(`/store/${storeId}/naver-products`);
    return response.data.data;
  },
  // 네이버 상품 1개의 등록 제안값
  getNaverProductDetail: async (
    storeId: string,
    itemKey: string,
  ): Promise<NaverProductDetailResponseDto> => {
    const response = await sellerClient.get(
      `/store/${storeId}/naver-products/${encodeURIComponent(itemKey)}`,
    );
    return response.data.data;
  },
  // 고른 네이버 사진을 Picake에 올리기 (사진 순번으로)
  importNaverImages: async (
    storeId: string,
    itemKey: string,
    indexes: number[],
  ): Promise<ImportNaverImagesResponseDto> => {
    const response = await sellerClient.post(
      `/store/${storeId}/naver-products/${encodeURIComponent(itemKey)}/images`,
      { indexes },
    );
    return response.data.data;
  },
  // 상품을 네이버 예약 상품과 연결
  linkNaverItem: async (
    productId: string,
    bizItemId: string,
  ): Promise<ProductNaverLinkResponseDto> => {
    const response = await sellerClient.put(`/products/${productId}/naver-item`, { bizItemId });
    return response.data.data;
  },
  // 상품의 네이버 연결 끊기
  unlinkNaverItem: async (productId: string): Promise<ProductNaverLinkResponseDto> => {
    const response = await sellerClient.delete(`/products/${productId}/naver-item`);
    return response.data.data;
  },
  // 상품 상세설명 AI 초안
  createDescriptionDraft: async (
    storeId: string,
    request: ProductDescriptionDraftRequestDto,
  ): Promise<ProductDescriptionDraftResponseDto> => {
    const response = await sellerClient.post(
      `/store/${storeId}/products/description-draft`,
      request,
    );
    return response.data.data;
  },
};
