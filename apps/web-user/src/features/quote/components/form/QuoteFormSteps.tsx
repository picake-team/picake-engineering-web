"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/apps/web-user/common/components/icons";
import { Calendar } from "@/apps/web-user/common/components/calendars/Calendar";
import { TextArea } from "@/apps/web-user/common/components/textareas/TextArea";
import { Checkbox } from "@/apps/web-user/common/components/inputs/Checkbox";
import { DualThumbRangeSlider } from "@/apps/web-user/common/components/sliders/DualThumbRangeSlider";
import { cn } from "@/apps/web-user/common/lib/utils";
import {
  QUOTE_CREAM_OPTIONS,
  QUOTE_LIMITS,
  QUOTE_SIZE_OPTIONS,
} from "@/apps/web-user/features/quote/constants/quote.constant";
import {
  useQuoteDraftStore,
  type QuoteDraft,
} from "@/apps/web-user/features/quote/store/quote-draft.store";
import {
  DistanceSlider,
  Field,
  HourRangeSheet,
  NoticeBox,
  Pill,
  StepTitle,
  Stepper,
} from "@/apps/web-user/features/quote/components/form/QuoteFormParts";
import {
  AreaSearchSheet,
  StoreBadge,
  StoreSearchSheet,
} from "@/apps/web-user/features/quote/components/form/QuoteSearchSheets";
import { quoteLocalApi } from "@/apps/web-user/features/quote/apis/quote.api";
import {
  firstSelectableHour,
  formatDeadline,
  formatHour,
  formatHourRange,
  formatShortDate,
  fromYmd,
  pickupWindow,
  kstHour,
  todayKstYmd,
  toYmd,
} from "@/apps/web-user/features/quote/utils/quote-time.util";
import { distanceKm, formatKm } from "@/apps/web-user/features/quote/utils/quote-geo.util";
import { shrinkPhoto } from "@/apps/web-user/features/quote/utils/quote-photo.util";
import { useUserLocation } from "@/apps/web-user/common/hooks/useUserLocation";
import { useAlertStore } from "@/apps/web-user/common/store/alert.store";

const won = (v: number) => `${v / 10_000}만원`;

/** "견적은 23일(수) 밤 11시까지 받아요" */
export function DeadlineNotice({ draft, now }: { draft: QuoteDraft; now: Date }) {
  if (!draft.pickupDate) return null;
  const w = pickupWindow(draft.pickupDate, draft.hourFrom, now);
  if (!w) return null;
  return <NoticeBox>견적은 {formatDeadline(w.deadline, now)}까지 받아요</NoticeBox>;
}

/* ───────────── 1단계: 언제 ───────────── */
export function StepWhen({ now }: { now: Date }) {
  const { draft, update } = useQuoteDraftStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const todayYmd = todayKstYmd(now);
  const minDate = useMemo(() => {
    const d = fromYmd(todayYmd);
    if (firstSelectableHour(todayYmd, now) === null) d.setDate(d.getDate() + 1);
    return d;
  }, [todayYmd, now]);
  const maxDate = useMemo(() => {
    const d = fromYmd(todayYmd);
    d.setDate(d.getDate() + 364);
    return d;
  }, [todayYmd]);
  const firstHour = draft.pickupDate ? (firstSelectableHour(draft.pickupDate, now) ?? 0) : 0;
  const [tempFrom, setTempFrom] = useState(14);
  const [tempTo, setTempTo] = useState(17);

  const openSheet = () => {
    const from = Math.max(draft.hourFrom ?? 14, firstHour);
    setTempFrom(from);
    setTempTo(Math.min(24, Math.max(draft.hourTo ?? from + 3, from + 1)));
    setSheetOpen(true);
  };

  // 날짜를 바꿔 고른 시간이 3시간 안이 되면 시간을 지운다
  useEffect(() => {
    if (
      draft.pickupDate &&
      draft.hourFrom !== null &&
      !pickupWindow(draft.pickupDate, draft.hourFrom, now)
    ) {
      update({ hourFrom: null, hourTo: null });
    }
  }, [draft.pickupDate, draft.hourFrom, now, update]);

  return (
    <div>
      <StepTitle title="언제 받으세요?" description="케이크를 찾으러 갈 날이에요" />
      <Field label="픽업 날짜">
        <Calendar
          selectedDate={draft.pickupDate ? fromYmd(draft.pickupDate) : null}
          minDate={minDate}
          maxDate={maxDate}
          onDateSelect={(date) => update({ pickupDate: toYmd(date) })}
        />
      </Field>
      <Field label="시간" optional="선택">
        <button
          type="button"
          disabled={!draft.pickupDate}
          onClick={openSheet}
          className="flex h-[42px] w-full items-center justify-between rounded-[8px] border border-gray-100 px-[12px] text-sm disabled:opacity-50"
        >
          <span className="flex items-center gap-[6px] text-gray-900">
            {draft.hourFrom !== null && draft.hourTo !== null
              ? formatHourRange(draft.hourFrom, draft.hourTo)
              : "아무 때나 괜찮아요"}
          </span>
          <span className="text-xs text-gray-500">바꾸기 ›</span>
        </button>
      </Field>
      <DeadlineNotice draft={draft} now={now} />
      <HourRangeSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        firstHour={firstHour}
        from={tempFrom}
        to={tempTo}
        onChange={(from, to) => {
          setTempFrom(from);
          setTempTo(to);
        }}
        onConfirm={() => {
          update({ hourFrom: tempFrom, hourTo: tempTo });
          setSheetOpen(false);
        }}
        onClear={() => {
          update({ hourFrom: null, hourTo: null });
          setSheetOpen(false);
        }}
      />
    </div>
  );
}

