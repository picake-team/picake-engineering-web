import * as React from "react";

import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";

const BaseInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onClick, ...props }, ref) => {
    const inFrame = useInMobileFrame();
    const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
      onClick?.(event);
      if (type !== "date") {
        return;
      }

      const input = event.currentTarget as HTMLInputElement & {
        showPicker?: () => void;
      };
      try {
        input.showPicker?.();
      } catch {
        // showPicker 미지원 브라우저는 기본 동작을 사용합니다.
      }
    };

    return (
      <input
        type={type}
        onClick={handleClick}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          // 휴대폰 틀 안: 입력 칸 48 · 모서리 12 · 15 · 입력 중 진한 회색 테두리(디자인 기준 B-3)
          inFrame &&
            "h-12 rounded-control border-ink-200 bg-white px-4 font-app text-body text-ink-900 shadow-none placeholder:text-ink-500 focus-visible:border-[1.5px] focus-visible:border-ink-900 focus-visible:ring-0 md:text-body",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
BaseInput.displayName = "BaseInput";

export { BaseInput };
