/**
 * 그날 주문서 묶음 인쇄(PC에만, 기획 I-54, 운영자 결정 2026-11-19). 홈 "오늘 주문서 인쇄"·캘린더 그날 칸에서 새 탭으로 연다.
 * 화면 위쪽 줄(날짜 바꾸기·인쇄하기)은 종이에 찍히지 않고, 주문 한 칸이 두 장에 걸쳐 잘리지 않는다.
 * 내용은 order-print.util(buildPrintSheets)이 정한다.
 */
import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { NO_REPLAY } from "@/apps/web-seller/common/constants/replay.constant";
import {
  addDaysToKey,
  formatKeyMonthDayWeek,
  isDateKey,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { useKstTodayKey } from "@/apps/web-seller/common/hooks/useKstTodayKey";
import { useCalendarMonthOrders } from "@/apps/web-seller/features/order/hooks/queries/useOrderQuery";
import { useManualOrdersInRange } from "@/apps/web-seller/features/manual-order/hooks/queries/useManualOrderQuery";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import {
  buildPrintSheets,
  type PrintSheet,
} from "@/apps/web-seller/features/order/utils/order-print.util";
import { LoadErrorState } from "@/apps/web-seller/common/ui/Surface";

function Sheet({ sheet, index }: { sheet: PrintSheet; index: number }) {
  return (
    <article
      className={cx(
        NO_REPLAY,
        "flex break-inside-avoid flex-col gap-3 rounded-card border border-ink-200 p-5 print:rounded-none print:border-ink-900",
      )}
    >
      <header className="flex items-baseline gap-3">
        <span className="text-[28px] font-bold tabular-nums leading-none text-ink-900">
          {sheet.time}
        </span>
        <span className="min-w-0 flex-1 text-group font-bold text-ink-900">{sheet.title}</span>
        <span className="shrink-0 text-sub text-ink-600">
          {index + 1}. {sheet.tag}
        </span>
      </header>
      {sheet.lines.length ? (
        <ul className="flex flex-col gap-0.5 text-body text-ink-900">
          {sheet.lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      ) : null}
      {sheet.texts.map((t, i) => (
        <div
          key={i}
          className="flex flex-col gap-1 rounded-control border border-ink-200 px-4 py-3"
        >
          <span className="text-sub font-bold text-ink-700">{t.label}</span>
          <span className="whitespace-pre-wrap break-words text-[22px] font-bold leading-snug text-ink-900">
            {t.text}
          </span>
        </div>
      ))}
      {sheet.request ? (
        <div className="flex flex-col gap-1">
          <span className="text-sub font-bold text-ink-700">요청 사항</span>
          <span className="whitespace-pre-wrap break-words text-body text-ink-900">
            {sheet.request}
          </span>
        </div>
      ) : null}
      {sheet.memo ? (
        <div className="flex flex-col gap-1">
          <span className="text-sub font-bold text-ink-700">메모</span>
          <span className="whitespace-pre-wrap break-words text-body text-ink-900">
            {sheet.memo}
          </span>
        </div>
      ) : null}
      {sheet.photos.length ? (
        <div className="flex flex-wrap gap-2">
          {sheet.photos.map((src, i) => (
            <span key={src} className="relative">
              <img
                src={src}
                alt={`참고 사진 ${i + 1}`}
                className="size-[120px] rounded-control border border-ink-100 object-cover"
              />
              {sheet.photos.length > 1 ? (
                <span className="absolute left-1 top-1 flex size-5 items-center justify-center rounded-full bg-ink-900/70 text-badge font-bold text-white">
                  {i + 1}
                </span>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
      <footer className="flex flex-wrap gap-x-4 gap-y-1 border-t border-ink-100 pt-2 text-sub text-ink-700">
        {sheet.customer ? <span>예약자 {sheet.customer}</span> : null}
        {sheet.price ? <span>{sheet.price}</span> : null}
        {sheet.orderNumber ? <span>주문번호 {sheet.orderNumber}</span> : null}
      </footer>
    </article>
  );
}

export const StoreDetailPrintOrdersPage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const [params, setParams] = useSearchParams();
  const todayKey = useKstTodayKey();
  const raw = params.get("date");
  const dateKey = isDateKey(raw) ? raw : todayKey;
  const { data: store } = useStoreDetail(storeId);
  const orders = useCalendarMonthOrders(storeId, dateKey, dateKey);
  const manuals = useManualOrdersInRange(storeId, dateKey, dateKey);
  const loaded = Boolean(orders.data) && (Boolean(manuals.data) || manuals.isError);
  const sheets = loaded
    ? buildPrintSheets(dateKey, orders.data?.data ?? [], manuals.data ?? [])
    : [];
  const go = (delta: number) => {
    const p = new URLSearchParams(params);
    p.set("date", addDaysToKey(dateKey, delta));
    setParams(p, { replace: true });
  };

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-5 px-6 py-6 font-app text-ink-900 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">
          {formatKeyMonthDayWeek(dateKey)} 주문서
          {loaded ? (
            <span className="ml-2 text-body font-semibold text-ink-600">{sheets.length}건</span>
          ) : null}
        </h1>
        <span className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={() => go(-1)} aria-label="전날">
            <Icon name="back" size={16} strokeWidth={2} />
            전날
          </Button>
          <Button variant="secondary" size="md" onClick={() => go(1)} aria-label="다음 날">
            다음 날
            <Icon name="chevronRight" size={16} strokeWidth={2} />
          </Button>
          <Button
            size="md"
            onClick={() => window.print()}
            disabled={!loaded || sheets.length === 0}
          >
            인쇄하기
          </Button>
        </span>
      </div>
      {/* 종이 맨 위: 가게 이름 · 날짜 */}
      <p className="hidden text-body font-bold print:block">
        {store?.name} · {formatKeyMonthDayWeek(dateKey)} 픽업 {sheets.length}건
      </p>
      {orders.isError && !orders.data ? (
        <LoadErrorState big onRetry={() => void orders.refetch()} />
      ) : !loaded ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="불러오는 중">
          <span className="block h-40 animate-pulse rounded-card bg-ink-50" />
          <span className="block h-40 animate-pulse rounded-card bg-ink-50" />
        </div>
      ) : sheets.length === 0 ? (
        <p className="rounded-card border border-dashed border-ink-200 px-5 py-10 text-center text-body text-ink-600">
          이 날은 픽업이 없어요
        </p>
      ) : (
        <div className="flex flex-col gap-4 print:gap-3">
          {manuals.isError ? (
            <p className="text-sub font-semibold text-brand-ink print:hidden">
              직접 적은 주문을 불러오지 못해 Picake 주문만 보여요
            </p>
          ) : null}
          {sheets.map((s, i) => (
            <Sheet key={s.key} sheet={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};
