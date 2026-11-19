import type {
  StoreBankName,
  StoreResponseDto,
  UpdateStoreRequestDto,
} from "@/apps/web-seller/features/store/types/store.dto";
import type { StoreForm } from "@/apps/web-seller/features/store/types/store.ui";
import { normalizeRefundPolicyFromApi } from "@/apps/web-seller/features/store/utils/refund-cancellation-policy.util";

export function storeResponseToStoreForm(store: StoreResponseDto): StoreForm {
  return {
    name: store.name,
    description: store.description || "",
    phoneNumber: store.phoneNumber || "",
    logoImageUrl: store.logoImageUrl || "",
    kakaoChannelId: store.kakaoChannelId || "",
    instagramId: store.instagramId || "",
    chatInquiryVisible: store.chatInquiryVisible ?? true,
    kakaoChannelVisible: store.kakaoChannelVisible ?? true,
    instagramVisible: store.instagramVisible ?? true,
    phoneVisible: store.phoneVisible ?? true,
    bankAccountNumber: store.bankAccountNumber ?? "",
    bankName: (store.bankName ?? "") as StoreBankName | "",
    accountHolderName: store.accountHolderName ?? "",
    address: store.address,
    roadAddress: store.roadAddress,
    detailAddress: store.detailAddress,
    zonecode: store.zonecode,
    latitude: store.latitude,
    longitude: store.longitude,
    refundCancellationPolicy: normalizeRefundPolicyFromApi(store.refundCancellationPolicy),
  };
}

/** 폼의 "손님에게 보이기" 스위치(값이 없으면 보내지 않아 서버 값 그대로) */
export function contactVisibilityOf(data: StoreForm) {
  const out: Pick<
    StoreForm,
    "chatInquiryVisible" | "kakaoChannelVisible" | "instagramVisible" | "phoneVisible"
  > = {};
  if (data.chatInquiryVisible !== undefined) out.chatInquiryVisible = data.chatInquiryVisible;
  if (data.kakaoChannelVisible !== undefined) out.kakaoChannelVisible = data.kakaoChannelVisible;
  if (data.instagramVisible !== undefined) out.instagramVisible = data.instagramVisible;
  if (data.phoneVisible !== undefined) out.phoneVisible = data.phoneVisible;
  return out;
}

export function storeFormToUpdateRequest(data: StoreForm): UpdateStoreRequestDto {
  return {
    name: data.name,
    description: data.description || "",
    phoneNumber: data.phoneNumber.trim(),
    logoImageUrl: data.logoImageUrl || "",
    kakaoChannelId: data.kakaoChannelId?.trim() || "",
    instagramId: data.instagramId?.trim() || "",
    ...contactVisibilityOf(data),
    bankAccountNumber: data.bankAccountNumber.trim(),
    bankName: data.bankName as StoreBankName,
    accountHolderName: data.accountHolderName.trim(),
    address: data.address,
    roadAddress: data.roadAddress,
    detailAddress: data.detailAddress,
    zonecode: data.zonecode,
    latitude: data.latitude,
    longitude: data.longitude,
    refundCancellationPolicy: data.refundCancellationPolicy,
  };
}
