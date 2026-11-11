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

interface StoreInquiryBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** 주면 열 때 가게 정보를 불러와 사장님이 적은 카카오톡 채널·인스타·전화를 쓴다(아래 값이 있으면 그것을 먼저) */
  storeId?: string;
  /** 주문에서 열었으면 그 주문 — 채팅 첫 글 앞에 주문 카드가 붙는다(기획 I-11) */
  orderId?: string;
  kakaoChannelUrl?: string | null;
  instagramUrl?: string | null;
  phoneNumber?: string | null;
}

/**
 * 스토어 문의: 맨 위 "채팅으로 문의"(채팅이 열렸을 때, 기획 I-11) + 가게의 카카오톡 채널(1:1 채팅으로 바로)·인스타그램·전화.
 * 사장님이 적지 않은 것은 누를 수 없다.
 * 예전에는 카카오톡·인스타에 늘 빈 값이 들어가 전화만 됐다(2026-11-11 고침).
 */
export function StoreInquiryBottomSheet({
  isOpen,
  onClose,
  storeId,
  orderId,
  kakaoChannelUrl,
  instagramUrl,
  phoneNumber,
}: StoreInquiryBottomSheetProps) {
  const router = useRouter();
  const { data: store } = useStoreDetail(isOpen && storeId ? storeId : "");
  const kakaoUrl = kakaoChannelUrl || storeKakaoChatUrl(store?.kakaoChannelId);
  const instaUrl = instagramUrl || storeInstagramUrl(store?.instagramId);
  const phone = phoneNumber || store?.phoneNumber;
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
        <BottomSheetOptionList
          items={[
            {
              icon: {
                type: "element",
                element: (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                    <Icon name="chat" width={16} height={16} />
                  </span>
                ),
              },
              label: "채팅으로 문의",
              onClick: () => {
                if (!storeId) return;
                trackEvent("engage_chat_entry", {
                  entry_point: orderId ? "order_inquiry" : "store_inquiry",
                  store_id: storeId,
                });
                onClose();
                router.push(PATHS.CHAT.STORE(storeId, { orderId }));
              },
              disabled: !storeId,
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
