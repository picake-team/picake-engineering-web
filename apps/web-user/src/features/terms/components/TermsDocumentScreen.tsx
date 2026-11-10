"use client";

import { useEffect, useRef } from "react";
import { TERMS_PREVIEW_CONTENT_CLASS } from "@/apps/web-user/features/terms/constants/terms.constant";
import { useActiveTerms } from "@/apps/web-user/features/terms/hooks/queries/useTermsQuery";
import type { TermsType } from "@/apps/web-user/features/terms/types/terms.dto";
import { getTermsPreviewContentStyles } from "@/apps/web-user/features/terms/utils/terms-preview-content.ui.util";

interface TermsDocumentScreenProps {
  termsType: TermsType;
}

export function TermsDocumentScreen({ termsType }: TermsDocumentScreenProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { data, isPending } = useActiveTerms(termsType);
  const htmlContent = data?.content ?? "";

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
    <div className="pb-[calc(60px+env(safe-area-inset-bottom,0px))]">
      <style>{getTermsPreviewContentStyles()}</style>
      {htmlContent ? (
        <div
          ref={contentRef}
          className={TERMS_PREVIEW_CONTENT_CLASS}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      ) : (
        <p className="px-5 py-10 text-center text-sm text-[var(--grayscale-gr-500,#82817D)]">
          {isPending ? "문서를 불러오는 중…" : "약관을 불러오지 못했어요."}
        </p>
      )}
    </div>
  );
}
