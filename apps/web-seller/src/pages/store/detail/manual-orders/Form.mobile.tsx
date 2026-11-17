/**
 * 주문 적기·고치기 (기획 I-42, 시안 "주문 적기"·"대화를 붙여 넣은 뒤"·"날짜 고르기 창").
 * 사장님이 카톡·인스타·전화 등 Picake 밖에서 받은 주문을 적으면 Picake 주문과 같은 달력·목록에 보인다.
 *
 * - 맨 위 [대화 붙여 넣기]: 복사해 둔 대화를 바로 읽는다(못 읽으면 붙여 넣는 창). [캡처로 채우기]: 대화 캡처를 읽는다.
 *   AI가 읽은 칸만 채우고 아래 스낵바 "되돌리기"로 채우기 전으로 돌린다. 붙여 넣은 대화는 이 화면에서만 보이고 저장하지 않는다
 * - 꼭 적을 칸은 픽업 날짜·케이크 둘. 날짜는 들어온 곳(홈·캘린더에서 고른 날)이 미리 골라지고, 받은 곳은 지난번 고른 곳
 * - 날짜 창에는 날마다 이미 받은 수(Picake + 직접)·휴무·대목이 보인다
 * - 금액·입금은 한 줄. 입금 칩은 다시 누르면 고르지 않음
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppScreen, BackHeader, BottomActionBar } from "@/apps/web-seller/common/ui/Screen";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { Chip, ChipGroup } from "@/apps/web-seller/common/ui/Choice";
import { Field, PickerButton, TextArea, TextInput } from "@/apps/web-seller/common/ui/Field";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { DateSheet } from "@/apps/web-seller/common/ui/DateSheet";
import { TimeSlotSheet } from "@/apps/web-seller/common/ui/TimeSlotSheet";
import { LoadErrorState } from "@/apps/web-seller/common/ui/Surface";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { NO_REPLAY } from "@/apps/web-seller/common/constants/replay.constant";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import { useSnackbarStore } from "@/apps/web-seller/common/store/snackbar.store";
import { canGoBackInApp } from "@/apps/web-seller/common/hooks/useLeaveAfterSave";
import { useKstTodayKey } from "@/apps/web-seller/common/hooks/useKstTodayKey";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { cakeDayOf } from "@/apps/web-seller/common/utils/cake-days.util";
import {
  formatKeyMonthDayWeek,
  kstDateKey,
  monthEndKey,
  monthStartKey,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { uploadApi } from "@/apps/web-seller/features/upload/apis/upload.api";
import { dataUrlToFile, shrinkPhoto } from "@/apps/web-seller/features/chat/hooks/useChat";
import { useCalendarMonthOrders } from "@/apps/web-seller/features/order/hooks/queries/useOrderQuery";
import { CANCELED_ORDER_STATUSES } from "@/apps/web-seller/features/order/utils/order-mobile.util";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import {
  calendarOrDefault,
  dayMark,
} from "@/apps/web-seller/features/store/utils/business-day.util";
import { manualOrderApi } from "@/apps/web-seller/features/manual-order/apis/manual-order.api";
import {
  LAST_SOURCE_STORAGE_KEY,
  MANUAL_ORDER_LIMITS,
  MANUAL_ORDER_SOURCES,
} from "@/apps/web-seller/features/manual-order/constants/manual-order.constant";
import {
  useInvalidateManualOrders,
  useManualOrder,
  useManualOrdersInRange,
} from "@/apps/web-seller/features/manual-order/hooks/useManualOrderQuery";
import type {
  ManualOrderDto,
  ManualOrderInput,
  ManualOrderReadResult,
  ManualOrderSource,
} from "@/apps/web-seller/features/manual-order/types/manual-order.dto";

interface FormState {
  pickupDate: string;
  /** "" = 시간 미정 */
  pickupTime: string;
  cakeName: string;
  lettering: string;
  /** 쉼표 붙은 글 */
  price: string;
  paid: boolean | null;
  customerName: string;
  source: ManualOrderSource;
  memo: string;
  photoUrls: string[];
}

