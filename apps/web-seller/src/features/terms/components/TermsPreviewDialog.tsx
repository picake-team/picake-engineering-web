import { useEffect } from "react";
import { X } from "lucide-react";
import { TermsDocumentScreen } from "@/apps/web-seller/features/terms/components/TermsDocumentScreen";
import type { TermsType } from "@/apps/web-seller/features/terms/types/terms.dto";
import { lockPageScroll } from "@/apps/web-seller/common/hooks/usePageScrollLock";

interface TermsPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  termsType: TermsType;
}

export function TermsPreviewDialog({ open, onClose, title, termsType }: TermsPreviewDialogProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    // 뒤 화면 스크롤 잠금(html — body를 잠그면 PC sticky 메뉴가 튐, usePageScrollLock)
    const releaseScroll = lockPageScroll();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      releaseScroll();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-preview-dialog-title"
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4 sm:px-6">
          <h2 id="terms-preview-dialog-title" className="text-lg font-semibold text-zinc-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
            aria-label="닫기"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TermsDocumentScreen termsType={termsType} />
        </div>
      </div>
    </div>
  );
}
