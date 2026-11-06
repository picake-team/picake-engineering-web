import React from "react";
import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";

interface FormSectionProps {
  id?: string;
  title: React.ReactNode;
  /** 제목 옆 '(선택)' 같은 짧은 표시 */
  hint?: React.ReactNode;
  description?: React.ReactNode;
  /** 제목 오른쪽 버튼 */
  action?: React.ReactNode;
  error?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** 판매자 입력 폼(상품·스토어)의 한 덩어리. 카드 안에 카드를 겹치지 않도록 이것 하나만 쓴다 */
export function FormSection({
  id,
  title,
  hint,
  description,
  action,
  error,
  className,
  children,
}: FormSectionProps) {
  const inFrame = useInMobileFrame();
  if (inFrame) {
    // 휴대폰 틀 안: 카드 없이 묶음 제목 16/700 + 설명 13, 묶음 사이는 1px 선(디자인 6-E·6-F·A66b)
    return (
      <section
        id={id}
        className={cn(
          "scroll-mt-24 border-t border-ink-100 pt-6 font-app first:border-t-0 first:pt-0",
          className,
        )}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className={cn("text-group font-bold", error ? "text-brand-ink" : "text-ink-900")}>
              {title}
              {hint && <span className="ml-1.5 text-sub font-normal text-ink-600">{hint}</span>}
            </h2>
            {description && <p className="mt-1 text-sub text-ink-600">{description}</p>}
          </div>
          {action}
        </div>
        {children}
      </section>
    );
  }
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 rounded-xl border bg-card p-5 sm:p-6",
        error && "border-destructive",
        className,
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">
            {title}
            {hint && (
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">{hint}</span>
            )}
          </h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
