/**
 * 목록 줄과 묶음 (디자인 기준 B-3).
 * - 목록 줄: 최소 높이 56, 이름 16/600, 설명 13 #686864. 오른쪽에 숫자·켜고 끄기·값·화살표(400 회색)
 * - 같은 묶음 안 줄 사이는 얇은 선(100), 묶음과 묶음 사이는 회색 띠 8(50)
 * - 흐리게(dimmed): 색만 바꾸고 크기·굵기는 그대로(이름 #686864, 0건 숫자 #8C8C88)
 */
import React from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { Icon } from "@/apps/web-seller/common/ui/icons";

interface RowContentProps {
  leading?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** 오른쪽 값(숫자·켜고 끄기·글자) */
  trailing?: React.ReactNode;
  /** 오른쪽 화살표(누르면 다른 화면) */
  chevron?: boolean;
  dimmed?: boolean;
  /** 마지막 줄은 아래 선 없음 */
  divider?: boolean;
  /** 홈 "처리할 주문"처럼 큰 줄은 64 */
  tall?: boolean;
}

function rowClass({ divider = true, tall = false }: RowContentProps) {
  return cx(
    "flex w-full items-center gap-3 py-2 text-left font-app",
    tall ? "min-h-14" : "min-h-13",
    divider && "border-b border-ink-100",
  );
}

function RowContent({ leading, title, description, trailing, chevron, dimmed }: RowContentProps) {
  return (
    <>
      {leading}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={cx("text-body font-semibold", dimmed ? "text-ink-600" : "text-ink-900")}>
          {title}
        </span>
        {description ? <span className="text-caption text-ink-600">{description}</span> : null}
      </span>
      {trailing}
      {chevron ? (
        <span className="shrink-0 text-ink-400">
          <Icon name="chevronRight" size={18} strokeWidth={2} />
        </span>
      ) : null}
    </>
  );
}

/** 다른 화면으로 가는 줄 */
export function ListRowLink({
  to,
  className,
  ...props
}: RowContentProps & { to: LinkProps["to"]; className?: string; state?: LinkProps["state"] }) {
  return (
    <Link
      to={to}
      state={props.state}
      className={cx(rowClass(props), "active:bg-ink-50", className)}
    >
      <RowContent chevron {...props} />
    </Link>
  );
}

/** 누르면 창이 열리거나 바로 일을 하는 줄 */
export function ListRowButton({
  onClick,
  className,
  disabled,
  ...props
}: RowContentProps & { onClick: () => void; className?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(rowClass(props), "active:bg-ink-50 disabled:opacity-40", className)}
    >
      <RowContent {...props} />
    </button>
  );
}

/** 누르는 곳이 오른쪽 부품(켜고 끄기)뿐인 줄, 또는 값만 보이는 줄 */
export function ListRow({ className, ...props }: RowContentProps & { className?: string }) {
  return (
    <div className={cx(rowClass(props), className)}>
      <RowContent {...props} />
    </div>
  );
}

/** 줄 맨 앞 40 아이콘 칸(모서리 12). 할 일이 있으면 연한 주황, 0건이면 회색 */
export function RowIconBox({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cx(
        "flex size-10 shrink-0 items-center justify-center rounded-control",
        active ? "bg-brand-tint" : "bg-ink-50",
      )}
    >
      {children}
    </span>
  );
}

/** 줄 오른쪽 큰 숫자(20/700). 0건이면 흐리게 */
export function RowCount({ value, dimmed }: { value: React.ReactNode; dimmed?: boolean }) {
  return (
    <span
      className={cx(
        "shrink-0 text-heading font-bold tabular-nums",
        dimmed ? "text-ink-400" : "text-ink-900",
      )}
    >
      {value}
    </span>
  );
}

/** 묶음 제목(18/700) + 오른쪽 글자 버튼 */
export function GroupTitle({
  children,
  action,
  as: Tag = "h2",
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  as?: "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={cx("flex min-h-11 items-center justify-between gap-3", className)}>
      <Tag className="font-app text-group font-bold text-ink-900">{children}</Tag>
      {action}
    </div>
  );
}

/** 긴 입력 화면의 칸 묶음 제목(16/700) + 설명(13) */
export function SectionTitle({
  title,
  description,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-1 font-app", className)}>
      <h3 className="text-body font-bold text-ink-900">{title}</h3>
      {description ? <p className="text-caption text-ink-600">{description}</p> : null}
    </div>
  );
}

/** 묶음과 묶음 사이 회색 띠 8. 화면 좌우 여백 20을 넘어 가득 차게 */
export function GrayBand({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx("-mx-5 h-2 bg-ink-50", className)} />;
}

/** 정보 줄: 이름 14 회색(너비 64) + 값. important면 16/600(주문 상세), 아니면 14/600(마이페이지) */
export function InfoRow({
  label,
  value,
  important = true,
  action,
  className,
  labelClassName,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  important?: boolean;
  action?: React.ReactNode;
  className?: string;
  /** 이름 칸 너비(기본 64, "휴대폰 번호"처럼 긴 이름은 88) */
  labelClassName?: string;
}) {
  return (
    <div className={cx("flex min-h-11 items-center gap-3 font-app", className)}>
      <span className={cx("w-16 shrink-0 text-sub text-ink-600", labelClassName)}>{label}</span>
      <span
        className={cx(
          "flex min-w-0 flex-1 flex-col gap-1 break-words font-semibold text-ink-900",
          important ? "text-body" : "text-sub",
        )}
      >
        {value}
      </span>
      {action}
    </div>
  );
}
