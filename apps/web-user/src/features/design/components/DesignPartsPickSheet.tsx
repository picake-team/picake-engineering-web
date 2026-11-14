"use client";

import { useState } from "react";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { CheckboxMark } from "@/apps/web-user/common/components/inputs/Checkbox";
import type { Design, DesignPart } from "@/apps/web-user/features/design/types/design.type";
import {
  DESIGN_PART_LABEL,
  DESIGN_PART_ORDER,
  isAllParts,
} from "@/apps/web-user/features/design/utils/design-fill.util";

const PART_KEY = {
  SHAPE: "shape",
  COLOR: "color",
  DECORATION: "decoration",
  LETTERING: "lettering",
} as const;

/**
 * 디자인 상세 "이 디자인으로 견적 받기" → "이 사진에서 무엇을 가져갈까요?"(기획 I-112, 운영자 11-14 고름).
 * 처음은 전체. 요청서의 "가져올 것" 칩과 같은 고르기다.
 */
export function DesignPartsPickSheet({
  isOpen,
  design,
  onClose,
  onNext,
  confirmLabel = "견적 요청서 쓰기",
  zIndexClassName,
}: {
  isOpen: boolean;
  design: Design;
  onClose: () => void;
  onNext: (parts: DesignPart[]) => void;
  confirmLabel?: string;
  zIndexClassName?: string;
}) {
  const [picked, setPicked] = useState<DesignPart[]>(["ALL"]);
  const options = DESIGN_PART_ORDER.filter((p) => design.parts[PART_KEY[p]]);
  const toggle = (p: DesignPart) => {
    if (p === "ALL") return setPicked(["ALL"]);
    const base = picked.filter((x) => x !== "ALL");
    const next = base.includes(p) ? base.filter((x) => x !== p) : [...base, p];
    setPicked(next.length ? next : ["ALL"]);
  };
  const row = (p: DesignPart, sub: string | null) => {
    const on = p === "ALL" ? isAllParts(picked) : picked.includes(p);
    return (
      <button
        key={p}
        type="button"
        role="checkbox"
        aria-checked={on}
        onClick={() => toggle(p)}
        className="press-bg flex w-full items-center gap-[12px] border-b border-gray-50 py-[12px] text-left"
      >
        <CheckboxMark checked={on} size={20} />
        <span className="min-w-0">
          <span className="block text-base text-gray-900">{DESIGN_PART_LABEL[p]}</span>
          {sub && <span className="mt-[2px] block text-2sm text-gray-500">{sub}</span>}
        </span>
      </button>
    );
  };
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="이 사진에서 무엇을 가져갈까요?"
      zIndexClassName={zIndexClassName}
      footer={
        <div className="px-[20px] pb-[20px] pt-[8px]">
          <Button size="lg" onClick={() => onNext(picked)}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="px-[20px]">
        <p className="mb-[4px] text-2sm text-gray-500">요청서에서 언제든 바꿀 수 있어요</p>
        {row("ALL", "사진처럼 다")}
        {options.map((p) => row(p, design.parts[PART_KEY[p]]))}
      </div>
    </BottomSheet>
  );
}
