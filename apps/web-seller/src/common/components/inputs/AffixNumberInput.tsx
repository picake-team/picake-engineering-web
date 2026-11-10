import React from "react";
import { NumberInput } from "@/apps/web-seller/common/components/inputs/NumberInput";

/** 휴대폰 틀 안 숫자 칸: 칸 안 왼쪽에 이름, 오른쪽에 단위(48 한 칸에 "지름 10 cm") */
export function AffixNumberInput({
  prefix,
  suffix,
  invalid = false,
  ...props
}: React.ComponentProps<typeof NumberInput> & {
  prefix?: string;
  suffix: string;
  invalid?: boolean;
}) {
  return (
    <label
      className={`flex h-12 min-w-0 items-center rounded-control bg-white font-app ${
        // 이름이 붙은 칸은 한 줄에 둘씩 놓이므로 360 폭에서도 "100,000"이 들어가게 안쪽을 줄인다
        prefix ? "gap-1.5 px-3" : "gap-2 px-4"
      } ${
        invalid
          ? "border-[1.5px] border-brand"
          : "border border-ink-200 focus-within:border-[1.5px] focus-within:border-ink-900"
      }`}
    >
      {prefix ? <span className="shrink-0 text-caption text-ink-600">{prefix}</span> : null}
      <NumberInput
        thousands={suffix === "원"}
        {...props}
        className={`h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:border-0 ${
          prefix ? "text-right" : "text-left"
        }`}
      />
      <span className="shrink-0 text-sub text-ink-600">{suffix}</span>
    </label>
  );
}
