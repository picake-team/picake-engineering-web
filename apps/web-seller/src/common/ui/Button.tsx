/**
 * 버튼 (디자인 기준 B-3·B-6).
 * - primary: 주황 채움, 화면에 하나(버튼 둘이면 오른쪽). 못 누르면 회색 채움(#EBEBEA + #8C8C88) + 이유 문구는 버튼 위 한 줄.
 *   흐린 주황(투명도)은 분홍으로 보여 쓰지 않는다(운영자 의견 2026-11-10)
 * - secondary: 흰 바탕 + 테두리. 48은 15/700 진한 글씨, 40은 13/700 #4E4E4B
 * - quiet: 회색 글자 버튼(약한 행동: 그만두기·나중에·로그아웃) 13/400 #686864
 * 갈색(#B5401C) 글자 버튼은 쓰지 않는다(운영자 결정 2026-11-06). 위쪽 줄의 행동은 아이콘 버튼(HeaderIconButton),
 * 화면 안의 작은 행동은 secondary md로 한다. #B5401C는 배지·고칠 곳·경고 글씨에만 쓴다.
 * 누르는 칸은 모두 44 × 44 이상. 서버를 기다리는 동안(loading)은 "처리 중"으로 다시 눌리지 않게 한다.
 */
import React from "react";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { Icon } from "@/apps/web-seller/common/ui/icons";

type ButtonVariant = "primary" | "secondary" | "quiet";
type ButtonSize = "lg" | "md";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** lg = 48(주 버튼·입력 칸 옆 버튼), md = 40(작은 버튼). 누르는 영역은 44 이상 */
  size?: ButtonSize;
  /** 가로 가득 */
  block?: boolean;
  /** 서버를 기다리는 중: "처리 중"과 돌아가는 동그라미, 누를 수 없음 */
  loading?: boolean;
  loadingLabel?: string;
}

const BOX: Record<ButtonSize, string> = {
  lg: "h-12 px-4 text-body font-bold",
  md: "h-10 px-4 text-sub font-bold",
};

function variantClass(variant: ButtonVariant, size: ButtonSize, disabled: boolean): string {
  switch (variant) {
    case "primary":
      return cx(
        "rounded-control",
        disabled ? "bg-ink-100 text-ink-400" : "bg-brand text-white active:brightness-95",
      );
    case "secondary":
      return cx(
        "rounded-control border bg-white",
        disabled
          ? "border-ink-100 text-ink-400"
          : cx("border-ink-200 active:bg-ink-50", size === "lg" ? "text-ink-900" : "text-ink-700"),
      );
    case "quiet":
      return cx(
        "min-h-11 min-w-11 px-2 text-sub font-normal text-ink-600",
        disabled ? "text-ink-400" : "active:text-ink-900",
      );
  }
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-[18px] animate-spin rounded-full border-[2.5px] border-white/45 border-t-white"
    />
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "lg",
    block = false,
    loading = false,
    loadingLabel = "처리 중",
    disabled,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  const isText = variant === "quiet";
  const isDisabled = Boolean(disabled) || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-app transition-[filter,opacity,background-color] disabled:cursor-not-allowed",
        isText ? "bg-transparent" : BOX[size],
        // 처리 중에는 흐리게 하지 않는다(B-3: 주황 그대로 + 동그라미)
        variantClass(variant, size, Boolean(disabled) && !loading),
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {loading && variant === "primary" ? (
        <>
          <Spinner />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
});

/** 두 버튼 줄: 왼쪽 흰 보조, 오른쪽 주황 주 버튼 */
export function ButtonPair({
  children,
  className,
  primaryWeight = 1,
}: {
  children: [React.ReactNode, React.ReactNode];
  className?: string;
  /** 주 버튼 너비 비율(보조 1 기준). 아래 고정 띠의 "고칠 곳 · 등록하기"는 2 */
  primaryWeight?: 1 | 2;
}) {
  return (
    <div className={cx("flex gap-2", className)}>
      <div className="flex min-w-0 flex-1 [&>*]:w-full">{children[0]}</div>
      <div className={cx("flex min-w-0 [&>*]:w-full", primaryWeight === 2 ? "flex-[2]" : "flex-1")}>
        {children[1]}
      </div>
    </div>
  );
}

/** 동그라미 아이콘 버튼: 보이는 크기 36, 누르는 칸 44 (전화·문자·복사·공유) */
export const CircleIconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: React.ComponentProps<typeof Icon>["name"];
    label: string;
  }
>(function CircleIconButton({ icon, label, className, type = "button", ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "group inline-flex size-11 shrink-0 items-center justify-center rounded-full",
        className,
      )}
      {...rest}
    >
      <span className="inline-flex size-9 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 group-active:bg-ink-50">
        <Icon name={icon} size={18} strokeWidth={1.9} />
      </span>
    </button>
  );
});

/** 동그라미 아이콘 링크(전화 tel:·문자 sms:처럼 휴대폰 앱을 여는 곳) */
export function CircleIconLink({
  icon,
  label,
  href,
  className,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      className={cx(
        "group inline-flex size-11 shrink-0 items-center justify-center rounded-full",
        className,
      )}
    >
      <span className="inline-flex size-9 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 group-active:bg-ink-50">
        <Icon name={icon} size={18} strokeWidth={1.9} />
      </span>
    </a>
  );
}

/**
 * 검색 칸 옆 아이콘 버튼(정렬·거르기). 검색 칸과 같은 높이 40·회색 칸·모서리로 나란히 두어 화면 양쪽 여백이
 * 같아 보이게 한다(동그라미 테두리 버튼은 오른쪽 끝에 붙어 보였음, 2026-11-06). 누르는 칸은 44.
 * active면 거르기를 쓰는 중이라 주황 점을 단다.
 */
export function FieldIconButton({
  icon,
  label,
  active = false,
  className,
  type = "button",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type={type}
      aria-label={active ? `${label}, 거르는 중` : label}
      className={cx(
        "relative inline-flex size-10 shrink-0 items-center justify-center rounded-control bg-ink-50 text-ink-700 before:absolute before:-inset-0.5 before:content-[''] active:bg-ink-100",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={20} strokeWidth={1.9} />
      {active ? (
        <span
          aria-hidden="true"
          className="absolute right-2 top-2 size-1.5 rounded-full bg-brand"
        />
      ) : null}
    </button>
  );
}

/** 위쪽 줄의 아이콘 버튼(44). count가 있으면 오른쪽 위 주황 숫자 */
export const HeaderIconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: React.ComponentProps<typeof Icon>["name"];
    label: string;
    count?: number;
  }
>(function HeaderIconButton({ icon, label, count, className, type = "button", ...rest }, ref) {
  const shown = count && count > 0 ? (count > 99 ? "99+" : String(count)) : null;
  return (
    <button
      ref={ref}
      type={type}
      aria-label={shown ? `${label}, 안 읽은 알림 ${shown}개` : label}
      className={cx(
        "relative inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-900 active:bg-ink-50",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={24} strokeWidth={1.8} />
      {shown ? (
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-tab font-bold leading-none text-white"
        >
          {shown}
        </span>
      ) : null}
    </button>
  );
});
