import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  name,
  className,
}: CheckboxProps) {
  // 휴대폰 틀 안: 체크 칸 22 · 모서리 6 · 주황, 누르는 줄 44
  const inFrame = useInMobileFrame();
  return (
    <label
      className={cn(
        "flex items-center gap-2",
        inFrame && "min-h-11 gap-3 font-app",
        // 휴대폰 틀 안: 못 누를 때 흐리게(흐린 주황=분홍) 하지 않고 회색으로(못 누르는 주 버튼과 같게)
        disabled ? cn("cursor-not-allowed", !inFrame && "opacity-50") : "cursor-pointer",
        className,
      )}
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-background",
          inFrame && "size-[22px] rounded-check border-[1.5px]",
          inFrame && !checked && "border-ink-200 bg-white",
          inFrame && disabled && (checked ? "border-ink-100 bg-ink-100 text-ink-400" : "bg-ink-50"),
        )}
      >
        {checked ? (
          <Check className={inFrame ? "size-3.5" : "size-3"} strokeWidth={3} aria-hidden />
        ) : null}
      </span>
      {label ? (
        <span
          className={cn(
            "text-sm leading-5 text-foreground",
            inFrame && "text-body leading-normal text-ink-900",
            inFrame && disabled && "text-ink-400",
          )}
        >
          {label}
        </span>
      ) : null}
    </label>
  );
}