/* ───────────── 2단계: 어디서 ───────────── */
export function StepWhere() {
  const { draft, update } = useQuoteDraftStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!draft.area || draft.distance === "SIDO") {
      setCount(null);
      return;
    }
    let cancelled = false;
    quoteLocalApi
      .countPlaces(draft.area.latitude, draft.area.longitude, draft.distance)
      .then((n) => !cancelled && setCount(n))
      .catch(() => !cancelled && setCount(null));
    return () => {
      cancelled = true;
    };
  }, [draft.area, draft.distance]);

  // 현재 위치: 앱이면 앱을 거쳐, 웹이면 브라우저에서 받는다(지도·홈과 같은 방법, useUserLocation).
  // 이미 받아 둔 위치가 있으면 바로 쓴다. 기기 좌표는 동네로 바꾸는 데만 쓰고 요청서에 저장하지 않는다
  const { location, refresh } = useUserLocation();
  const [locateFailed, setLocateFailed] = useState(false);

  useEffect(() => {
    if (!locating || !location) return;
    let cancelled = false;
    quoteLocalApi
      .areaFromCoords(location.latitude, location.longitude)
      .then((area) => {
        if (cancelled) return;
        if (area) update({ area });
        else setLocateFailed(true);
      })
      .catch(() => !cancelled && setLocateFailed(true))
      .finally(() => !cancelled && setLocating(false));
    return () => {
      cancelled = true;
    };
  }, [locating, location, update]);

  useEffect(() => {
    if (!locating) return;
    const t = setTimeout(() => {
      setLocating(false);
      setLocateFailed(true);
    }, 10_000);
    return () => clearTimeout(t);
  }, [locating]);

  const useCurrentLocation = () => {
    setLocateFailed(false);
    setLocating(true);
    if (!location) refresh();
  };

  const sido = draft.area?.sido ?? "시·도";
  const rangeText = draft.distance === "SIDO" ? `${sido} 전체` : `${draft.distance}km 안`;

  return (
    <div>
      <StepTitle title="어디서 받으세요?" description="이 동네 근처 가게에 물어봐 드려요" />
      <Field label="받을 동네">
        <div className="flex gap-[8px]">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex h-[42px] min-w-0 flex-1 items-center gap-[6px] rounded-[8px] border border-gray-100 px-[12px] text-left text-sm"
          >
            <Icon name="search" width={16} height={16} className="shrink-0 text-gray-400" />
            <span className={cn("truncate", draft.area ? "text-gray-900" : "text-gray-400")}>
              {draft.area?.fullName ?? "동 이름으로 찾기"}
            </span>
          </button>
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="flex h-[42px] shrink-0 items-center gap-[4px] rounded-[8px] border border-gray-100 px-[12px] text-sm text-gray-700"
          >
            <Icon name="currentLocation" width={16} height={16} />
            {locating ? "찾는 중" : "현재 위치"}
          </button>
        </div>
        {locateFailed && (
          <p className="mt-[6px] text-xs text-gray-500">
            현재 위치를 찾지 못했어요. 동 이름으로 찾아 주세요.
          </p>
        )}
      </Field>
      {draft.area && (
        <Field
          label="어디까지 괜찮으세요?"
          right={
            <span className="text-xs text-gray-500">
              {count !== null && `케이크 가게 약 ${count}곳`}
            </span>
          }
          caption={
            count !== null && count < 3
              ? "이 범위에는 가게가 적어요. 거리를 넓혀 보세요"
              : `${draft.area.name}에서 ${rangeText}의 가게 중 몇 곳에 Picake가 물어봐 드려요`
          }
        >
          <p className="mb-[4px] text-base font-bold text-gray-900">{rangeText}</p>
          <DistanceSlider
            value={draft.distance}
            sidoLabel={sido}
            onChange={(distance) => update({ distance })}
          />
        </Field>
      )}
      <AreaSearchSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelect={(area) => {
          update({ area });
          setSheetOpen(false);
        }}
      />
    </div>
  );
}

