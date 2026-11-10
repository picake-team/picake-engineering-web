import * as React from "react";

import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    const inFrame = useInMobileFrame();
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          inFrame &&
            "min-h-[104px] resize-none rounded-control border-ink-200 bg-white px-4 py-3 font-app text-body leading-normal text-ink-900 shadow-none placeholder:text-ink-500 focus-visible:border-[1.5px] focus-visible:border-ink-900 focus-visible:ring-0 md:text-body",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
