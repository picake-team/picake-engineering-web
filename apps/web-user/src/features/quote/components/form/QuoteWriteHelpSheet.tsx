"use client";

import { createPortal } from "react-dom";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";

/** 사장님이 견적 전에 손님에게 다시 묻는 것(운영자 11-14: 설명 옆 "무엇을 쓸까요?" → 창) */
const ASKED = [
  {
    where: "설명에",
    items: [
      ["케이크에 쓸 글자", '예: "지수야 생일 축하해"'],
      ["사진과 다르게 할 점", "예: 크림은 하늘색으로"],
    ],
  },
  {
    where: "다음 단계 요청 사항에",
    items: [
      ["초·토퍼", "예: 숫자초 2, 5"],
      ["알레르기", "예: 견과류 빼 주세요"],
      ["맛", "예: 초코 시트"],
    ],
  },
] as const;

/** 요청서 4단계 "무엇을 쓸까요?" 창 */
export function QuoteWriteHelpSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return createPortal(
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="무엇을 쓰면 좋을까요?"
      zIndexClassName="z-sheet-over"
      footer={
        <div className="px-[20px] pb-[20px] pt-[8px]">
          <Button size="lg" onClick={onClose}>
            확인
          </Button>
        </div>
      }
    >
      <div className="px-[20px] pb-[8px]">
        <p className="text-sm font-bold text-gray-900">사장님이 꼭 묻는 것</p>
        {ASKED.map((g) => (
          <div key={g.where} className="mt-[12px]">
            <p className="text-2sm text-gray-500">{g.where}</p>
            <ul className="mt-[4px] flex flex-col gap-[6px]">
              {g.items.map(([what, example]) => (
                <li key={what} className="text-sm leading-[22px] text-gray-700">
                  <span aria-hidden className="mr-[6px] text-gray-400">
                    ✓
                  </span>
                  {what} <span className="text-gray-400">· {example}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="mt-[12px] text-2sm text-gray-500">크기·예산도 다음 단계에서 골라요</p>
      </div>
    </BottomSheet>,
    document.body,
  );
}
