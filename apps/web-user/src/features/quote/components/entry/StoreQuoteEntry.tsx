"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  QuoteAskSheet,
  QuoteStickyBar,
  buildQuoteNewHref,
} from "@/apps/web-user/features/quote/components/entry/QuoteEntry";

/** 가게 상세 아래 칸(SC-13 3): 누르면 "이 가게에만 / 다른 가게에도"를 묻고 요청서를 연다 */
export function StoreQuoteEntry({
  store,
}: {
  store: {
    id: string;
    name: string;
    address?: string;
    roadAddress?: string;
    latitude?: number;
    longitude?: number;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <QuoteStickyBar
        eyebrow="원하는 디자인이 따로 있나요?"
        title={`${store.name}에 물어보기`}
        onClick={() => setOpen(true)}
      />
      <QuoteAskSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        storeName={store.name}
        isUnlisted={false}
        onSelect={(only) =>
          router.push(
            buildQuoteNewHref("STORE", {
              storeId: store.id,
              name: store.name,
              address: store.roadAddress || store.address,
              lat: store.latitude,
              lng: store.longitude,
              only: only ? 1 : undefined,
            }),
          )
        }
      />
    </>
  );
}
