import React from "react";
import { cn } from "@/apps/web-seller/common/utils/classname.util";

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
