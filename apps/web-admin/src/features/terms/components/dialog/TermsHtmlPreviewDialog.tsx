import DOMPurify from "dompurify";
import { useMemo, type ReactNode } from "react";
import { X } from "lucide-react";
import { LIST_CARD_TITLE } from "@/apps/web-admin/common/constants/list-typography.constant";
import { TERMS_PREVIEW_CONTENT_CLASS } from "@/apps/web-admin/features/terms/constants/terms.constant";
import { getTermsPreviewContentStyles } from "@/apps/web-admin/features/terms/utils/terms-preview-content.ui.util";

interface TermsHtmlPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  description?: ReactNode;
}

export function TermsHtmlPreviewDialog({
  open,
  onClose,
  title,
  content,
  description,
}: TermsHtmlPreviewDialogProps) {
  // 손님·사장님 화면과 같게 거른 HTML로 미리 본다(넣은 HTML에 스크립트가 있어도 관리자 화면에서 돌지 않게)
  const safeContent = useMemo(() => DOMPurify.sanitize(content), [content]);
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
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className={LIST_CARD_TITLE}>{title}</h3>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="닫기"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <style>{getTermsPreviewContentStyles()}</style>
          <div
            className={TERMS_PREVIEW_CONTENT_CLASS}
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />
        </div>
      </div>
    </div>
  );
}
