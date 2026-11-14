"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/apps/web-user/common/components/icons";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { navigateBack } from "@/apps/web-user/common/utils/navigate-back.util";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { useAlertStore } from "@/apps/web-user/common/store/alert.store";
import { useLoginSheetStore } from "@/apps/web-user/common/store/login-sheet.store";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import type { QuoteEntryPoint, QuoteStepName } from "@/apps/web-user/common/types/analytics.type";
import { QUOTE_LIMITS } from "@/apps/web-user/features/quote/constants/quote.constant";
import {
  useQuoteDraftStore,
  type QuoteDraft,
  type QuoteDraftStore,
} from "@/apps/web-user/features/quote/store/quote-draft.store";
import {
  designImageSrc,
  designPhotos,
  getDesign,
} from "@/apps/web-user/features/design/utils/design.util";
import { isAutoFilled } from "@/apps/web-user/features/design/utils/design-fill.util";
import type { QuoteRequestEntry } from "@/apps/web-user/features/quote/types/quote.type";
import { FixedFooter } from "@/apps/web-user/features/quote/components/form/QuoteFormParts";
import {
  StepCake,
  StepConfirm,
  StepSizeBudget,
  StepStores,
  StepWhen,
  StepWhere,
} from "@/apps/web-user/features/quote/components/form/QuoteFormSteps";
import { useCreateQuoteRequest } from "@/apps/web-user/features/quote/hooks/useQuoteRequests";
import { quoteLocalApi } from "@/apps/web-user/features/quote/apis/quote.api";
import {
  formatPickupDate,
  pickupWindow,
} from "@/apps/web-user/features/quote/utils/quote-time.util";

/** 쓰던 요청서 한 줄: "11월 15일(일) 픽업 · 성수동2가 요청서를 쓰고 있었어요" */
function draftSummary(draft: QuoteDraft): string {
  const parts = [
    draft.pickupDate ? `${formatPickupDate(draft.pickupDate)} 픽업` : null,
    draft.area?.name ?? null,
  ].filter(Boolean);
  return parts.length
    ? `${parts.join(" · ")} 요청서를 쓰고 있었어요`
    : "쓰던 내용이 이 휴대폰에 남아 있어요";
}

const ENTRIES: QuoteRequestEntry[] = ["HOME", "SEARCH", "MAP", "STORE", "MYPAGE", "DESIGN"];

const STEP_NAMES: Record<number, QuoteStepName> = {
  1: "when",
  2: "where",
  3: "stores",
  4: "cake",
  5: "size_budget",
  6: "confirm",
};

const entryPoint = (entry: QuoteRequestEntry | null): QuoteEntryPoint =>
  entry ? (entry.toLowerCase() as QuoteEntryPoint) : "direct";

/** 입구에서 넘겨준 값(?entry=STORE&only=1&storeId=… 또는 kakaoPlaceId=…&name=…, ?q=검색어) */
function readInit(params: URLSearchParams): Partial<QuoteDraft> | null {
  const entry = params.get("entry") as QuoteRequestEntry | null;
  if (!entry || !ENTRIES.includes(entry)) return null;
  const init: Partial<QuoteDraft> = { entry };
  const storeId = params.get("storeId");
  const placeId = params.get("kakaoPlaceId");
  const name = params.get("name");
  const num = (k: string) => (params.get(k) ? Number(params.get(k)) : undefined);
  let store: QuoteDraftStore | null = null;
  if (storeId && name) {
    store = {
      key: `store:${storeId}`,
      storeId,
      name,
      isPicakeStore: true,
      address: params.get("address") ?? undefined,
      latitude: num("lat"),
      longitude: num("lng"),
    };
  } else if (placeId && name) {
    store = {
      key: `place:${placeId}`,
      kakaoPlaceId: placeId,
      name,
      isPicakeStore: false,
      address: params.get("address") ?? undefined,
      latitude: num("lat"),
      longitude: num("lng"),
      phone: params.get("phone") ?? undefined,
      placeUrl: params.get("placeUrl") ?? undefined,
    };
  }
  if (store) init.stores = [store];
  if (store && params.get("only") === "1") init.onlyDesignatedStores = true;
  const q = params.get("q");
  if (q) init.description = q;
  // 디자인 모음에서 "이 디자인으로 견적 받기"(?entry=DESIGN&designId=…)
  const designIds = (params.get("designId") ?? "").split(",").filter(Boolean);
  // 디자인 상세 "무엇을 가져갈까요?"에서 고른 것(없으면 전체)
  const PARTS = ["SHAPE", "COLOR", "DECORATION", "LETTERING"] as const;
  const parts = (params.get("parts") ?? "")
    .split(",")
    .filter((x): x is (typeof PARTS)[number] => (PARTS as readonly string[]).includes(x));
  const photos = designPhotos(designIds, parts.length ? parts : ["ALL"]).slice(
    0,
    QUOTE_LIMITS.MAX_PHOTOS,
  );
  if (photos.length) init.photos = photos;
  return init;
}

