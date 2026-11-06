/**
 * 주소 검색 창 (SC-67, 디자인 A67). 휴대폰 화면에서는 새 창 대신 아래에서 올라오는 창 안에 카카오 우편번호 검색을 그린다.
 * 앱(웹뷰)은 새 창을 열지 못해 스토어 만들기·스토어 정보에서 주소를 고르지 못하던 것을 막는다(I-48 "주소 검색").
 */
import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { embedAddressSearch } from "@/apps/web-seller/common/utils/kakao-address.util";
import type { StoreAddressDto } from "@/apps/web-seller/features/store/types/store.dto";

export function AddressSearchSheet({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (data: Omit<StoreAddressDto, "detailAddress">) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const box = boxRef.current;
    if (!box) return;
    setFailed(false);
    let alive = true;
    embedAddressSearch(box, (data) => {
      if (!alive) return;
      selectRef.current(data);
      closeRef.current();
    }).catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      box.innerHTML = "";
    };
  }, [open]);

  return (
    <BottomSheet open={open} onClose={onClose} title="주소 검색" showClose>
      {failed ? (
        <p className="py-6 text-center text-sub text-ink-600">
          주소 검색을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 열어 주세요.
        </p>
      ) : null}
      <div
        ref={boxRef}
        className="h-[min(64dvh,520px)] w-full overflow-hidden rounded-control border border-ink-100"
        aria-label="주소 검색"
      />
    </BottomSheet>
  );
}
