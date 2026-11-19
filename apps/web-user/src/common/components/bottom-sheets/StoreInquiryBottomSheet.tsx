"use client";

import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { BottomSheetOptionList } from "./BottomSheetOptionList";
import { useStoreDetail } from "@/apps/web-user/features/store/hooks/queries/useStoreDetail";
import {
  storeInstagramUrl,
  storeKakaoChatUrl,
} from "@/apps/web-user/common/utils/external-link.util";
import { useOpenExternal } from "@/apps/web-user/common/hooks/useOpenExternal";
import { useRouter } from "next/navigation";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { getNextStoreOpenLabel } from "@/apps/web-user/features/store/utils/store-business-calendar.util";

interface StoreInquiryBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** 주면 열 때 가게 정보를 불러와 사장님이 적은 카카오톡 채널·인스타·전화를 쓴다(아래 값이 있으면 그것을 먼저) */
  storeId?: string;
  /** 주문에서 열었으면 그 주문 — 채팅 첫 글 앞에 주문 카드가 붙는다(기획 I-11) */
  orderId?: string;
  /** 상품 화면에서 열었으면 그 상품 — 채팅 첫 글 앞에 상품 카드가 붙는다(기획 I-01) */
  productId?: string;
  kakaoChannelUrl?: string | null;
  instagramUrl?: string | null;
  phoneNumber?: string | null;
}

/**
 * 스토어 문의: 맨 위 "채팅으로 문의"(채팅이 열렸을 때, 기획 I-11) + 가게의 카카오톡 채널(1:1 채팅으로 바로)·인스타그램·전화.
 * 사장님이 적지 않았거나 "손님에게 보이기"를 끈 것은 줄을 빼고 보여 준다(끈 카톡·인스타·전화는 서버가 값을 빼고 준다, 기획 I-01).
 * 채팅은 주문에서 열면 늘 보인다(예약한 손님은 연락이 끊기면 안 됨). 영업시간 밖이면 제목 아래 한 줄로 알린다.
 * 예전에는 카카오톡·인스타에 늘 빈 값이 들어가 전화만 됐다(2026-11-11 고침).
 */
export function StoreInquiryBottomSheet({
  isOpen,
  onClose,
  storeId,
  orderId,
  productId,
  kakaoChannelUrl,
  instagramUrl,
  phoneNumber,
}: StoreInquiryBottomSheetProps) {
  const router = useRouter();
  const { data: store } = useStoreDetail(isOpen && storeId ? storeId : "");
  const kakaoUrl = kakaoChannelUrl || storeKakaoChatUrl(store?.kakaoChannelId);
  const instaUrl = instagramUrl || storeInstagramUrl(store?.instagramId);
  const phone = phoneNumber || store?.phoneNumber;
  // 사장님이 채팅 문의를 끈 가게(주문 화면에서 연 문의는 늘 보임)
  const chatHidden = !orderId && store?.chatInquiryVisible === false;
  // 영업시간 밖이면 null이 아님("" = 언제 여는지 모름)
  const nextOpen = store?.businessCalendar ? getNextStoreOpenLabel(store.businessCalendar) : null;
  const { open, toast } = useOpenExternal();
  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="스토어 문의"
        footerShadow={false}
        footer={
          <div className="px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full h-[52px] rounded-xl border border-gray-100 text-base font-bold text-gray-900"
            >
              취소
            </button>
          </div>
        }
      >
        {nextOpen !== null && (
          <p className="-mt-[4px] px-[20px] pb-[8px] text-center text-xs text-gray-500">
            지금은 영업시간이 아니에요{nextOpen ? ` · ${nextOpen}` : ""}
          </p>
        )}
        <BottomSheetOptionList
          items={[
            {
              icon: {
                type: "element",
                element: (
                  // Picake 채팅이라 Picake 로고(운영자 11-12). 다른 줄 그림처럼 40 동그라미(전화 줄과 같은 연한 주황 바탕)
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50">
                    <Icon name="logoPicake" width={26} height={26} />
                  </span>
                ),
              },
              label: "채팅으로 문의",
              onClick: () => {
                if (!storeId) return;
                trackEvent("engage_chat_entry", {
                  entry_point: orderId
                    ? "order_inquiry"
                    : productId
                      ? "product_inquiry"
                      : "store_inquiry",
                  store_id: storeId,
                });
                onClose();
                router.push(PATHS.CHAT.STORE(storeId, orderId ? { orderId } : { productId }));
              },
              disabled: !storeId || chatHidden,
            },
            {
              icon: { type: "image", src: "/images/contents/talk_kakao.png", alt: "카카오 채널" },
              label: "카카오톡 채널",
              onClick: () => {
                if (kakaoUrl) {
                  open(kakaoUrl, {
                    copyText: kakaoUrl.replace(/\/chat$/, ""),
                    message: "카카오톡 채널 주소를 복사했어요",
                  });
                  onClose();
                }
              },
              disabled: !kakaoUrl,
            },
            {
              icon: { type: "image", src: "/images/contents/talk_insta.png", alt: "인스타그램" },
              label: "인스타그램",
              onClick: () => {
                if (instaUrl) {
                  open(instaUrl, {
                    copyText: instaUrl.replace(/^https:\/\/instagram\.com\//, ""),
                    message: "인스타그램 아이디를 복사했어요",
                  });
                  onClose();
                }
              },
              disabled: !instaUrl,
            },
            {
              icon: { type: "image", src: "/images/contents/talk_phone.png", alt: "전화 문의" },
              label: "전화 문의",
              onClick: () => {
                if (phone) {
                  open(`tel:${phone.replace(/[^0-9+]/g, "")}`, {
                    copyText: phone,
                    message: "전화번호를 복사했어요",
                  });
                  onClose();
                }
              },
              disabled: !phone,
            },
          ]}
        />
      </BottomSheet>
      {toast}
    </>
  );
}
