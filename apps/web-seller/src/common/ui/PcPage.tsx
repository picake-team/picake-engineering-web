/**
 * PC 화면 틀과 칸(기획 I-54, 시안 D).
 *
 * - PcPage: 위쪽 줄(스토어 이름 작게 + 화면 제목 22/700 + 오른쪽 행동) + 본문. 흰 바탕.
 *   fill이면 화면 높이에 맞추고 안쪽 칸이 스스로 스크롤한다(주문·채팅의 목록 | 상세).
 * - PcPanel: 테두리 칸(흰 바탕 · 선 #EBEBEA · 모서리 16). 회색 바탕 대신 칸으로 나눈다(시안 D).
 * - PcSplit: 목록 | 상세 두 칸(840부터). 목록 최소 360, 상세 390~560(상세 칸은 휴대폰 화면을 그대로 넣는다).
 */
import React from "react";
import { useParams } from "react-router-dom";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";

export function PcPage({
  title,
  actions,
  children,
  fill = false,
  bodyClassName,
}: {
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** 화면 높이에 맞추고 안쪽 칸이 스크롤(나란히 보기) */
  fill?: boolean;
  bodyClassName?: string;
}) {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const { data: store } = useStoreDetail(storeId);
  return (
    <div
      className={cx(
        "flex flex-col bg-white font-app text-ink-900 [word-break:keep-all]",
        fill ? "h-[calc(100dvh-var(--act-as-band,0px))] min-h-0" : "min-h-dvh",
      )}
    >
      <header className="sticky top-[var(--act-as-band,0px)] z-20 flex min-h-[76px] shrink-0 items-center gap-4 bg-white px-6 nav:px-8">
        <div className="flex min-w-0 flex-col">
          {store?.name ? (
            <span className="truncate text-caption text-ink-600">{store.name}</span>
          ) : null}
          <h1 className="truncate text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink-900">
            {title}
          </h1>
        </div>
        {actions ? <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div> : null}
      </header>
      <main
        className={cx(
          "flex flex-col gap-4 px-6 pb-8 nav:px-8",
          fill ? "min-h-0 flex-1 pb-6" : "flex-1",
          bodyClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}

export function PcPanel({
  title,
  action,
  children,
  className,
  bodyClassName,
  as: Tag = "section",
  labelledBy,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  as?: "section" | "div";
  labelledBy?: string;
}) {
  return (
    <Tag
      aria-labelledby={labelledBy}
      className={cx("flex min-w-0 flex-col rounded-card border border-ink-100 bg-white", className)}
    >
      {title || action ? (
        <div className="flex min-h-[60px] items-center gap-2 px-5 pt-1">
          {title ? (
            <h2 id={labelledBy} className="min-w-0 truncate text-heading font-bold text-ink-900">
              {title}
            </h2>
          ) : null}
          {action ? <div className="ml-auto flex shrink-0 items-center gap-1">{action}</div> : null}
        </div>
      ) : null}
      <div className={cx("flex min-w-0 flex-col px-5 pb-5", bodyClassName)}>{children}</div>
    </Tag>
  );
}

/**
 * 목록 | 상세. 상세가 없으면(고르기 전) empty를 그린다.
 * - wide="list"(주문): 목록이 표라 넓게, 상세는 휴대폰 상세 화면이라 390~560
 * - wide="detail"(채팅): 목록은 360~400으로 두고 대화를 넓게(Material 3 목록-상세: 목록 고정 + 상세 늘어남)
 */
export function PcSplit({
  list,
  detail,
  empty,
  wide = "list",
  className,
}: {
  list: React.ReactNode;
  detail: React.ReactNode | null;
  empty: React.ReactNode;
  wide?: "list" | "detail";
  className?: string;
}) {
  return (
    <div
      className={cx(
        "grid min-h-0 flex-1 overflow-hidden rounded-card border border-ink-100",
        wide === "list"
          ? "grid-cols-[minmax(360px,1fr)_minmax(390px,560px)]"
          : "grid-cols-[minmax(320px,400px)_minmax(0,1fr)]",
        className,
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-ink-100">
        {list}
      </div>
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">{detail ?? empty}</div>
    </div>
  );
}
