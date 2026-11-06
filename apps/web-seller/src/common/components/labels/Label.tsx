import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => {
  const inFrame = useInMobileFrame();
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        labelVariants(),
        // 휴대폰 틀 안: 칸 이름 13/700 #4E4E4B
        inFrame && "font-app text-sub font-bold leading-normal text-ink-700",
        className,
      )}
      {...props}
    />
  );
});
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