type Pasted = { kind: "text"; text: string } | { kind: "image"; image: string };

const digits = (v: string) => v.replace(/[^0-9]/g, "");
const won = (n: number | null) => (n === null ? "" : n.toLocaleString("ko-KR"));

function readLastSource(): ManualOrderSource {
  try {
    const v = window.localStorage.getItem(LAST_SOURCE_STORAGE_KEY);
    if (MANUAL_ORDER_SOURCES.some((s) => s.value === v)) return v as ManualOrderSource;
  } catch {
    // 저장소를 못 쓰는 브라우저(사생활 보호 등)는 카톡
  }
  return "KAKAO";
}

function saveLastSource(source: ManualOrderSource) {
  try {
    window.localStorage.setItem(LAST_SOURCE_STORAGE_KEY, source);
  } catch {
    // 못 적어도 다음에 카톡이 골라질 뿐
  }
}

function fromDto(m: ManualOrderDto): FormState {
  return {
    pickupDate: m.pickupDate,
    pickupTime: m.pickupTime ?? "",
    cakeName: m.cakeName,
    lettering: m.lettering ?? "",
    price: won(m.price),
    paid: m.paid,
    customerName: m.customerName ?? "",
    source: m.source,
    memo: m.memo ?? "",
    photoUrls: m.photoUrls,
  };
}

function toInput(f: FormState): ManualOrderInput {
  const trimOrNull = (v: string) => (v.trim() ? v.trim() : null);
  return {
    pickupDate: f.pickupDate,
    pickupTime: f.pickupTime || null,
    cakeName: f.cakeName.trim(),
    lettering: trimOrNull(f.lettering),
    price: digits(f.price) ? Number(digits(f.price)) : null,
    paid: f.paid,
    customerName: trimOrNull(f.customerName),
    source: f.source,
    memo: trimOrNull(f.memo),
    photoUrls: f.photoUrls,
  };
}

/** 읽은 값을 채운다(읽지 못한 칸은 그대로). 채운 칸 수와 함께 */
function applyRead(f: FormState, r: ManualOrderReadResult): { next: FormState; filled: number } {
  const next = { ...f };
  let filled = 0;
  const set = <K extends keyof FormState>(key: K, value: FormState[K] | null | undefined) => {
    if (value === null || value === undefined || value === "") return;
    next[key] = value;
    filled += 1;
  };
  set("pickupDate", r.pickupDate);
  set("pickupTime", r.pickupTime);
  set("cakeName", r.cakeName);
  set("lettering", r.lettering);
  set("price", r.price === null ? null : won(r.price));
  set("paid", r.paid);
  set("customerName", r.customerName);
  set("source", r.source);
  set("memo", r.memo);
  return { next, filled };
}

function OptionalLabel({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children} <span className="font-normal text-ink-400">선택</span>
    </>
  );
}

