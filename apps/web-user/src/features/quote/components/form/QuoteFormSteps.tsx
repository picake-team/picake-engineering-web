"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/apps/web-user/common/components/icons";
import { Calendar } from "@/apps/web-user/common/components/calendars/Calendar";
import { TextArea } from "@/apps/web-user/common/components/textareas/TextArea";
import { Toggle } from "@/apps/web-user/common/components/inputs/Toggle";
import { QuoteWriteHelpSheet } from "@/apps/web-user/features/quote/components/form/QuoteWriteHelpSheet";
import { DualThumbRangeSlider } from "@/apps/web-user/common/components/sliders/DualThumbRangeSlider";
import { cn } from "@/apps/web-user/common/lib/utils";
import {
  QUOTE_CREAM_OPTIONS,
  QUOTE_LIMITS,
  QUOTE_NO_REPLAY,
  QUOTE_SIZE_OPTIONS,
} from "@/apps/web-user/features/quote/constants/quote.constant";
import {
  useQuoteDraftStore,
  type PhotoReadState,
  type QuoteDraft,
  type QuoteDraftPhoto,
} from "@/apps/web-user/features/quote/store/quote-draft.store";
import {
  DesignPickSheet,
  QuotePhotoTile,
} from "@/apps/web-user/features/quote/components/form/QuotePhotoParts";
import { designApi } from "@/apps/web-user/features/design/apis/design.api";
import {
  designPhotos,
  isPhotoReadOff,
  setPhotoReadOff,
} from "@/apps/web-user/features/design/utils/design.util";
import {
  isAllParts,
  isAutoFilled,
  partsChipLabel,
} from "@/apps/web-user/features/design/utils/design-fill.util";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
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
  formatPickupDate,
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
          // 손님이 직접 고르게 한다(예약 달력처럼 오늘을 자동으로 고르지 않음)
          autoSelectToday={false}
          className="border-0 p-0 shadow-none"
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
    // 거리 막대를 끄는 동안 칸마다 검색하지 않게 잠깐(0.3초) 멈췄을 때만 센다
    let cancelled = false;
    const { latitude, longitude } = draft.area;
    const km = draft.distance;
    const t = setTimeout(() => {
      quoteLocalApi
        .countPlaces(latitude, longitude, km)
        .then((n) => !cancelled && setCount(n))
        .catch(() => !cancelled && setCount(null));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
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
          className="flex h-[42px] w-full items-center gap-[6px] rounded-[8px] border border-gray-100 px-[12px] text-left text-sm text-gray-400 disabled:opacity-50"
        >
          <Icon name="search" width={16} height={16} className="shrink-0 text-gray-400" />
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
const PHOTO_READ_MESSAGE: Partial<Record<PhotoReadState, string>> = {
  failed: "사진을 읽지 못했어요. 직접 적어 주세요",
  limit: "오늘은 사진 읽기를 다 썼어요. 직접 적어 주세요",
};

/** 손님 사진을 AI가 읽어 칸을 채운다(기획 I-112 ⑥). 읽는 동안 사진을 빼면 결과를 버린다 */
/** 지금 서버에서 읽고 있는 사진(새로 고침 뒤 "읽는 중"이 남아 있으면 다시 읽는다) */
const inFlightReads = new Set<string>();

function readOwnPhoto(id: string, dataUrl: string) {
  if (inFlightReads.has(id)) return;
  inFlightReads.add(id);
  const store = useQuoteDraftStore.getState;
  const finish = (patch: Pick<QuoteDraftPhoto, "read" | "readState">) => {
    inFlightReads.delete(id);
    const photo = store().draft.photos.find((p) => p.id === id);
    // 그사이 사진을 뺐거나 사진 읽기를 껐으면 결과를 버린다
    if (!photo || photo.readState !== "reading") return;
    store().updatePhotoRead(id, patch);
  };
  designApi
    .readPhoto(dataUrl)
    .then((res) => {
      if ("unreadable" in res) {
        finish({ read: null, readState: "failed" });
        trackEvent("fail_quote_photo_read", { reason: "unreadable" });
        return;
      }
      finish({
        read: {
          parts: res.parts,
          description: res.description,
          size: res.size,
          creams: res.creams,
          requestNote: res.requestNote,
        },
        readState: "done",
      });
      trackEvent("success_quote_photo_read");
    })
    .catch((e) => {
      const r = (e as { response?: { status?: number; data?: { message?: unknown } } })?.response;
      // 하루 횟수(429 "오늘은…")만 "다 썼어요", 분당 제한·오류는 못 읽음
      const limit = r?.status === 429 && JSON.stringify(r?.data?.message ?? "").includes("오늘은");
      finish({ read: null, readState: limit ? "limit" : "failed" });
      trackEvent("fail_quote_photo_read", { reason: limit ? "limit" : "error" });
    });
}

export function StepCake() {
  const { draft, update, setPhotos, updatePhotoRead } = useQuoteDraftStore();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [adding, setAdding] = useState(false);
  const [readOff, setReadOff] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { showAlert } = useAlertStore();
  const hasPhoto = draft.photos.length > 0;
  const multi = draft.photos.length >= 2;
  const ownPhotos = draft.photos.filter((p) => !p.designId);
  const room = QUOTE_LIMITS.MAX_PHOTOS - draft.photos.length;
  const reading = ownPhotos.some((p) => p.readState === "reading");
  const readProblem = ownPhotos.map((p) => p.readState).find((st) => st && PHOTO_READ_MESSAGE[st]);
  const descFilled = isAutoFilled("description", draft, draft.autoFill);
  const noteFilled = isAutoFilled("requestNote", draft, draft.autoFill);
  const filledFrom = draft.photos.filter((p) => p.designId || p.read).length;

  useEffect(() => {
    const off = isPhotoReadOff();
    setReadOff(off);
    // 읽는 중에 화면을 닫았다 열었으면 다시 읽는다(끈 상태면 끔으로)
    for (const p of useQuoteDraftStore.getState().draft.photos) {
      if (p.designId || p.readState !== "reading" || inFlightReads.has(p.id)) continue;
      if (off) updatePhotoRead(p.id, { read: p.read, readState: "off" });
      else readOwnPhoto(p.id, p.dataUrl);
    }
  }, [updatePhotoRead]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length || room <= 0) return;
    setAdding(true);
    try {
      const results = await Promise.allSettled(picked.slice(0, room).map(shrinkPhoto));
      // 줄이는 동안 디자인 사진을 넣었을 수 있어 남은 칸을 다시 센다
      const left = QUOTE_LIMITS.MAX_PHOTOS - useQuoteDraftStore.getState().draft.photos.length;
      const shrunk = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
      if (shrunk.length < results.length) {
        showAlert({
          type: "warning",
          title: "사진을 올리지 못했어요",
          message: "열 수 없는 사진이 있어요. 다른 사진(JPG·PNG)으로 올려 주세요.",
        });
      }
      const off = isPhotoReadOff();
      const added: QuoteDraftPhoto[] = shrunk.slice(0, Math.max(0, left)).map((dataUrl) => ({
        id: `${Date.now()}-${Math.random()}`,
        dataUrl,
        parts: ["ALL"],
        readState: off ? "off" : "reading",
      }));
      setPhotos([...useQuoteDraftStore.getState().draft.photos, ...added]);
      if (!off) added.forEach((p) => readOwnPhoto(p.id, p.dataUrl));
    } finally {
      setAdding(false);
    }
  };

  const toggleReadOff = () => {
    const off = !readOff;
    setReadOff(off);
    setPhotoReadOff(off);
    trackEvent("engage_quote_photo_read_toggle", { off });
    const photos = useQuoteDraftStore.getState().draft.photos.filter((p) => !p.designId);
    if (off) {
      // 끄면 읽고 있던 사진의 결과도 쓰지 않는다
      photos
        .filter((p) => p.readState === "reading")
        .forEach((p) => updatePhotoRead(p.id, { read: p.read, readState: "off" }));
    } else {
      // 다시 켜면 아직 읽지 않은 사진을 읽는다
      photos
        .filter((p) => p.readState === "off")
        .forEach((p) => {
          updatePhotoRead(p.id, { read: p.read, readState: "reading" });
          readOwnPhoto(p.id, p.dataUrl);
        });
    }
  };

  return (
    <div>
      <StepTitle title="어떤 케이크인가요?" description="사진이나 설명 중 하나만 있으면 돼요" />
      <Field
        label="참고 사진"
        optional={`${QUOTE_LIMITS.MAX_PHOTOS}장까지`}
        right={
          room > 0 ? (
            <button
              type="button"
              disabled={adding}
              onClick={() => setPickOpen(true)}
              className="-my-[11px] shrink-0 py-[11px] pl-[12px] text-2sm text-gray-500 disabled:opacity-50"
            >
              디자인 모음에서 고르기 ›
            </button>
          ) : undefined
        }
      >
        <div className="flex w-full gap-[6px] overflow-auto">
          {room > 0 && (
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
          {draft.photos.map((p, i) => (
            <QuotePhotoTile
              key={p.id}
              photo={p}
              index={i}
              multi={multi}
              onRemove={() => setPhotos(draft.photos.filter((x) => x.id !== p.id))}
            />
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
        {/* 사진 읽기 켜고 끄기(운영자 11-14 고름): 못 읽었으면 아래 줄에 알린다 */}
        {ownPhotos.length > 0 && (
          <div className="mt-[8px] flex items-center gap-[12px] rounded-lg border border-gray-100 px-[12px] py-[10px]">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">
                <span className="text-primary">✦</span> 사진 보고 설명 채우기
              </p>
              <p
                className={cn(
                  "mt-[2px] text-2sm",
                  !readOff && readProblem ? "text-gray-700" : "text-gray-500",
                )}
              >
                {readOff
                  ? "꺼져 있어요. 켜면 직접 올린 사진을 읽어요"
                  : readProblem
                    ? PHOTO_READ_MESSAGE[readProblem]
                    : "직접 올린 사진은 AI가 읽어요"}
              </p>
            </div>
            <Toggle checked={!readOff} onChange={toggleReadOff} ariaLabel="사진 보고 설명 채우기" />
          </div>
        )}
      </Field>
      <Field
        label="설명"
        caption={hasPhoto ? undefined : "원하는 케이크와 케이크에 쓸 글자를 적어 주세요"}
        right={
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="-my-[11px] shrink-0 py-[11px] pl-[12px] text-2sm text-gray-500"
          >
            무엇을 쓸까요? ›
          </button>
        }
      >
        <div className="relative">
          <TextArea
            value={draft.description}
            onChange={(description) => update({ description })}
            // 사진 보고 채운 여러 줄이 한눈에 보이게(운영자 11-14)
            className="h-[200px] leading-[22px]"
            maxLength={QUOTE_LIMITS.DESCRIPTION_MAX}
            showCount
            placeholder={
              reading && !draft.description
                ? ""
                : hasPhoto
                  ? '예: 글씨는 "지수야 생일 축하해"로, 강아지 대신 곰돌이'
                  : '예: 하늘색 바탕에 곰돌이, 글씨는 "지수야 생일 축하해"'
            }
          />
          {reading && !draft.description && (
            <span className="pointer-events-none absolute left-[13px] top-[11px] text-sm text-primary">
              ✦ 사진 읽는 중…
            </span>
          )}
        </div>
        {reading && (
          <p className="mt-[6px] text-2sm text-gray-500">읽는 동안 다른 칸을 써도 돼요</p>
        )}
        {descFilled && (
          <>
            <p className="mt-[6px] text-2sm text-primary">
              ✦ {filledFrom > 1 ? `사진 ${filledFrom}장을 보고 채웠어요` : "사진 보고 채웠어요"}
            </p>
            <p className="mt-[4px] text-xs text-gray-500">
              케이크에 쓸 글자가 다르면 꼭 고쳐 주세요
            </p>
          </>
        )}
      </Field>
      <Field label="요청 사항" optional="선택">
        <TextArea
          value={draft.requestNote}
          onChange={(requestNote) => update({ requestNote })}
          maxLength={QUOTE_LIMITS.REQUEST_NOTE_MAX}
          showCount
          placeholder="알레르기, 초·토퍼 등"
        />
        {noteFilled && <p className="mt-[6px] text-2sm text-primary">✦ 사진 보고 채웠어요</p>}
      </Field>
      <QuoteWriteHelpSheet isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      <DesignPickSheet
        isOpen={pickOpen}
        room={room}
        exclude={draft.photos.flatMap((p) => (p.designId ? [p.designId] : []))}
        onClose={() => setPickOpen(false)}
        onPick={(picks) => {
          trackEvent("engage_quote_design_pick", { count: picks.length });
          setPhotos([
            ...useQuoteDraftStore.getState().draft.photos,
            ...picks.flatMap((x) => designPhotos([x.designId], x.parts)),
          ]);
        }}
      />
    </div>
  );
}

/* ───────────── 5단계: 크기와 예산 ───────────── */
export function StepSizeBudget() {
  const { draft, update } = useQuoteDraftStore();
  const [writing, setWriting] = useState(draft.flavorNote.length > 0);
  const size = QUOTE_SIZE_OPTIONS.find((s) => s.value === draft.size);
  const sizeFilled = isAutoFilled("size", draft, draft.autoFill);
  const creamsFilled = isAutoFilled("creams", draft, draft.autoFill);
  // 사진 보고 채웠는데 크림은 알 수 없었다
  const creamsUnknown =
    !creamsFilled &&
    draft.creams.length === 0 &&
    (draft.autoFill?.description !== undefined || draft.autoFill?.size !== undefined);
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
              className="relative h-[44px] flex-col gap-0 rounded-[12px] px-[8px] leading-tight"
            >
              <span>{s.label}</span>
              <span className="text-2xs font-normal text-gray-500">{s.people}</span>
              {sizeFilled && draft.size === s.value && (
                <span className="absolute right-[6px] top-[3px] text-xs text-primary">✦</span>
              )}
            </Pill>
          ))}
        </div>
        {sizeFilled && (
          <p className="mt-[6px] text-2sm text-primary">
            ✦{" "}
            {draft.autoFill?.conflicts?.includes("size")
              ? "사진마다 크기가 달라 보여요. 맞는지 확인해 주세요"
              : "사진 보고 골랐어요"}{" "}
            <button
              type="button"
              className="-my-[11px] ml-[4px] py-[11px] text-gray-500 underline"
              onClick={() => update({ size: null })}
            >
              되돌리기
            </button>
          </p>
        )}
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
        {creamsFilled && <p className="mt-[6px] text-2sm text-primary">✦ 사진 보고 골랐어요</p>}
        {creamsUnknown && (
          <p className="mt-[6px] text-2sm text-gray-500">
            사진으로는 크림을 알 수 없어 비워 뒀어요
          </p>
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
  const { draft } = useQuoteDraftStore();
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

  // clamp = 손님이 직접 쓴 글(설명·요청 사항): 두 줄로 줄이고 화면 녹화에서 가린다
  const rows: { label: string; value: string; step: number; clamp?: boolean }[] = [
    {
      label: "픽업",
      value: `${draft.pickupDate ? formatPickupDate(draft.pickupDate) : ""} ${time}`.trim(),
      step: 1,
    },
    { label: "받을 동네", value: area, step: draft.onlyDesignatedStores ? 1 : 2 },
    ...(draft.photos.length
      ? [
          {
            label: "참고 사진",
            value: draft.photos.some((p) => !isAllParts(p.parts ?? []))
              ? `${draft.photos.length}장 · ${draft.photos
                  .map((p, i) => `${i + 1}번 ${partsChipLabel(p.parts ?? [])}`)
                  .join(", ")}`
              : `${draft.photos.length}장`,
            step: 4,
          },
        ]
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
      {(["description", "size", "creams", "requestNote"] as const).some((f) =>
        isAutoFilled(f, draft, draft.autoFill),
      ) && (
        <p className="mb-[10px] text-2sm text-primary">
          ✦ 사진 보고 채운 내용이 있어요. 맞는지 확인해 주세요
        </p>
      )}
      <div className="mb-[24px] rounded-xl border border-gray-100 px-[16px] py-[4px]">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-start gap-[12px] border-b border-gray-50 py-[12px] text-sm last:border-b-0"
          >
            <span className="w-[64px] shrink-0 text-gray-500">{r.label}</span>
            <span
              className={cn(
                "min-w-0 flex-1 text-gray-900",
                r.clamp && ["line-clamp-2", QUOTE_NO_REPLAY],
              )}
            >
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
      <DeadlineNotice draft={draft} now={now} />
      {/* 제3자 제공 안내(받는 곳·목적·항목·기간). 보내기를 누르면 동의(예약 창의 "판매자에게 전달돼요"와 같은 방식) */}
      <p className="mt-[12px] text-xs leading-[18px] text-gray-500">
        보내면 요청을 받는 가게에 이름·휴대폰 번호가 전달돼요(견적·주문 상담용). 고르지 않은
        가게에서는 요청이 끝나면 보이지 않아요.
      </p>
    </div>
  );
}
