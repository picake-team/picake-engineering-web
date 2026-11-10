import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BaseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * 휴대폰 틀(MobileFrame) 안에서는 판매자 앱 디자인 기준 버튼으로 그린다(긴 입력 화면 다시 그리기, I-48).
 * 높이 40(작은 버튼)·48(lg), 모서리 12, 13/700. 보조는 흰 바탕 + 회색 테두리, 검정·회색·진한 채움은 쓰지 않는다.
 * 글자만 있는 버튼(ghost·link)도 화면 안에서는 흰 테두리 작은 버튼으로 그린다(갈색·검정 글자 버튼 금지, 11-06 운영자 결정).
 * 아이콘만 있는 ghost 버튼은 옵션값·환불 규정의 × 버튼처럼 동그란 흰 테두리, 아이콘은 회색(빨강·갈색 아이콘 쓰지 않음).
 */
const FRAME_SIZE: Record<string, string> = {
  default: "h-10 rounded-control px-4 font-app text-sub font-bold",
  sm: "h-9 rounded-control px-3 font-app text-sub font-bold",
  lg: "h-12 rounded-control px-4 font-app text-body font-bold",
  icon: "size-10 rounded-control",
};
const FRAME_VARIANT: Record<string, string> = {
  // 못 누를 때는 회색 채움(앱 Button과 같음)
  default: "shadow-none disabled:bg-ink-100 disabled:text-ink-400 disabled:opacity-100",
  destructive: "border border-ink-200 bg-white text-ink-900 shadow-none hover:bg-ink-50",
  outline: "border-ink-200 bg-white text-ink-700 shadow-none hover:bg-ink-50 hover:text-ink-900",
  secondary: "border border-ink-200 bg-white text-ink-700 shadow-none hover:bg-ink-50",
  ghost: "border border-ink-200 bg-white text-ink-700 shadow-none hover:bg-ink-50",
  link: "border border-ink-200 bg-white text-ink-700 no-underline shadow-none hover:bg-ink-50 hover:no-underline",
};
const FRAME_ICON_GHOST =
  "size-9 rounded-full border border-ink-200 bg-white text-ink-700 shadow-none hover:bg-ink-50 [&_svg]:text-ink-700";

const BaseButton = React.forwardRef<HTMLButtonElement, BaseButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const inFrame = useInMobileFrame();
    const Comp = (asChild ? Slot : "button") as React.ElementType;
    if (inFrame) {
      return (
        <Comp
          className={cn(
            buttonVariants({ variant, size }),
            FRAME_SIZE[size ?? "default"],
            FRAME_VARIANT[variant ?? "default"],
            className,
            variant === "ghost" && size === "icon" && FRAME_ICON_GHOST,
          )}
          ref={ref}
          {...props}
        />
      );
    }
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
BaseButton.displayName = "BaseButton";

export { BaseButton, buttonVariants };
