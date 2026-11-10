"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Icon } from "@/apps/web-user/common/components/icons";

/**
 * 커스텀 Checkbox 컴포넌트
 * - 내부적으로 실제 <input type="checkbox">를 렌더링(a11y) 후 시각적 표시는 Icon으로 커스터마이즈
 * - label을 통해 input과 텍스트가 연결되어 키보드/스크린리더 접근 가능
 * - RadioGroup과 동일한 톤: gap-1.5, sr-only input, 시각 표시는 별도 요소
 * - 켜질 때 체크 선이 그려진다(공용 움직임 값 check-draw). 처음 그릴 때는 움직이지 않는다
 *
 * @example
 * <Checkbox checked={agreed} onChange={setAgreed} label="이용약관에 동의합니다" />
 */
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

/**
 * 체크 칸 모양. 고르면 체크 선이 그려진다(공용 움직임 값 check-draw, 처음 그릴 때는 그대로).
 * Checkbox와, 거르기 창처럼 줄을 직접 그리는 곳이 같이 쓴다(같은 모양·같은 움직임).
 */
export function CheckboxMark({ checked, size = 16 }: { checked: boolean; size?: number }) {
  const wasChecked = useRef(checked);
  const [drawCount, setDrawCount] = useState(0);
  useEffect(() => {
    if (checked && !wasChecked.current) setDrawCount((n) => n + 1);
    wasChecked.current = checked;
  }, [checked]);

  if (!checked) {
    return (
      <Icon
        name="checkboxSmallDefault"
        width={size}
        height={size}
        className="shrink-0"
        aria-hidden
      />
    );
  }
  // checkbox-small-selected 아이콘과 같은 모양을 선으로 그려 체크가 그려지게 한다
  return (
    <svg
      key={drawCount}
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className="shrink-0 text-primary"
      aria-hidden
    >
      <rect x="2" y="2" width="16" height="16" rx="3.56" fill="currentColor" />
      <path
        d="M6.14 9.49 8.93 12.28 14.17 7.03"
        fill="none"
        stroke="white"
        strokeWidth={1.15}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        className={drawCount > 0 ? "animate-check-draw motion-reduce:animate-none" : undefined}
      />
    </svg>
  );
}

export const Checkbox = ({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  name,
  className,
}: CheckboxProps) => {
  return (
    <label
      className={clsx(
        "flex items-center gap-1.5",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
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
      <CheckboxMark checked={checked} />
      {label && <span className="text-sm text-gray-900">{label}</span>}
    </label>
  );
};
