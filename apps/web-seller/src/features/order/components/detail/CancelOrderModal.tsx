import React, { useState, useEffect } from "react";
import { X, TriangleAlert } from "lucide-react";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { Label } from "@/apps/web-seller/common/components/labels/Label";
import { Textarea } from "@/apps/web-seller/common/components/textareas/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/apps/web-seller/common/components/selects/Select";

const CANCEL_REASONS = [
  { value: "재료 소진", label: "재료 소진" },
  { value: "매장 사정 (휴무)", label: "매장 사정 (휴무)" },
  { value: "손님 요청", label: "손님 요청" },
  { value: "기타", label: "기타" },
] as const;

interface CancelOrderModalProps {
  open: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  open,
  isPending,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
      setDetail("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const fullReason = detail.trim() ? `${reason} — ${detail.trim()}` : reason;

  const handleConfirm = () => {
    if (!reason || isPending) return;
    onConfirm(fullReason);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="주문 취소"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="닫기"
      />
      <div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 text-slate-400 hover:text-slate-700"
          onClick={onClose}
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* 헤더 */}
        <div className="px-6 pb-4 pt-6">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 shrink-0 text-amber-500" />
            <h2 className="text-[15px] font-semibold text-slate-900">주문을 취소하시겠습니까?</h2>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
            취소된 주문은 다시 되돌릴 수 없습니다. 확인 부탁드립니다.
          </p>
        </div>

        {/* 폼 */}
        <div className="space-y-4 px-6 pb-6">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-slate-700">
              취소 사유 <span className="text-red-500">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="text-[13px]">
                <SelectValue placeholder="사유를 선택해 주세요." />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {CANCEL_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-[13px]">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-slate-700">
              상세 내용 <span className="font-normal text-slate-400">(선택)</span>
            </Label>
            <Textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="고객에게 안내할 상세 사유를 입력해 주세요"
              rows={3}
              className="resize-none text-[13px]"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-[13px]"
              onClick={onClose}
              disabled={isPending}
            >
              돌아가기
            </Button>
            <Button
              type="button"
              className="flex-1 text-[13px]"
              onClick={handleConfirm}
              disabled={!reason || isPending}
            >
              {isPending ? "처리 중..." : "주문 취소 확정"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
