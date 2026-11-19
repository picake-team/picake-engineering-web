"use client";

import { useState } from "react";
import { Icon } from "@/apps/web-user/common/components/icons";
import { StoreInquiryBottomSheet } from "@/apps/web-user/common/components/bottom-sheets/StoreInquiryBottomSheet";
import type { StoreInfo } from "@/apps/web-user/features/store/types/store.type";

/** 손님에게 보이는 문의 방법이 하나라도 있는지(사장님 "손님에게 보이기", 기획 I-01). 끈 카톡·인스타·전화는 서버가 값을 빼고 준다 */
export function hasVisibleStoreInquiry(store: StoreInfo): boolean {
  return (
    store.chatInquiryVisible !== false ||
    !!store.kakaoChannelId ||
    !!store.instagramId ||
    !!store.phoneNumber
  );
}

/**
 * 상품·가게 화면 오른쪽 아래에 떠 있는 문의 버튼(기획 I-01, 운영자 2026-11-19 "다-1").
 * 지름 48, 흰 바탕·옅은 테두리·그림자, 말풍선 아이콘 18·"문의" 11 굵게(아래 탭 글자와 같은 크기), 검정.
 * 누르면 지금의 "스토어 문의" 창. 사장님이 문의 방법을 모두 숨긴 가게는 버튼을 그리지 않는다.
 * `bottom`은 화면 아래에 붙은 버튼 줄·견적 칸 위로 띄울 거리(그 위 12px).
 */
export function StoreInquiryFab({
  store,
  productId,
  bottom,
  hidden = false,
}: {
  store: StoreInfo | undefined;
  /** 상품 화면이면 그 상품 — 채팅 첫 글에 상품 카드가 붙는다 */
  productId?: string;
  bottom: string;
  /** 예약·견적 창이 열려 있을 때처럼 잠깐 숨길 때 */
  hidden?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!store || !hasVisibleStoreInquiry(store)) return null;
  return (
    <>
      {!hidden && (
        // 앱 폭(638) 안 오른쪽에 둔다(PC에서도 화면 끝이 아니라 가운데 칸 안)
        <div
          className="pointer-events-none fixed inset-x-0 z-30 mx-auto flex max-w-[638px] justify-end px-[16px]"
          style={{ bottom }}
        >
          <button
            type="button"
            aria-label="스토어 문의"
            onClick={() => setOpen(true)}
            className="pointer-events-auto flex h-[48px] w-[48px] flex-col items-center justify-center rounded-full border border-gray-100 bg-white text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.12)] active:scale-95"
          >
            <Icon name="chat" width={18} height={18} />
            <span className="text-2xs font-bold leading-[13px]">문의</span>
          </button>
        </div>
      )}
      <StoreInquiryBottomSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        storeId={store.id}
        productId={productId}
      />
    </>
  );
}