/* ───────────── 3단계: 물어볼 가게 ───────────── */
export function StepStores() {
  const { draft, update } = useQuoteDraftStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const near = draft.area
    ? { latitude: draft.area.latitude, longitude: draft.area.longitude }
    : null;
  const rangeKm = draft.distance === "SIDO" ? null : draft.distance;

  return (
    <div>
      <StepTitle
        title="꼭 물어보고 싶은 가게가 있나요?"
        description={`없으면 넘어가도 돼요. ${QUOTE_LIMITS.MAX_STORES}곳까지 넣을 수 있어요`}
      />
      <Field label="가게 찾기">
        <button
          type="button"
          disabled={draft.stores.length >= QUOTE_LIMITS.MAX_STORES}
          onClick={() => setSheetOpen(true)}
          className="flex h-[40px] w-full items-center gap-[8px] rounded-full px-[16px] text-sm text-gray-400 shadow-[0_2px_8px_rgba(0,0,0,0.08)] disabled:opacity-50"
        >
          <Icon name="search" width={16} height={16} />
          가게 이름으로 찾기
        </button>
      </Field>
      {draft.stores.length > 0 && (
        <Field
          label="넣은 가게"
          right={
            <span className="text-xs text-gray-500">
              {draft.stores.length}/{QUOTE_LIMITS.MAX_STORES}
            </span>
          }
        >
          <ul className="flex flex-col gap-[8px]">
            {draft.stores.map((s) => {
              const km =
                near && s.latitude && s.longitude
                  ? distanceKm(near, { latitude: s.latitude, longitude: s.longitude })
                  : null;
              const outside = km !== null && rangeKm !== null && km > rangeKm;
              return (
                <li
                  key={s.key}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-[16px] py-[12px]"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-[6px]">
                      <span className="truncate text-sm font-bold text-gray-900">{s.name}</span>
                      <StoreBadge isPicake={s.isPicakeStore} />
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                      {[km !== null ? formatKm(km) : null, s.address].filter(Boolean).join(" · ")}
                    </span>
                    {outside && (
                      <span className="block text-xs text-gray-500">
                        고른 범위({rangeKm}km) 밖이어도 물어봐요
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    aria-label={`${s.name} 빼기`}
                    className="ml-[8px] shrink-0"
                    onClick={() => update({ stores: draft.stores.filter((x) => x.key !== s.key) })}
                  >
                    <Icon name="close" width={16} height={16} className="text-gray-400" />
                  </button>
                </li>
              );
            })}
          </ul>
        </Field>
      )}
      {draft.stores.length > 0 && !draft.onlyDesignatedStores && (
        <NoticeBox>
          넣은 가게와 근처 가게
          {rangeKm !== null ? `(${rangeKm}km 안)` : `(${draft.area?.sido ?? ""} 전체)`}에 함께
          물어봐요
        </NoticeBox>
      )}
      <StoreSearchSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        near={near}
        selectedKeys={draft.stores.map((s) => s.key)}
        onSelect={(store) => {
          if (
            draft.stores.length < QUOTE_LIMITS.MAX_STORES &&
            !draft.stores.some((s) => s.key === store.key)
          ) {
            update({ stores: [...draft.stores, store] });
          }
          setSheetOpen(false);
        }}
      />
    </div>
  );
}

/* ───────────── 4단계: 어떤 케이크 ───────────── */
export function StepCake() {
  const { draft, update } = useQuoteDraftStore();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [adding, setAdding] = useState(false);
  const { showAlert } = useAlertStore();
  const hasPhoto = draft.photos.length > 0;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const remaining = QUOTE_LIMITS.MAX_PHOTOS - draft.photos.length;
    if (!picked.length || remaining <= 0) return;
    setAdding(true);
    try {
      const results = await Promise.allSettled(picked.slice(0, remaining).map(shrinkPhoto));
      const shrunk = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
      if (shrunk.length < results.length) {
        showAlert({
          type: "warning",
          title: "사진을 올리지 못했어요",
          message: "열 수 없는 사진이 있어요. 다른 사진(JPG·PNG)으로 올려 주세요.",
        });
      }
      const current = useQuoteDraftStore.getState().draft.photos;
      update({
        photos: [
          ...current,
          ...shrunk.map((dataUrl) => ({ id: `${Date.now()}-${Math.random()}`, dataUrl })),
        ],
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <StepTitle title="어떤 케이크인가요?" description="사진이나 설명 중 하나만 있으면 돼요" />
      <Field
        label="참고 사진"
        optional={`${QUOTE_LIMITS.MAX_PHOTOS}장까지`}
        caption={hasPhoto ? undefined : "케이크 전체가 잘 보이는 사진일수록 견적이 정확해요"}
      >
        <div className="flex w-full gap-[6px] overflow-auto">
          {draft.photos.length < QUOTE_LIMITS.MAX_PHOTOS && (
            <button
              type="button"
              disabled={adding}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex h-[100px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200",
                hasPhoto ? "w-[100px] shrink-0" : "w-full",
              )}
            >
              <Icon name="addPhoto" width={24} height={24} className="mb-[4px] text-gray-300" />
              <span className="text-center text-sm text-gray-300">
                {adding ? "올리는 중…" : hasPhoto ? "사진 추가" : "참고할 사진을 올려 주세요"} (
                {draft.photos.length}/{QUOTE_LIMITS.MAX_PHOTOS})
                {!hasPhoto && <span className="block text-xs">인스타에서 본 사진도 괜찮아요</span>}
              </span>
            </button>
          )}
          {draft.photos.map((p) => (
            <div
              key={p.id}
              className="relative h-[100px] w-[100px] shrink-0 rounded-lg border border-gray-100"
            >
              <button
                type="button"
                aria-label="사진 빼기"
                className="absolute right-[5px] top-[5px]"
                onClick={() => update({ photos: draft.photos.filter((x) => x.id !== p.id) })}
              >
                <Icon name="removePhoto" width={20} height={20} />
              </button>
              <img
                src={p.dataUrl}
                alt="참고 사진"
                className="h-full w-full rounded-lg object-cover"
              />
            </div>
          ))}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onPick}
          />
        </div>
        {hasPhoto && (
          <div className="mt-[6px]">
            <NoticeBox>손으로 만드는 케이크라 사진과 조금 다를 수 있어요</NoticeBox>
          </div>
        )}
      </Field>
      <Field
        label="설명"
        caption={
          hasPhoto
            ? "사진과 다르게 하고 싶은 점이나 꼭 지켜야 할 점을 적어 주세요"
            : "원하는 케이크와 케이크에 쓸 글자를 적어 주세요"
        }
      >
        <TextArea
          value={draft.description}
          onChange={(description) => update({ description })}
          maxLength={QUOTE_LIMITS.DESCRIPTION_MAX}
          showCount
          placeholder={
            hasPhoto
              ? '예: 글씨는 "지수야 생일 축하해"로, 강아지 대신 곰돌이'
              : '예: 하늘색 바탕에 곰돌이, 글씨는 "지수야 생일 축하해"'
          }
        />
      </Field>
      <Field label="요청 사항" optional="선택">
        <TextArea
          value={draft.requestNote}
          onChange={(requestNote) => update({ requestNote })}
          maxLength={QUOTE_LIMITS.REQUEST_NOTE_MAX}
          showCount
          placeholder="알레르기, 초·토퍼 등"
        />
      </Field>
    </div>
  );
}

/* ───────────── 5단계: 크기와 예산 ───────────── */
export function StepSizeBudget() {
  const { draft, update } = useQuoteDraftStore();
  const [writing, setWriting] = useState(draft.flavorNote.length > 0);
  const size = QUOTE_SIZE_OPTIONS.find((s) => s.value === draft.size);
  const step = (v: number) => Math.round(v / QUOTE_LIMITS.BUDGET_STEP) * QUOTE_LIMITS.BUDGET_STEP;
  const budgetText = (min: number, max: number) =>
    max >= QUOTE_LIMITS.BUDGET_MAX
      ? `${won(min)} 이상`
      : min === max
        ? won(min)
        : `${won(min)} ~ ${won(max)}`;

  return (
    <div>
      <StepTitle title="크기와 예산을 알려 주세요" description="대략 골라도 괜찮아요" />
      <Field label="크기" caption={size ? `${size.diameter} · 가게마다 조금씩 달라요` : undefined}>
        <div className="grid grid-cols-3 gap-[8px]">
          {QUOTE_SIZE_OPTIONS.map((s) => (
            <Pill
              key={s.value}
              selected={draft.size === s.value}
              onClick={() => update({ size: s.value })}
              className="h-[44px] flex-col gap-0 rounded-[12px] px-[8px] leading-tight"
            >
              <span>{s.label}</span>
              <span className="text-2xs font-normal text-gray-500">{s.people}</span>
            </Pill>
          ))}
        </div>
      </Field>
      <Field label="개수">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">단체 주문이면 늘려 주세요</span>
          <Stepper
            value={draft.quantity}
            min={1}
            max={QUOTE_LIMITS.MAX_QUANTITY}
            onChange={(quantity) => update({ quantity })}
          />
        </div>
      </Field>
      <Field label="맛·크림" optional="선택 · 안 고르면 가게가 알려 줘요">
        <div className="flex flex-wrap gap-[8px]">
          {QUOTE_CREAM_OPTIONS.map((c) => (
            <Pill
              key={c.value}
              selected={draft.creams.includes(c.value)}
              onClick={() =>
                update({
                  creams: draft.creams.includes(c.value)
                    ? draft.creams.filter((x) => x !== c.value)
                    : [...draft.creams, c.value],
                })
              }
            >
              {c.label}
            </Pill>
          ))}
          <Pill selected={writing} onClick={() => setWriting((v) => !v)}>
            + 직접 쓰기
          </Pill>
        </div>
        {writing && (
          <input
            value={draft.flavorNote}
            maxLength={QUOTE_LIMITS.FLAVOR_NOTE_MAX}
            onChange={(e) => update({ flavorNote: e.target.value })}
            placeholder="예: 초코 시트"
            className="mt-[10px] h-[42px] w-full rounded-[6px] border border-gray-100 px-[12px] text-sm outline-none focus:border-gray-900"
          />
        )}
      </Field>
      <Field
        label="예산"
        right={
          <span className="text-sm font-bold text-gray-900">
            {budgetText(draft.budgetMin, draft.budgetMax)}
          </span>
        }
        caption={
          draft.quantity > 1
            ? `1개 기준이에요 · ${draft.quantity}개면 ${budgetText(draft.budgetMin * draft.quantity, draft.budgetMax >= QUOTE_LIMITS.BUDGET_MAX ? QUOTE_LIMITS.BUDGET_MAX * 100 : draft.budgetMax * draft.quantity)}`
            : undefined
        }
      >
        <DualThumbRangeSlider
          min={QUOTE_LIMITS.BUDGET_MIN}
          max={QUOTE_LIMITS.BUDGET_MAX}
          valueMin={draft.budgetMin}
          valueMax={draft.budgetMax}
          onMinChange={(v) => update({ budgetMin: Math.min(step(v), draft.budgetMax) })}
          onMaxChange={(v) => update({ budgetMax: Math.max(step(v), draft.budgetMin) })}
          formatLabel={(v) => (v >= QUOTE_LIMITS.BUDGET_MAX ? "10만원+" : won(step(v)))}
          ariaLabel="예산"
        />
      </Field>
    </div>
  );
}

/* ───────────── 6단계: 확인하고 보내기 ───────────── */
export function StepConfirm({ now, onEdit }: { now: Date; onEdit: (step: number) => void }) {
  const { draft, update } = useQuoteDraftStore();
  const [detailOpen, setDetailOpen] = useState(false);
  const size = QUOTE_SIZE_OPTIONS.find((s) => s.value === draft.size);
  const creams = [
    ...draft.creams.map((c) => QUOTE_CREAM_OPTIONS.find((o) => o.value === c)?.label),
    draft.flavorNote.trim() || null,
  ].filter(Boolean);
  const budget =
    draft.budgetMax >= QUOTE_LIMITS.BUDGET_MAX
      ? `${won(draft.budgetMin)} 이상`
      : draft.budgetMin === draft.budgetMax
        ? won(draft.budgetMin)
        : `${draft.budgetMin / 10_000}만~${won(draft.budgetMax)}`;
  const area = draft.onlyDesignatedStores
    ? `${draft.stores[0]?.name ?? ""}에만`
    : `${draft.area?.name ?? ""} ${draft.distance === "SIDO" ? `· ${draft.area?.sido} 전체` : `${draft.distance}km 안`}${
        draft.stores.length
          ? ` · ${draft.stores[0].name}${draft.stores.length > 1 ? ` 외 ${draft.stores.length - 1}곳` : ""} + 근처 가게`
          : ""
      }`;
  const w = draft.pickupDate ? pickupWindow(draft.pickupDate, draft.hourFrom, now) : null;
  const time =
    draft.hourFrom !== null && draft.hourTo !== null
      ? formatHourRange(draft.hourFrom, draft.hourTo)
      : w?.shifted
        ? `${formatHour(kstHour(w.start))} 이후`
        : "아무 때나";

  const rows: { label: string; value: string; step: number; clamp?: boolean }[] = [
    {
      label: "픽업",
      value: `${draft.pickupDate ? formatShortDate(draft.pickupDate) : ""} · ${time}`,
      step: 1,
    },
    { label: "받을 동네", value: area, step: draft.onlyDesignatedStores ? 1 : 2 },
    ...(draft.photos.length
      ? [{ label: "참고 사진", value: `${draft.photos.length}장`, step: 4 }]
      : []),
    ...(draft.description.trim()
      ? [{ label: "설명", value: draft.description.trim(), step: 4, clamp: true }]
      : []),
    ...(draft.requestNote.trim()
      ? [{ label: "요청 사항", value: draft.requestNote.trim(), step: 4, clamp: true }]
      : []),
    {
      label: "케이크",
      value: [`${size?.label ?? ""} ${draft.quantity}개`, creams.join("·")]
        .filter(Boolean)
        .join(" · "),
      step: 5,
    },
    { label: "예산", value: draft.quantity > 1 ? `1개 ${budget}` : budget, step: 5 },
  ];

  return (
    <div>
      <StepTitle title="이대로 보낼까요?" description="보내면 Picake가 가게에 물어봐 드려요" />
      <div className="mb-[24px] rounded-xl border border-gray-100 px-[16px] py-[4px]">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-start gap-[12px] border-b border-gray-50 py-[12px] text-sm last:border-b-0"
          >
            <span className="w-[64px] shrink-0 text-gray-500">{r.label}</span>
            <span className={cn("min-w-0 flex-1 text-gray-900", r.clamp && "line-clamp-2")}>
              {r.value}
            </span>
            <button
              type="button"
              className="shrink-0 text-xs text-gray-500 underline"
              onClick={() => onEdit(r.step)}
            >
              고치기
            </button>
          </div>
        ))}
      </div>
      <div className="mb-[24px]">
        <Checkbox
          checked={draft.agreed}
          onChange={(agreed) => update({ agreed })}
          label={
            <span className="text-sm text-gray-900">
              요청 내용과 사진이 가게에 전달돼요. 입점 전 가게에도 전달될 수 있어요. 이름·연락처는
              보내지 않아요.{" "}
              <button
                type="button"
                className="text-gray-500 underline"
                onClick={(e) => {
                  e.preventDefault();
                  setDetailOpen((v) => !v);
                }}
              >
                자세히
              </button>
            </span>
          }
        />
        {detailOpen && (
          <ul className="mt-[8px] flex flex-col gap-[4px] rounded-lg bg-gray-50 px-[12px] py-[10px] text-xs leading-[18px] text-gray-700">
            <li>받는 곳: 고른 지역의 케이크 가게(Picake 입점 전 가게 포함)와 직접 넣은 가게</li>
            <li>목적: 케이크 견적을 받기 위해</li>
            <li>
              항목: 픽업 날짜·시간, 받을 동네, 설명·요청 사항, 크기·개수·맛, 예산, 참고 사진
              (이름·연락처는 보내지 않아요)
            </li>
            <li>기간: 견적 요청이 마감될 때까지</li>
            <li>동의하지 않을 수 있어요. 동의하지 않으면 견적 요청만 보낼 수 없어요.</li>
          </ul>
        )}
      </div>
      <DeadlineNotice draft={draft} now={now} />
    </div>
  );
}
