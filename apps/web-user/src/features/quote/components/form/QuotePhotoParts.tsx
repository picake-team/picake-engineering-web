"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/apps/web-user/common/components/icons";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { cn } from "@/apps/web-user/common/lib/utils";
import { QUOTE_NO_REPLAY } from "@/apps/web-user/features/quote/constants/quote.constant";
import type { QuoteDraftPhoto } from "@/apps/web-user/features/quote/store/quote-draft.store";
import type { Design, DesignPart } from "@/apps/web-user/features/design/types/design.type";
import { DesignPartsPickSheet } from "@/apps/web-user/features/design/components/DesignPartsPickSheet";
import { useDesignLikes } from "@/apps/web-user/features/design/hooks/useDesignLikes";
import {
  designImageSrc,
  getDesign,
  visibleDesigns,
} from "@/apps/web-user/features/design/utils/design.util";

/**
 * 요청서 참고 사진 한 칸: 2장 이상이면 번호(가져올 것은 고를 때 정하고 여기서는 바꾸지 않는다, 운영자 11-14).
 * 사진을 누르면 크게 보기(onOpen)
 */
export function QuotePhotoTile({
  photo,
  index,
  multi,
  onOpen,
  onRemove,
}: {
  photo: QuoteDraftPhoto;
  index: number;
  multi: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "relative h-[100px] w-[100px] shrink-0 rounded-lg border border-gray-100",
        !photo.designId && QUOTE_NO_REPLAY,
      )}
    >
      <button
        type="button"
        aria-label={`참고 사진 ${index + 1} 크게 보기`}
        onClick={onOpen}
        className="block h-full w-full"
      >
        <img
          src={photo.dataUrl}
          alt="참고 사진"
          className="h-full w-full rounded-lg bg-gray-50 object-cover"
        />
      </button>
      {multi && (
        <span className="absolute left-[5px] top-[5px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-gray-900/60 text-xs font-bold text-white">
          {index + 1}
        </span>
      )}
      <button
        type="button"
        aria-label="사진 빼기"
        className="absolute right-[5px] top-[5px]"
        onClick={onRemove}
      >
        <Icon name="removePhoto" width={20} height={20} />
      </button>
    </div>
  );
}

/** "디자인 모음에서 고르기" 창: 저장한 디자인·전체에서 남은 칸만큼 */
export function DesignPickSheet({
  isOpen,
  room,
  exclude,
  onClose,
  onPick,
}: {
  isOpen: boolean;
  room: number;
  exclude: string[];
  onClose: () => void;
  onPick: (picks: { designId: string; parts: DesignPart[] }[]) => void;
}) {
  const { data } = useDesignLikes();
  const saved = useMemo(
    () => (data?.myLikes ?? []).map((id) => getDesign(id)).filter((d) => d !== null),
    [data],
  );
  const [tab, setTab] = useState<"saved" | "all" | null>(null);
  const activeTab = tab ?? (saved.length ? "saved" : "all");
  // 고른 순서대로, 디자인마다 "무엇을 가져갈까요?"에서 고른 것
  const [picked, setPicked] = useState<{ designId: string; parts: DesignPart[] }[]>([]);
  const [asking, setAsking] = useState<Design | null>(null);
  const list = (activeTab === "saved" ? saved : visibleDesigns()).filter(
    (d) => !exclude.includes(d.id),
  );
  const close = () => {
    setPicked([]);
    setTab(null);
    setAsking(null);
    onClose();
  };
  // 처음 고르면 상세와 같은 "이 사진에서 무엇을 가져갈까요?"를 묻는다. 다시 누르면 뺀다
  const toggle = (d: Design) => {
    if (picked.some((x) => x.designId === d.id))
      setPicked((cur) => cur.filter((x) => x.designId !== d.id));
    else if (picked.length < room) setAsking(d);
  };

  return createPortal(
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={close}
        title="디자인 모음에서 고르기"
        maxHeight="85%"
        zIndexClassName="z-sheet-over"
        footer={
          <div className="px-[20px] pb-[20px] pt-[8px]">
            <Button
              size="lg"
              disabled={picked.length === 0}
              onClick={() => {
                onPick(picked);
                close();
              }}
            >
              {picked.length ? `${picked.length}장 넣기` : "사진을 골라 주세요"}
            </Button>
          </div>
        }
      >
        <div className="px-[20px]">
          <p className="text-2sm text-gray-500">
            {room}장 더 넣을 수 있어요 · 고른 순서가 사진 번호예요
          </p>
          <div
            role="tablist"
            className="mb-[12px] mt-[10px] flex gap-[18px] border-b border-gray-100 text-sm"
          >
            {(
              [
                ["saved", `저장한 디자인 ${saved.length}`],
                ["all", "전체"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeTab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "-mb-px min-w-[40px] border-b-2 py-[8px]",
                  activeTab === key
                    ? "border-gray-900 font-bold text-gray-900"
                    : "border-transparent text-gray-400",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <p className="py-[40px] text-center text-sm text-gray-500">
              {activeTab === "saved"
                ? saved.length
                  ? "저장한 디자인을 모두 넣었어요"
                  : "저장한 디자인이 없어요"
                : "넣을 수 있는 디자인이 없어요"}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-x-[8px] gap-y-[12px] pb-[12px]">
              {list.map((d) => {
                const order = picked.findIndex((x) => x.designId === d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={order >= 0}
                    aria-label={order >= 0 ? `${d.name}, ${order + 1}번으로 고름` : d.name}
                    onClick={() => toggle(d)}
                    className="text-left"
                  >
                    <span
                      className={cn(
                        "relative block aspect-square overflow-hidden rounded-xl bg-gray-50",
                        order >= 0 && "ring-2 ring-inset ring-primary",
                      )}
                    >
                      <img
                        src={designImageSrc(d.image.thumb)}
                        alt={d.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <span
                        className={cn(
                          "absolute right-[6px] top-[6px] flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs font-bold",
                          order >= 0
                            ? "bg-primary text-white"
                            : "border-[1.5px] border-gray-200 bg-white/85",
                        )}
                      >
                        {order >= 0 ? order + 1 : ""}
                      </span>
                    </span>
                    <span className="mt-[5px] block truncate text-2sm text-gray-900">{d.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </BottomSheet>
      {asking && (
        <DesignPartsPickSheet
          isOpen
          design={asking}
          confirmLabel="고르기"
          zIndexClassName="z-sheet-top"
          onClose={() => setAsking(null)}
          onNext={(parts) => {
            setPicked((cur) => [...cur, { designId: asking.id, parts }]);
            setAsking(null);
          }}
        />
      )}
    </>,
    document.body,
  );
}
