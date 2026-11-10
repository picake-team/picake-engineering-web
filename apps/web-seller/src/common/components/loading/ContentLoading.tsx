import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { SellerAppLogo } from "@/apps/web-seller/common/components/branding/SellerAppLogo";
import { LoadingSpinner } from "@/apps/web-seller/common/components/loading/LoadingSpinner";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";

export type ContentLoadingVariant = "inline" | "section" | "page";

export interface ContentLoadingProps {
  message?: string;
  variant?: ContentLoadingVariant;
  /** 기본값은 variant에 따라 자동 */
  spinnerSize?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** variant가 page일 때 로고 카드 표시 */
  showLogo?: boolean;
}

/**
 * 라우트·카드·목록 등 본문 영역 로딩 (전역 오버레이는 LoadingFallback 사용)
 */
export function ContentLoading({
  message = "불러오는 중…",
  variant = "section",
  spinnerSize,
  className,
  showLogo = false,
}: ContentLoadingProps) {
  const size = spinnerSize ?? (variant === "inline" ? "sm" : variant === "page" ? "lg" : "md");
  const inFrame = useInMobileFrame();

  // 휴대폰 틀 안(상품·피드·스토어 정보 화면): 앱 화면과 같은 회색 뼈대(칸 이름 + 입력 칸 모양)
  if (inFrame && variant !== "inline") {
    return (
      <div role="status" aria-label={message} aria-busy="true" className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <span className="block h-4 w-24 animate-pulse rounded-check bg-ink-50" />
            <span className="block h-12 animate-pulse rounded-control bg-ink-50" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium text-zinc-500",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <LoadingSpinner size={size} />
        <span>{message}</span>
      </div>
    );
  }

  if (variant === "page") {
    return (
      <div
        className={cn(
          "flex min-h-[min(360px,50vh)] w-full flex-col items-center justify-center gap-5 rounded-lg border border-zinc-200/80 bg-gradient-to-b from-zinc-50/90 to-white px-6 py-16 shadow-sm",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        {showLogo ? (
          <div className="rounded-xl border border-zinc-200/80 bg-white px-6 py-4 shadow-sm">
            <SellerAppLogo width={72} className="opacity-90" />
          </div>
        ) : null}
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="xl" className="text-zinc-600" />
          <p className="max-w-sm text-center text-sm font-medium leading-relaxed text-zinc-600">
            {message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-10 text-center sm:py-12",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size={size} />
      <p className="text-sm font-medium text-zinc-500">{message}</p>
    </div>
  );
}
