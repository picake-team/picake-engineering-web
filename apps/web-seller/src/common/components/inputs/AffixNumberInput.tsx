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
      className={`flex h-12 min-w-0 items-center gap-2 rounded-control bg-white px-4 font-app ${
        invalid
          ? "border-[1.5px] border-brand"
          : "border border-ink-200 focus-within:border-[1.5px] focus-within:border-ink-900"
      }`}
    >
      {prefix ? <span className="shrink-0 text-sub text-ink-600">{prefix}</span> : null}
      <NumberInput
        {...props}
        className={`h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:border-0 ${
          prefix ? "text-right" : "text-left"
        }`}
      />
      <span className="shrink-0 text-sub text-ink-600">{suffix}</span>
    </label>
  );
}
