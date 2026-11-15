import DOMPurify from "dompurify";
import { useEffect, useMemo, useRef } from "react";
import { TERMS_PREVIEW_CONTENT_CLASS } from "@/apps/web-seller/features/terms/constants/terms.constant";
import { useActiveTerms } from "@/apps/web-seller/features/terms/hooks/queries/useTermsQuery";
import type { TermsType } from "@/apps/web-seller/features/terms/types/terms.dto";
import { getTermsPreviewContentStyles } from "@/apps/web-seller/features/terms/utils/terms-preview-content.ui.util";

interface TermsDocumentScreenProps {
  termsType: TermsType;
}

export function TermsDocumentScreen({ termsType }: TermsDocumentScreenProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { data, isPending } = useActiveTerms(termsType);
  // 약관은 관리자가 넣은 HTML이라 그대로 넣지 않고 거른다(11-15 검토, 손님 웹과 같게)
  const htmlContent = useMemo(() => DOMPurify.sanitize(data?.content ?? ""), [data?.content]);

  useEffect(() => {
    if (!htmlContent) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const id = requestAnimationFrame(() => {
      contentRef.current?.querySelector(`#${CSS.escape(hash)}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [htmlContent]);

  return (
    <div className="min-h-[200px]">
      <style>{getTermsPreviewContentStyles()}</style>
      {htmlContent ? (
        <div
          ref={contentRef}
          className={TERMS_PREVIEW_CONTENT_CLASS}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      ) : (
        <p className="px-6 py-10 text-center text-sm text-zinc-500">
          {isPending ? "문서를 불러오는 중…" : "약관을 불러오지 못했습니다."}
        </p>
      )}
    </div>
  );
}