function ManualOrderForm({
  storeId,
  initial,
  editingId,
}: {
  storeId: string;
  initial: FormState;
  editingId?: string;
}) {
  const todayKey = useKstTodayKey();
  const { addAlert } = useAlertStore();
  const showSnackbar = useSnackbarStore((st) => st.showSnackbar);
  const navigate = useNavigate();
  const invalidate = useInvalidateManualOrders();
  const cakeRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(initial);
  const [pasted, setPasted] = useState<Pasted | null>(null);
  const [pastedOpen, setPastedOpen] = useState(false);
  const [pasteSheetOpen, setPasteSheetOpen] = useState(false);
  const [pasteDraft, setPasteDraft] = useState("");
  const [reading, setReading] = useState<"text" | "image" | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  // "대화에서 n칸을 채웠어요 · 되돌리기"는 이 화면에서만 뜻이 있다. 화면을 떠나면(등록·뒤로) 닫는다
  const undoRef = useRef<(() => void) | null>(null);
  useEffect(
    () => () => {
      const { current, hideSnackbar } = useSnackbarStore.getState();
      if (current && undoRef.current && current.onAction === undoRef.current)
        hideSnackbar(current.id);
    },
    [],
  );

  // 날짜 창: 보는 달의 받은 수(Picake + 직접)·휴무·대목
  const [sheetMonth, setSheetMonth] = useState(() => monthStartKey(initial.pickupDate));
  const sheetMonthEnd = monthEndKey(sheetMonth);
  const monthOrders = useCalendarMonthOrders(storeId, sheetMonth, sheetMonthEnd);
  const monthManual = useManualOrdersInRange(storeId, sheetMonth, sheetMonthEnd);
  const { data: store } = useStoreDetail(storeId);
  const cal = calendarOrDefault(store?.businessCalendar);
  const countByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of monthOrders.data?.data ?? []) {
      if (CANCELED_ORDER_STATUSES.includes(o.orderStatus)) continue;
      const key = kstDateKey(o.pickupDate);
      map[key] = (map[key] ?? 0) + 1;
    }
    for (const m of monthManual.data ?? []) {
      // 고치는 중인 주문은 세지 않는다(그날 "이미 받은 수")
      if (m.id === editingId) continue;
      map[m.pickupDate] = (map[m.pickupDate] ?? 0) + 1;
    }
    return map;
  }, [monthOrders.data, monthManual.data, editingId]);
  const onMonthChange = useCallback((month: string) => setSheetMonth(month), []);

  const runRead = async (input: Pasted) => {
    setReading(input.kind);
    try {
      const result = await manualOrderApi.read(storeId, {
        ...(input.kind === "text" ? { text: input.text } : { image: input.image }),
        today: todayKey,
      });
      if (!result.found) {
        addAlert({ severity: "warning", message: "주문 내용을 찾지 못했어요. 직접 적어 주세요" });
        return;
      }
      const before = form;
      const { next, filled } = applyRead(form, result);
      setForm(next);
      setPasted(input);
      setPastedOpen(false);
      const undo = () => {
        setForm(before);
        setPasted(null);
      };
      undoRef.current = undo;
      showSnackbar({
        message: `대화에서 ${filled}칸을 채웠어요`,
        actionLabel: "되돌리기",
        onAction: undo,
      });
    } catch (e) {
      addAlert({ severity: "error", message: getApiMessage.error(e) });
    } finally {
      setReading(null);
    }
  };

  const onPasteClick = async () => {
    // 복사해 둔 대화를 바로 읽는다. 휴대폰이 막으면 붙여 넣는 창으로
    let text = "";
    try {
      text = (await navigator.clipboard?.readText?.()) ?? "";
    } catch {
      text = "";
    }
    if (text.trim()) {
      void runRead({ kind: "text", text });
      return;
    }
    setPasteDraft("");
    setPasteSheetOpen(true);
  };

  const onCapture = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      // 대화 글자가 작아 사진보다 크게(긴 쪽 2000px)
      const image = await shrinkPhoto(file, 2000);
      void runRead({ kind: "image", image });
    } catch {
      addAlert({
        severity: "error",
        message: "캡처를 열지 못했어요. 다른 캡처로 다시 시도해 주세요",
      });
    }
  };

  const onPickPhotos = async (files: FileList | null) => {
    if (!files) return;
    setPhotoError(null);
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(
        0,
        MANUAL_ORDER_LIMITS.PHOTO_MAX - form.photoUrls.length,
      )) {
        const shrunk = await shrinkPhoto(f);
        const res = await uploadApi.uploadFile(dataUrlToFile(shrunk, `manual-${Date.now()}.jpg`));
        urls.push(res.fileUrl);
      }
      setForm((f) => ({
        ...f,
        photoUrls: [...f.photoUrls, ...urls].slice(0, MANUAL_ORDER_LIMITS.PHOTO_MAX),
      }));
    } catch {
      setPhotoError("사진을 올리지 못했어요. 다시 시도해 주세요.");
    } finally {
      setUploading(false);
    }
  };

  const cakeMissing = !form.cakeName.trim();
  const priceTooBig = Number(digits(form.price) || 0) > MANUAL_ORDER_LIMITS.PRICE_MAX;

  const onSubmit = async () => {
    if (cakeMissing || priceTooBig) return;
    setSaving(true);
    try {
      const input = toInput(form);
      const saved = editingId
        ? await manualOrderApi.update(storeId, editingId, input)
        : await manualOrderApi.create(storeId, input);
      saveLastSource(form.source);
      await invalidate();
      addAlert({
        severity: "success",
        message: editingId ? "주문을 저장했어요" : "주문을 적었어요",
      });
      // 들어온 곳(홈·캘린더·상세)으로 돌아간다. 뒤로를 눌러도 방금 저장한 입력 화면이 다시 열리지 않게(영업시간과 같게)
      if (canGoBackInApp()) navigate(-1);
      else
        navigate(
          editingId
            ? ROUTES.STORE_DETAIL_MANUAL_ORDER_DETAIL(storeId, saved.id)
            : `${ROUTES.STORE_DETAIL_CALENDAR(storeId)}?date=${saved.pickupDate}`,
          { replace: true },
        );
    } catch (e) {
      addAlert({ severity: "error", message: getApiMessage.error(e) });
    } finally {
      setSaving(false);
    }
  };

  const cakeTag = cakeDayOf(form.pickupDate);

  return (
    <AppScreen
      header={<BackHeader title={editingId ? "주문 고치기" : "주문 적기"} />}
      bodyClassName="gap-5 pt-2"
      footer={
        <BottomActionBar
          reason={
            cakeMissing
              ? "케이크를 적어 주세요"
              : priceTooBig
                ? "금액은 10,000,000원까지 적을 수 있어요"
                : undefined
          }
          onReasonClick={cakeMissing ? () => cakeRef.current?.focus() : undefined}
        >
          <Button
            block
            disabled={cakeMissing || priceTooBig || uploading || reading !== null}
            loading={saving}
            loadingLabel={editingId ? "저장하는 중…" : "등록하는 중…"}
            onClick={() => void onSubmit()}
          >
            {editingId ? "저장하기" : "등록하기"}
          </Button>
        </BottomActionBar>
      }
    >
      {pasted ? (
        <div className="-mt-1 flex flex-col">
          <button
            type="button"
            aria-expanded={pastedOpen}
            onClick={() => setPastedOpen((v) => !v)}
            className="flex min-h-13 items-center gap-2 border-b border-ink-100 text-left"
          >
            <span className="text-body font-semibold text-ink-900">
              {pasted.kind === "text" ? "붙여 넣은 대화" : "붙여 넣은 캡처"}
            </span>
            <span className="flex-1" />
            <span
              className={cx(
                "shrink-0 text-ink-400 transition-transform",
                pastedOpen && "rotate-180",
              )}
            >
              <Icon name="chevronDown" size={18} strokeWidth={2} />
            </span>
          </button>
          {pastedOpen ? (
            pasted.kind === "text" ? (
              <p
                className={`${NO_REPLAY} mt-3 max-h-60 overflow-y-auto whitespace-pre-wrap rounded-control bg-ink-50 px-4 py-3 text-sub leading-normal text-ink-700`}
              >
                {pasted.text}
              </p>
            ) : (
              <img
                src={pasted.image}
                alt="붙여 넣은 대화 캡처"
                className={`${NO_REPLAY} mt-3 max-h-80 w-full rounded-control object-contain bg-ink-50`}
              />
            )
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="md"
            disabled={reading !== null}
            onClick={() => void onPasteClick()}
          >
            <Icon name="copy" size={18} strokeWidth={1.8} />
            {reading === "text" ? "읽는 중…" : "대화 붙여 넣기"}
          </Button>
          <label
            className={cx(
              "press inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-control border bg-white font-app text-sub font-bold",
              reading !== null
                ? "pointer-events-none border-ink-100 text-ink-400"
                : "border-ink-200 text-ink-700",
            )}
          >
            <Icon name="camera" size={18} strokeWidth={1.8} />
            {reading === "image" ? "읽는 중…" : "캡처로 채우기"}
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={reading !== null}
              onChange={(e) => {
                void onCapture(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-2">
        <Field label="픽업 날짜" helper={cakeTag ? cakeTag.full : undefined}>
          {(p) => (
            <PickerButton
              id={p.id}
              value={formatKeyMonthDayWeek(form.pickupDate)}
              onClick={() => setDateOpen(true)}
            />
          )}
        </Field>
        <Field label={<OptionalLabel>시간</OptionalLabel>}>
          {(p) => (
            <PickerButton
              id={p.id}
              value={form.pickupTime}
              placeholder="미정"
              onClick={() => setTimeOpen(true)}
            />
          )}
        </Field>
      </div>

      <Field label="케이크" counter={undefined}>
        {(p) => (
          <TextInput
            ref={cakeRef}
            id={p.id}
            value={form.cakeName}
            maxLength={MANUAL_ORDER_LIMITS.CAKE_NAME_MAX}
            placeholder="예: 2호 초코 리스"
            onChange={(e) => patch({ cakeName: e.target.value })}
          />
        )}
      </Field>

      <Field label={<OptionalLabel>레터링</OptionalLabel>}>
        {(p) => (
          <TextInput
            id={p.id}
            className={NO_REPLAY}
            value={form.lettering}
            maxLength={MANUAL_ORDER_LIMITS.LETTERING_MAX}
            placeholder="예: 생일 축하해"
            onChange={(e) => patch({ lettering: e.target.value })}
          />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field
          label={<OptionalLabel>금액</OptionalLabel>}
          trailing={<span className="flex h-12 items-center text-body text-ink-900">원</span>}
        >
          {(p) => (
            <TextInput
              id={p.id}
              inputMode="numeric"
              value={form.price}
              placeholder="예: 45,000"
              invalid={priceTooBig}
              className="text-right"
              onChange={(e) => {
                const n = digits(e.target.value).slice(0, 9);
                patch({ price: n ? Number(n).toLocaleString("ko-KR") : "" });
              }}
            />
          )}
        </Field>
        <div className="flex flex-col gap-2">
          <span className="text-sub font-bold text-ink-700">
            <OptionalLabel>입금</OptionalLabel>
          </span>
          <div role="group" aria-label="입금" className="flex h-12 items-center gap-2">
            <Chip
              selected={form.paid === true}
              onClick={() => patch({ paid: form.paid === true ? null : true })}
            >
              받음
            </Chip>
            <Chip
              selected={form.paid === false}
              onClick={() => patch({ paid: form.paid === false ? null : false })}
            >
              아직
            </Chip>
          </div>
        </div>
      </div>

      <Field label={<OptionalLabel>손님</OptionalLabel>}>
        {(p) => (
          <TextInput
            id={p.id}
            className={NO_REPLAY}
            value={form.customerName}
            maxLength={MANUAL_ORDER_LIMITS.CUSTOMER_NAME_MAX}
            placeholder="예: 홍길동, 인스타 아이디"
            onChange={(e) => patch({ customerName: e.target.value })}
          />
        )}
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-sub font-bold text-ink-700">받은 곳</span>
        <ChipGroup
          label="받은 곳"
          value={form.source}
          onChange={(source) => patch({ source })}
          options={MANUAL_ORDER_SOURCES}
        />
      </div>

      <Field
        label={<OptionalLabel>메모</OptionalLabel>}
        counter={
          form.memo.length > 0 ? `${form.memo.length}/${MANUAL_ORDER_LIMITS.MEMO_MAX}` : undefined
        }
      >
        {(p) => (
          <TextArea
            id={p.id}
            className={NO_REPLAY}
            rows={3}
            maxLength={MANUAL_ORDER_LIMITS.MEMO_MAX}
            value={form.memo}
            placeholder="예: 초 2개, 보냉백"
            onChange={(e) => patch({ memo: e.target.value })}
          />
        )}
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-sub font-bold text-ink-700">
          <OptionalLabel>사진</OptionalLabel>
        </span>
        <div className="flex gap-2">
          {form.photoUrls.map((url) => (
            <div key={url} className="relative">
              <img src={url} alt="" className="size-[72px] rounded-control object-cover" />
              <button
                type="button"
                aria-label="사진 빼기"
                onClick={() => patch({ photoUrls: form.photoUrls.filter((x) => x !== url) })}
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-ink-900 text-white"
              >
                <Icon name="close" size={12} />
              </button>
            </div>
          ))}
          {form.photoUrls.length < MANUAL_ORDER_LIMITS.PHOTO_MAX ? (
            <label
              aria-label="사진 붙이기"
              className="flex size-[72px] cursor-pointer items-center justify-center rounded-control border border-ink-200 text-ink-400"
            >
              {uploading ? "…" : <Icon name="camera" size={20} />}
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  void onPickPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          ) : null}
        </div>
        {photoError ? (
          <p className="text-caption font-semibold text-brand-ink">{photoError}</p>
        ) : null}
      </div>

      <DateSheet
        open={dateOpen}
        onClose={() => setDateOpen(false)}
        title="픽업 날짜"
        value={form.pickupDate}
        onPick={(pickupDate) => patch({ pickupDate })}
        onMonthChange={onMonthChange}
        dayInfo={(key) => ({
          count: countByDay[key] ?? 0,
          closed: dayMark(key, cal) === "closed",
          tag: cakeDayOf(key)?.short ?? null,
        })}
      />
      <TimeSlotSheet
        open={timeOpen}
        onClose={() => setTimeOpen(false)}
        title="픽업 시간"
        value={form.pickupTime}
        emptyLabel="시간 미정"
        onPick={(pickupTime) => patch({ pickupTime })}
      />
      <BottomSheet
        open={pasteSheetOpen}
        onClose={() => setPasteSheetOpen(false)}
        showClose
        title="대화 붙여 넣기"
        footer={
          <Button
            block
            disabled={!pasteDraft.trim()}
            onClick={() => {
              setPasteSheetOpen(false);
              void runRead({ kind: "text", text: pasteDraft });
            }}
          >
            이 대화로 채우기
          </Button>
        }
      >
        <TextArea
          aria-label="붙여 넣을 대화"
          className={NO_REPLAY}
          rows={8}
          autoFocus
          value={pasteDraft}
          placeholder="여기에 길게 눌러 붙여 넣어 주세요"
          onChange={(e) => setPasteDraft(e.target.value)}
        />
      </BottomSheet>
    </AppScreen>
  );
}

/** 주문 적기(/manual-orders/new?date=YYYY-MM-DD) */
export const StoreDetailManualOrderCreateMobilePage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const [params] = useSearchParams();
  const todayKey = useKstTodayKey();
  const date = params.get("date");
  const [initial] = useState<FormState>(() => ({
    pickupDate: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayKey,
    pickupTime: "",
    cakeName: "",
    lettering: "",
    price: "",
    paid: null,
    customerName: "",
    source: readLastSource(),
    memo: "",
    photoUrls: [],
  }));
  return <ManualOrderForm storeId={storeId} initial={initial} />;
};

/** 주문 고치기(/manual-orders/:id/edit) */
export const StoreDetailManualOrderEditMobilePage: React.FC = () => {
  const { storeId = "", manualOrderId = "" } = useParams<{
    storeId: string;
    manualOrderId: string;
  }>();
  const navigate = useNavigate();
  const q = useManualOrder(storeId, manualOrderId);
  useEffect(() => {
    // 지운 주문을 고치러 들어오면(뒤로 가기 등) 캘린더로
    if (q.isError && (q.error as { response?: { status?: number } })?.response?.status === 404) {
      navigate(ROUTES.STORE_DETAIL_CALENDAR(storeId), { replace: true });
    }
  }, [q.isError, q.error, navigate, storeId]);
  if (q.data) {
    return (
      <ManualOrderForm
        key={q.data.id}
        storeId={storeId}
        initial={fromDto(q.data)}
        editingId={q.data.id}
      />
    );
  }
  return (
    <AppScreen header={<BackHeader title="주문 고치기" />}>
      {q.isError ? (
        <LoadErrorState big onRetry={() => void q.refetch()} />
      ) : (
        <span className="block h-40 animate-pulse rounded-card bg-ink-50" aria-busy="true" />
      )}
    </AppScreen>
  );
};
