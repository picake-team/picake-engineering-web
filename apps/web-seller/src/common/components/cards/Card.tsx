import * as React from "react";

import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";

/*
 * 휴대폰 틀(MobileFrame) 안에서는 카드 테두리·그림자·안쪽 여백 없이 흰 바탕에 그대로 그린다
 * (판매자 앱 디자인: 카드 안에 카드를 겹치지 않고, 화면 좌우 여백 20만 둔다).
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const inFrame = useInMobileFrame();
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow",
          className,
          inFrame && "rounded-none border-0 bg-transparent font-app shadow-none",
        )}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const inFrame = useInMobileFrame();
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className, inFrame && "px-0 pt-0")}
        {...props}
      />
    );
  },
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const inFrame = useInMobileFrame();
    return (
      <div
        ref={ref}
        className={cn(
          "font-semibold leading-none tracking-tight",
          inFrame && "text-group font-bold leading-normal text-ink-900",
          className,
        )}
        {...props}
      />
    );
  },
);
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const inFrame = useInMobileFrame();
    return <div ref={ref} className={cn("p-6 pt-0", className, inFrame && "p-0")} {...props} />;
  },
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
