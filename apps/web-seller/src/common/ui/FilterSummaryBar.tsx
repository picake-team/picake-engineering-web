/**
 * 걸러 둔 조건 한 줄 + 지우기(주문·상품 목록, 휴대폰·PC 공용). 휴대폰은 누르기 쉬운 44 칸, PC는 36에 마우스 올리면 회색.
 */
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { useIsDesktopShell } from "@/apps/web-seller/common/ui/shell";

export function FilterSummaryBar({
  text,
  onClear,
  clearLabel,
}: {
  text: string;
  onClear: () => void;
  clearLabel: string;
}) {
  const pc = useIsDesktopShell();
  return (
    <div
      className={cx(
        "flex items-center gap-2 rounded-control bg-ink-50 pl-4",
        pc ? "py-1.5 pr-2" : "py-2 pr-3",
      )}
    >
      <span className="min-w-0 flex-1 truncate text-sub font-bold text-ink-700">{text}</span>
      <button
        type="button"
        aria-label={clearLabel}
        onClick={onClear}
        className={cx(
          "inline-flex shrink-0 items-center justify-center rounded-full text-ink-700",
          pc ? "size-9 hover:bg-ink-100" : "-my-2 -mr-2 size-11 active:bg-ink-100",
        )}
      >
        <Icon name="close" size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