function hasContent(d: QuoteDraft) {
  return Boolean(d.pickupDate || d.area || d.photos.length || d.description.trim() || d.size);
}

function QuoteNewContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { draft, step, setStep, start, update, reset, setPhotos } = useQuoteDraftStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginSheet = useLoginSheetStore((s) => s.openLoginSheet);
  const { showAlert } = useAlertStore();
  const create = useCreateQuoteRequest();
  const [hydrated, setHydrated] = useState(false);
  const [pendingInit, setPendingInit] = useState<Partial<QuoteDraft> | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // 쓰던 요청서를 기기에서 읽은 뒤 입구 값을 반영한다
  // 저장돼 있던 요청서가 있는지는 불러온 그 순간 기준으로 본다(화면이 그린 뒤 바뀐 값으로 판단하지 않게)
  const hadDraftRef = useRef(false);
  useEffect(() => {
    const done = () => {
      const s = useQuoteDraftStore.getState();
      hadDraftRef.current = s.started && hasContent(s.draft);
      setHydrated(true);
    };
    const unsub = useQuoteDraftStore.persist.onFinishHydration(done);
    if (useQuoteDraftStore.persist.hasHydrated()) done();
    return unsub;
  }, []);

  // 입구 값까지 반영한 뒤에 단계 이벤트를 보낸다(먼저 보내면 entry_point가 비거나 예전 값)
  const [initDone, setInitDone] = useState(false);
  useEffect(() => {
    if (!hydrated) return;
    setInitDone(true);
    const init = readInit(new URLSearchParams(params.toString()));
    if (!init) return;
    if (hadDraftRef.current) setPendingInit(init);
    else {
      start(init);
      fillAreaFromStore(init);
    }
    router.replace(PATHS.QUOTE.NEW);
    // 처음 한 번만
  }, [hydrated]);

  /** "다른 가게에도 물어보기"로 들어오면 받을 동네를 그 가게 위치로 채운다(손님이 바꿀 수 있음) */
  function fillAreaFromStore(init: Partial<QuoteDraft>) {
    const store = init.stores?.[0];
    if (init.onlyDesignatedStores || !store?.latitude || !store?.longitude) return;
    quoteLocalApi
      .areaFromCoords(store.latitude, store.longitude)
      .then((area) => {
        if (area && !useQuoteDraftStore.getState().draft.area) update({ area });
      })
      .catch(() => undefined);
  }

  const pendingDesign = getDesign(pendingInit?.photos?.[0]?.designId);
  const only = draft.onlyDesignatedStores;
  const order = useMemo(() => (only ? [1, 4, 5, 6] : [1, 2, 3, 4, 5, 6]), [only]);
  const position = Math.max(0, order.indexOf(step));
  const current = order[position] ?? 1;

  const canNext = (() => {
    if (current === 1)
      return !!draft.pickupDate && !!pickupWindow(draft.pickupDate, draft.hourFrom, now);
    if (current === 2) return !!draft.area;
    if (current === 4) return draft.photos.length > 0 || draft.description.trim().length > 0;
    if (current === 5) return !!draft.size;
    if (current === 6) return !create.isPending;
    return true;
  })();

  // 단계별 이탈을 보려고 단계가 보일 때마다 한 번(같은 단계를 다시 그려도 한 번)
  const lastStepRef = useRef<string | null>(null);
  // 보낸 뒤 요청서를 비우면 1단계로 돌아가 보이지만 손님이 본 단계가 아니다
  const sentRef = useRef(false);
  useEffect(() => {
    if (!initDone || pendingInit || sentRef.current) return;
    const key = `${current}/${order.length}`;
    if (lastStepRef.current === key) return;
    lastStepRef.current = key;
    trackEvent("view_quote_step", {
      step_name: STEP_NAMES[current],
      step_number: position + 1,
      total_steps: order.length,
      entry_point: entryPoint(draft.entry),
      only_store: draft.onlyDesignatedStores,
    });
  }, [initDone, pendingInit, current, position, order.length]);

  const goBack = () => {
    if (position === 0) navigateBack(router, { fallbackPath: PATHS.HOME });
    else setStep(order[position - 1]);
  };

  // 보내기를 빠르게 두 번 눌러도 요청이 두 개 생기지 않게
  const sendingRef = useRef(false);

  const send = () => {
    if (sendingRef.current) return;
    if (!isAuthenticated) {
      openLoginSheet("quote_request");
      return;
    }
    if (!draft.pickupDate || !draft.size) return;
    if (!pickupWindow(draft.pickupDate, draft.hourFrom, new Date())) {
      showAlert({
        type: "warning",
        title: "시간을 다시 골라 주세요",
        message: "지금부터 3시간 안의 시각은 고를 수 없어요.",
      });
      trackEvent("fail_quote_request", {
        entry_point: entryPoint(draft.entry),
        fail_reason: "pickup_time",
      });
      setStep(1);
      return;
    }
    sendingRef.current = true;
    const entry = entryPoint(draft.entry);
    trackEvent("request_quote_request", {
      entry_point: entry,
      only_store: draft.onlyDesignatedStores,
      photo_count: draft.photos.length,
      store_count: draft.stores.length,
      design_photo_count: draft.photos.filter((p) => p.designId).length,
      // 사진 보고 채우는 칸은 설명 하나(11-14부터): 채운 그대로 보내면 1
      auto_filled_count: isAutoFilled("description", draft, draft.autoFill) ? 1 : 0,
    });
    create.mutate(
      {
        photos: draft.photos,
        body: {
          pickupDate: draft.pickupDate,
          pickupHourFrom: draft.hourFrom ?? undefined,
          pickupHourTo: draft.hourTo ?? undefined,
          onlyDesignatedStores: draft.onlyDesignatedStores,
          // 보내기 화면에 "받는 가게에 이름·휴대폰 번호가 전달돼요" 안내가 있다(운영자 결정 11-13)
          shareContact: true,
          ...(draft.onlyDesignatedStores || !draft.area
            ? {}
            : {
                areaName: draft.area.name,
                areaSido: draft.area.sido,
                areaLatitude: draft.area.latitude,
                areaLongitude: draft.area.longitude,
                ...(draft.distance === "SIDO"
                  ? { wholeSido: true }
                  : { distanceKm: draft.distance }),
              }),
          stores: draft.stores.map((s) =>
            s.storeId
              ? { storeId: s.storeId }
              : {
                  kakaoPlaceId: s.kakaoPlaceId,
                  name: s.name,
                  address: s.address,
                  latitude: s.latitude,
                  longitude: s.longitude,
                  phone: s.phone,
                  placeUrl: s.placeUrl,
                },
          ),
          description: draft.description.trim() || undefined,
          size: draft.size,
          // 개수는 묻지 않는다(운영자 11-14). 단체 주문은 요청 사항·채팅으로
          quantity: 1,
          // 맛·크림은 묻지 않는다(운영자 11-14). 원하면 요청 사항에
          budgetMin: draft.budgetMin,
          budgetMax: draft.budgetMax >= QUOTE_LIMITS.BUDGET_MAX ? undefined : draft.budgetMax,
          requestNote: draft.requestNote.trim() || undefined,
          entry: draft.entry ?? undefined,
          photoDetails: draft.photos.length
            ? draft.photos.map((p) => ({
                designId: p.designId ?? null,
                parts: p.parts?.length ? p.parts : ["ALL"],
              }))
            : undefined,
        },
      },
      {
        onSuccess: (res) => {
          trackEvent("success_quote_request", { quote_request_id: res.id, entry_point: entry });
          sentRef.current = true;
          reset();
          router.replace(PATHS.QUOTE.SENT(res.id));
        },
        onSettled: () => {
          sendingRef.current = false;
        },
        onError: (error) => {
          trackEvent("fail_quote_request", { entry_point: entry, fail_reason: "api_error" });
          showAlert({
            type: "error",
            title: "보내지 못했어요",
            message: getApiMessage.error(error),
          });
        },
      },
    );
  };

  const next = () => {
    if (current === 6) send();
    else setStep(order[position + 1]);
  };

  // 단계를 넘기면 다음은 오른쪽에서, 뒤로는 왼쪽에서 살짝 들어온다(처음 그릴 때는 그대로)
  const prevPositionRef = useRef(position);
  const stepDirRef = useRef<"forward" | "backward" | null>(null);
  if (prevPositionRef.current !== position) {
    stepDirRef.current = position > prevPositionRef.current ? "forward" : "backward";
    prevPositionRef.current = position;
  }

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-white pb-[100px]">
      <header className="sticky top-0 z-10 flex h-[52px] items-center justify-between bg-white px-[16px]">
        <button type="button" aria-label={position === 0 ? "닫기" : "이전 단계"} onClick={goBack}>
          <Icon name={position === 0 ? "close" : "chevronLeft"} width={24} height={24} />
        </button>
        <span className="text-sm font-bold text-gray-900">견적 요청</span>
        <span className="w-[24px] text-right text-xs text-gray-500">
          {position + 1}/{order.length}
        </span>
      </header>
      <main
        key={current}
        className={`px-[20px] pt-[24px] motion-reduce:animate-none ${
          stepDirRef.current === "forward"
            ? "animate-step-in-forward"
            : stepDirRef.current === "backward"
              ? "animate-step-in-backward"
              : ""
        }`}
      >
        {current === 1 && <StepWhen now={now} />}
        {current === 2 && <StepWhere />}
        {current === 3 && <StepStores />}
        {current === 4 && <StepCake />}
        {current === 5 && <StepSizeBudget />}
        {current === 6 && (
          <StepConfirm now={now} onEdit={(s) => setStep(order.includes(s) ? s : 1)} />
        )}
      </main>
      <FixedFooter>
        <Button
          size="lg"
          className="w-full"
          disabled={!canNext}
          loading={current === 6 && create.isPending}
          onClick={next}
        >
          {current === 6 ? (create.isPending ? "보내는 중…" : "견적 요청 보내기") : "다음"}
        </Button>
      </FixedFooter>
      <BottomSheet
        isOpen={pendingInit !== null}
        onClose={() => setPendingInit(null)}
        title="쓰던 요청서가 있어요"
      >
        <p className="px-[20px] pt-[4px] text-sm text-gray-500">{draftSummary(draft)}</p>
        {pendingDesign && (
          <div className="mx-[20px] mt-[14px] flex items-center gap-[10px] rounded-xl border border-gray-100 p-[10px]">
            <img
              src={designImageSrc(pendingDesign.image.thumb)}
              alt=""
              className="h-[44px] w-[44px] shrink-0 rounded-lg bg-gray-50 object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{pendingDesign.name}</p>
              <p className="text-2sm text-gray-500">쓰던 요청서에 이 사진을 더할까요?</p>
            </div>
          </div>
        )}
        <div className="flex gap-[8px] px-[20px] pb-[20px] pt-[16px]">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => {
              start(pendingInit ?? undefined);
              if (pendingInit) fillAreaFromStore(pendingInit);
              setPendingInit(null);
            }}
          >
            새로 쓰기
          </Button>
          <Button
            size="lg"
            className="flex-1"
            onClick={() => {
              // 이어 쓰기: 쓰던 내용에 그 가게·디자인 사진을 더한다(사진은 3장까지)
              const extraPhotos = (pendingInit?.photos ?? []).filter(
                (p) => !draft.photos.some((x) => x.designId && x.designId === p.designId),
              );
              if (extraPhotos.length) {
                const room = QUOTE_LIMITS.MAX_PHOTOS - draft.photos.length;
                if (room < extraPhotos.length) {
                  showAlert({
                    type: "warning",
                    title: "사진은 3장까지예요",
                    message: "4단계에서 사진을 빼고 다시 넣어 주세요.",
                  });
                }
                if (room > 0) {
                  setPhotos([...draft.photos, ...extraPhotos.slice(0, room)]);
                  // 디자인을 보고 이어 쓴 요청은 들어온 곳을 디자인으로(기획 I-112 숫자)
                  update({ entry: "DESIGN" });
                }
              }
              const extra = pendingInit?.stores?.[0];
              if (
                extra &&
                !draft.stores.some((s) => s.key === extra.key) &&
                draft.stores.length < QUOTE_LIMITS.MAX_STORES
              ) {
                update({ stores: [...draft.stores, extra] });
              }
              setPendingInit(null);
            }}
          >
            {pendingDesign ? "이 사진 더해 이어 쓰기" : "이어 쓰기"}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

export default function QuoteNewPage() {
  return (
    <Suspense fallback={null}>
      <QuoteNewContent />
    </Suspense>
  );
}
