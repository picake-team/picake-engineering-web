"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/apps/web-user/common/components/icons";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { CheckboxMark } from "@/apps/web-user/common/components/inputs/Checkbox";
import { cn } from "@/apps/web-user/common/lib/utils";
import { QUOTE_NO_REPLAY } from "@/apps/web-user/features/quote/constants/quote.constant";
import type { QuoteDraftPhoto } from "@/apps/web-user/features/quote/store/quote-draft.store";
import type { DesignPart } from "@/apps/web-user/features/design/types/design.type";
import {
  DESIGN_PART_LABEL,
  DESIGN_PART_ORDER,
  isAllParts,
  partsChipLabel,
} from "@/apps/web-user/features/design/utils/design-fill.util";
import { useDesignLikes } from "@/apps/web-user/features/design/hooks/useDesignLikes";
import {
  designImageSrc,
  getDesign,
  visibleDesigns,
} from "@/apps/web-user/features/design/utils/design.util";

/** 요청서 참고 사진 한 칸: 2장 이상이면 번호와 "가져올 것" 칩 */
export function QuotePhotoTile({
  photo,
  index,
  multi,
  onRemove,
  onParts,
}: {
  photo: QuoteDraftPhoto;
  index: number;
  multi: boolean;
  onRemove: () => void;
  onParts: () => void;
}) {
  const parts = photo.parts ?? ["ALL"];
  return (
    <div
      className={cn(
        "relative h-[100px] w-[100px] shrink-0 rounded-lg border border-gray-100",
        !photo.designId && QUOTE_NO_REPLAY,
      )}
    >
      <img
        src={photo.dataUrl}
        alt="참고 사진"
        className="h-full w-full rounded-lg bg-gray-50 object-cover"
      />
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
      {multi && (
        <button
          type="button"
          onClick={onParts}
          aria-label={`${index + 1}번 사진에서 가져올 것: ${partsChipLabel(parts)}`}
          className={cn(
            "absolute bottom-[5px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-[8px] py-[3px] text-2xs font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.2)]",
            isAllParts(parts) ? "text-gray-900" : "text-primary",
          )}
        >
          {partsChipLabel(parts)} ▾
        </button>
      )}
    </div>
  );
}

/** "사진에서 가져올 것" 창(여러 개 고르기, 처음은 전체) */
export function PhotoPartsSheet({
  photo,
  index,
  onClose,
  onApply,
}: {
  photo: QuoteDraftPhoto | null;
  index: number;
  onClose: () => void;
  onApply: (parts: DesignPart[]) => void;
}) {
  const [picked, setPicked] = useState<DesignPart[] | null>(null);
  const current = picked ?? photo?.parts ?? ["ALL"];
  const source = photo?.designId ? getDesign(photo.designId)?.parts : photo?.read?.parts;
  const hint: Record<Exclude<DesignPart, "ALL">, string | null | undefined> = {
    SHAPE: source?.shape,
    COLOR: source?.color,
    DECORATION: source?.decoration,
    LETTERING: source?.lettering,
  };
  const toggle = (p: DesignPart) => {
    if (p === "ALL") return setPicked(["ALL"]);
    const base = current.filter((x) => x !== "ALL");
    const next = base.includes(p) ? base.filter((x) => x !== p) : [...base, p];
    setPicked(next.length ? next : ["ALL"]);
  };
  const row = (p: DesignPart, sub: string | null | undefined) => {
    const on = p === "ALL" ? isAllParts(current) : current.includes(p);
    return (
      <button
        key={p}
        type="button"
        onClick={() => toggle(p)}
        className="press-bg flex w-full items-center gap-[12px] border-b border-gray-50 py-[13px] text-left"
      >
        <CheckboxMark checked={on} size={20} />
        <span>
          <span className="block text-base text-gray-900">{DESIGN_PART_LABEL[p]}</span>
          {sub && <span className="mt-[2px] block text-2sm text-gray-500">{sub}</span>}
        </span>
      </button>
    );
  };
  return createPortal(
    <BottomSheet
      isOpen={photo !== null}
      onClose={() => {
        setPicked(null);
        onClose();
      }}
      title={`${index + 1}번 사진에서 가져올 것`}
      zIndexClassName="z-sheet-over"
      footer={
        <div className="px-[20px] pb-[20px] pt-[8px]">
          <Button
            size="lg"
            onClick={() => {
              onApply(current);
              setPicked(null);
            }}
          >
            적용
          </Button>
        </div>
      }
    >
      <div className="px-[20px]">
        <p className="mb-[4px] text-2sm text-gray-500">여러 개 골라도 돼요</p>
        {row("ALL", "사진처럼 다")}
        {DESIGN_PART_ORDER.map((p) => row(p, hint[p]))}
      </div>
    </BottomSheet>,
    document.body,
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
  onPick: (designIds: string[]) => void;
}) {
  const { data } = useDesignLikes();
  const saved = useMemo(
    () => (data?.myLikes ?? []).map((id) => getDesign(id)).filter((d) => d !== null),
    [data],
  );
  const [tab, setTab] = useState<"saved" | "all" | null>(null);
  const activeTab = tab ?? (saved.length ? "saved" : "all");
  const [picked, setPicked] = useState<string[]>([]);
  const list = (activeTab === "saved" ? saved : visibleDesigns()).filter(
    (d) => !exclude.includes(d.id),
  );
  const close = () => {
    setPicked([]);
    setTab(null);
    onClose();
  };
  const toggle = (id: string) =>
    setPicked((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < room ? [...cur, id] : cur,
    );

  return createPortal(
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
        <div className="mb-[12px] mt-[10px] flex gap-[18px] border-b border-gray-100 text-sm">
          {(
            [
              ["saved", `저장한 디자인 ${saved.length}`],
              ["all", "전체"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "-mb-px border-b-2 py-[8px]",
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
            {activeTab === "saved" ? "저장한 디자인이 없어요" : "넣을 수 있는 디자인이 없어요"}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-x-[8px] gap-y-[12px] pb-[12px]">
            {list.map((d) => {
              const order = picked.indexOf(d.id);
              return (
                <button key={d.id} type="button" onClick={() => toggle(d.id)} className="text-left">
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
    </BottomSheet>,
    document.body,
  );
}
