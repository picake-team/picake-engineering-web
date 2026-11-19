import { useQuery } from "@tanstack/react-query";
import { termsApi } from "@/apps/web-seller/features/terms/apis/terms.api";
import { SELLER_TERMS_TYPES } from "@/apps/web-seller/features/terms/constants/terms.constant";
import { termsQueryKeys } from "@/apps/web-seller/features/terms/constants/termsQueryKeys.constant";
import type {
  TermsDocumentResponseDto,
  TermsType,
} from "@/apps/web-seller/features/terms/types/terms.dto";

/** 타입별 현재 활성 약관 조회 */
export function useActiveTerms(type: TermsType) {
  const query = useQuery<TermsDocumentResponseDto>({
    queryKey: termsQueryKeys.active(type),
    queryFn: () => termsApi.getActiveTerms(type),
  });

  return query;
}

/** 회원가입 등 — 판매자 전체 약관 타입의 활성 문서 일괄 조회 */
export function useSellerActiveTerms() {
  const query = useQuery<Record<TermsType, TermsDocumentResponseDto>>({
    queryKey: termsQueryKeys.sellerActive(),
    queryFn: async () => {
      const docs = await Promise.all(
        SELLER_TERMS_TYPES.map((type) => termsApi.getActiveTerms(type)),
      );
      return Object.fromEntries(
        SELLER_TERMS_TYPES.map((type, index) => [type, docs[index]]),
      ) as Record<TermsType, TermsDocumentResponseDto>;
    },
  });

  return query;
}
