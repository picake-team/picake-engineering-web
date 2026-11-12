import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, ButtonPair } from "@/apps/web-seller/common/ui/Button";
import { StatusPill } from "@/apps/web-seller/common/ui/Badge";
import { Chip } from "@/apps/web-seller/common/ui/Choice";
import { Field, TextArea, TextInput } from "@/apps/web-seller/common/ui/Field";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { InfoRow } from "@/apps/web-seller/common/ui/List";
import { Checkbox } from "@/apps/web-seller/common/ui/Toggle";
import { cx } from "@/apps/web-seller/common/ui/cx";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import { uploadApi } from "@/apps/web-seller/features/upload/apis/upload.api";
import { dataUrlToFile, shrinkPhoto } from "@/apps/web-seller/features/chat/hooks/useChat";
import { quoteApi } from "@/apps/web-seller/features/quote/apis/quote.api";
import { CHAT_NO_REPLAY } from "@/apps/web-seller/features/chat/constants/chat.constants";
import { trackSellerEvent } from "@/apps/web-seller/common/utils/analytics.util";
import { sellerSurface } from "@/apps/web-seller/common/utils/webview.bridge";
import { PHONE_MAX_WIDTH_PX } from "@/apps/web-seller/common/constants/screen.constant";

const surfaceNow = () =>
  sellerSurface(window.matchMedia(`(max-width: ${PHONE_MAX_WIDTH_PX}px)`).matches);
import type {
  QuoteDeclineReason,
  QuoteRequestForShop,
  QuoteSimilarity,
  QuoteTargetState,
} from "@/apps/web-seller/features/quote/types/quote.type";

const SIMILARITY: { value: QuoteSimilarity; label: string; detail: string }[] = [
  { value: "EXACT", label: "거의 똑같이", detail: "모양·색·글씨까지 사진대로 만들어요" },
  {
    value: "SIMILAR",
    label: "비슷하게",
    detail: "전체 모양과 색은 같고, 캐릭터 표정·장식은 가게 솜씨대로 만들어요",
  },
  {
    value: "INSPIRED",
    label: "느낌만 살려서",
    detail: "색과 분위기를 살려 가게 디자인으로 만들어요",
  },
];

const DECLINE: { value: QuoteDeclineReason; label: string }[] = [
  { value: "FULLY_BOOKED", label: "그날 주문이 꽉 찼어요" },
  { value: "NOT_OUR_STYLE", label: "이런 디자인은 만들지 않아요" },
  { value: "BUDGET", label: "예산으로는 어려워요" },
  { value: "OTHER", label: "다른 이유" },
];

const STATE_TEXT: Record<QuoteTargetState, { tone: "turn" | "wait" | "done"; text: string }> = {
  OPEN: { tone: "turn", text: "견적 기다림" },
  SENT: { tone: "wait", text: "견적 보냄" },
  DECLINED: { tone: "done", text: "어려워요로 답함" },
  CHOSEN_ME: { tone: "turn", text: "손님이 골랐어요" },
  CHOSEN_OTHER: { tone: "done", text: "다른 가게를 골랐어요" },
  CLOSED: { tone: "done", text: "마감" },
  FULL: { tone: "done", text: "견적이 다 모였어요" },
};

const digits = (v: string) => Number(v.replace(/[^0-9]/g, "")) || 0;
const MEMO_MAX = 200;
const PHOTOS_MAX = 3;

export const quoteViewKey = (storeId: string, requestId: string) =>
  ["seller-quote", storeId, requestId] as const;

/**
 * 견적 보내기 창(기획 I-46 ②). 견적 링크(SC-19)와 같은 칸: 금액·비슷한 정도, 사진·메모(접어 둠).
 * 주문 받는 곳은 묻지 않는다(운영자 11-12: 손님이 고르면 이 채팅방에서 주문을 정함).
 */
function QuoteSendSheet({
  storeId,
  view,
  open,
  onClose,
}: {
  storeId: string;
  view: QuoteRequestForShop;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { addAlert } = useAlertStore();
  const q = view.quote;
  const [price, setPrice] = useState(q ? q.unitPrice.toLocaleString("ko-KR") : "");
  const [mayVary, setMayVary] = useState(q?.priceMayVary ?? false);
  const [similarity, setSimilarity] = useState<QuoteSimilarity | null>(q?.similarity ?? null);
  const [more, setMore] = useState(!!q && (q.photoUrls.length > 0 || !!q.memo));
  const [memo, setMemo] = useState(q?.memo ?? "");
  const [photos, setPhotos] = useState<string[]>(q?.photoUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unit = digits(price);

  const onPick = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(0, PHOTOS_MAX - photos.length)) {
        const shrunk = await shrinkPhoto(f);
        const res = await uploadApi.uploadFile(dataUrlToFile(shrunk, `quote-${Date.now()}.jpg`));
        urls.push(res.fileUrl);
      }
      setPhotos((p) => [...p, ...urls].slice(0, PHOTOS_MAX));
    } catch (e) {
      setError(getApiMessage.error(e));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    setError(null);
    if (unit < 1000) return setError("금액을 적어 주세요");
    if (!similarity) return setError("사진과 얼마나 비슷하게 만들 수 있는지 골라 주세요");
    setSending(true);
    try {
      await quoteApi.submit(storeId, view.requestId, {
        unitPrice: unit,
        priceMayVary: mayVary,
        similarity,
        ...(memo.trim() ? { memo: memo.trim() } : {}),
        photoUrls: photos,
      });
      trackSellerEvent("success_quote_send", {
        quote_request_id: view.requestId,
        edited: !!q,
        similarity,
        photo_count: photos.length,
        surface: surfaceNow(),
      });
      await queryClient.invalidateQueries({ queryKey: quoteViewKey(storeId, view.requestId) });
      // 주문 처리처럼 한 일을 아래 안내 띠로(같은 일 = 같은 모양)
      addAlert({ severity: "success", message: q ? "견적을 고쳤어요" : "견적을 보냈어요" });
      onClose();
    } catch (e) {
      setError(getApiMessage.error(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={q ? "견적 고치기" : "견적 보내기"}
      footer={
        <div className="flex flex-col gap-2">
          {error ? <p className="text-caption font-semibold text-brand-ink">{error}</p> : null}
          <Button block loading={sending} onClick={() => void onSubmit()}>
            {sending ? "보내는 중" : q ? "고친 견적 보내기" : "이 견적 보내기"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <Field
          label={view.quantity > 1 ? "1개 금액" : "금액"}
          helper={
            view.quantity > 1 && unit > 0
              ? `${view.quantity}개 합계 ${(unit * view.quantity).toLocaleString("ko-KR")}원`
              : undefined
          }
          trailing={<span className="text-body text-ink-900">원</span>}
        >
          {(p) => (
            <TextInput
              id={p.id}
              inputMode="numeric"
              value={price}
              placeholder="58,000"
              className="text-right"
              onChange={(e) => {
                const n = digits(e.target.value);
                setPrice(n ? n.toLocaleString("ko-KR") : "");
                setError(null);
              }}
            />
          )}
        </Field>
        <Checkbox checked={mayVary} onChange={setMayVary} className="-mt-3">
          디자인을 보고 달라질 수 있어요
        </Checkbox>

        <div className="flex flex-col gap-2">
          <span className="text-sub font-bold text-ink-700">
            사진과 얼마나 비슷하게 만들 수 있나요?
          </span>
          <div className="flex flex-wrap gap-2">
            {SIMILARITY.map((s) => (
              <Chip
                key={s.value}
                selected={similarity === s.value}
                onClick={() => setSimilarity(s.value)}
              >
                {s.label}
              </Chip>
            ))}
          </div>
          {similarity ? (
            <p className="text-caption text-ink-600">
              {SIMILARITY.find((s) => s.value === similarity)?.detail}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setMore((v) => !v)}
          className="flex h-12 items-center justify-between border-b border-ink-100 text-sub text-ink-900"
        >
          <span>
            비슷하게 만든 케이크 사진 · 메모 <span className="text-ink-400">선택</span>
          </span>
          <Icon name="chevronDown" size={18} className={cx(more && "rotate-180")} />
        </button>
        {more ? (
          <>
            <div className="flex gap-2">
              {photos.map((url) => (
                <div key={url} className="relative">
                  <img src={url} alt="" className="size-[72px] rounded-control object-cover" />
                  <button
                    type="button"
                    aria-label="사진 빼기"
                    onClick={() => setPhotos((p) => p.filter((x) => x !== url))}
                    className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-ink-900 text-white"
                  >
                    <Icon name="close" size={12} />
                  </button>
                </div>
              ))}
              {photos.length < PHOTOS_MAX ? (
                <label className="flex size-[72px] cursor-pointer items-center justify-center rounded-control border border-ink-200 text-ink-400">
                  {uploading ? "…" : <Icon name="camera" size={20} />}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => void onPick(e.target.files)}
                  />
                </label>
              ) : null}
            </div>
            <Field label="메모" counter={`${memo.length}/${MEMO_MAX}`}>
              {(p) => (
                <TextArea
                  id={p.id}
                  rows={3}
                  maxLength={MEMO_MAX}
                  value={memo}
                  placeholder="고를 수 있는 맛, 포함 사항 등"
                  onChange={(e) => setMemo(e.target.value)}
                />
              )}
            </Field>
          </>
        ) : null}
        <p className="text-caption text-ink-600">
          보내면 손님에게 가게 이름·견적·메모가 보여요. 손님이 고르면 이 채팅방에서 주문을 정해요
        </p>
      </div>
    </BottomSheet>
  );
}

/**
 * 채팅방 안 손님 견적 요청서 카드(판매자 앱에서 받기 A안, 운영자 결정 2026-11-12).
 * 요청서(손님 이름·연락처 없이)와 이 가게 쪽 상태, [어려워요] [견적 보내기].
 */
export function QuoteRequestPanel({ storeId, requestId }: { storeId: string; requestId: string }) {
  const queryClient = useQueryClient();
  const { addAlert } = useAlertStore();
  const {
    data: view,
    isError,
    refetch,
  } = useQuery({
    queryKey: quoteViewKey(storeId, requestId),
    queryFn: () => quoteApi.view(storeId, requestId),
  });
  const [sendOpen, setSendOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<string | null>(null);
  // 긴 설명·요청 사항은 4줄까지 보이고 "더 보기"로 펼친다(버튼이 화면 아래로 밀리지 않게)
  const [textOpen, setTextOpen] = useState(false);

  if (isError) {
    return (
      <div className="w-full rounded-card border border-ink-100 p-4 text-sub text-ink-600">
        요청서를 불러오지 못했어요{" "}
        <button
          type="button"
          className="font-bold text-ink-900 underline"
          onClick={() => void refetch()}
        >
          다시 시도
        </button>
      </div>
    );
  }
  if (!view) return <div className="h-40 w-full animate-pulse rounded-card bg-ink-50" />;

  const state = STATE_TEXT[view.state];
  const onDecline = async (reason: QuoteDeclineReason) => {
    setDeclining(true);
    setError(null);
    try {
      await quoteApi.decline(storeId, requestId, reason);
      trackSellerEvent("success_quote_decline", {
        quote_request_id: requestId,
        reason,
        surface: surfaceNow(),
      });
      await queryClient.invalidateQueries({ queryKey: quoteViewKey(storeId, requestId) });
      setDeclineOpen(false);
      addAlert({ severity: "success", message: "어려워요로 답했어요" });
    } catch (e) {
      setDeclineOpen(false);
      setError(getApiMessage.error(e));
    } finally {
      setDeclining(false);
    }
  };

  // 손님 사진·글은 화면 녹화에서 가린다(채팅 말풍선과 같게)
  const photosRow =
    view.photoUrls.length > 0 ? (
      <div className={cx(CHAT_NO_REPLAY, "flex gap-1.5 overflow-x-auto")}>
        {view.photoUrls.map((url, i) => (
          <button
            key={`${i}-${url}`}
            type="button"
            onClick={() => setViewer(url)}
            aria-label="사진 크게 보기"
          >
            <img
              src={url}
              alt="참고 사진"
              className="size-16 shrink-0 rounded-control object-cover"
            />
          </button>
        ))}
      </div>
    ) : null;
  // 설명 4줄·요청 사항 2줄까지 보이고 "더 보기"(운영자 11-12)
  const longText = (view.description ?? "").length + (view.requestNote ?? "").length > 120;
  const textBox =
    view.description || view.requestNote ? (
      <div className={cx(CHAT_NO_REPLAY, "rounded-control bg-ink-50 px-3 py-2.5")}>
        {view.description ? (
          <p
            className={cx("whitespace-pre-wrap text-sub text-ink-900", !textOpen && "line-clamp-4")}
          >
            {view.description}
          </p>
        ) : null}
        {view.requestNote ? (
          <p
            className={cx(
              "whitespace-pre-wrap text-sub text-ink-700",
              view.description && "mt-1.5",
              !textOpen && "line-clamp-2",
            )}
          >
            <span className="font-semibold text-ink-600">요청 사항 </span>
            {view.requestNote}
          </p>
        ) : null}
        {!textOpen && longText ? (
          <button
            type="button"
            onClick={() => setTextOpen(true)}
            className="mt-1 text-sub font-semibold text-ink-900 underline"
          >
            더 보기
          </button>
        ) : null}
      </div>
    ) : null;

  // 정보 줄 모양(주문 상세와 같은 이름 | 값, 운영자 고름 11-12)
  return (
    <div className="w-full rounded-card border border-ink-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-body font-bold text-ink-900">손님 견적 요청</span>
        <StatusPill tone={state.tone}>{state.text}</StatusPill>
      </div>
      {photosRow}
      <div className="mt-1">
        <InfoRow important={false} className="min-h-9" label="픽업" value={view.pickup} />
        <InfoRow important={false} className="min-h-9" label="케이크" value={view.cake} />
        <InfoRow important={false} className="min-h-9" label="예산" value={view.budget} />
        {view.area ? (
          <InfoRow important={false} className="min-h-9" label="동네" value={`${view.area} 근처`} />
        ) : null}
      </div>
      {textBox ? <div className="mt-2">{textBox}</div> : null}
      {/* 손님이 고른 뒤에는 마감 시각이 필요 없어 할 일 한 줄로 바꾼다 */}
      {view.state === "CHOSEN_ME" ? null : (
        <p className="mt-2 text-caption text-ink-600">견적 마감 {view.deadline}</p>
      )}

      {view.quote ? (
        <div className="mt-3 rounded-control bg-ink-50 px-3 py-2 text-sub text-ink-900">
          보낸 견적 {view.quote.total.toLocaleString("ko-KR")}원 · {view.quote.similarityLabel}
          {view.quote.edited ? <span className="text-ink-400"> · 고침</span> : null}
        </div>
      ) : null}
      {view.state === "CHOSEN_ME" ? (
        // 고른 뒤 할 일(Picake 예약은 아직 없음, 기획 I-01 전까지 주문·입금은 가게와 직접)
        <p className="mt-2 text-sub font-semibold text-ink-900">
          손님과 채팅으로 디자인·픽업 시간·입금 방법을 정해 주세요
        </p>
      ) : null}
      {error ? <p className="mt-2 text-caption font-semibold text-brand-ink">{error}</p> : null}

      {view.canEdit ? (
        view.quote || view.state === "DECLINED" ? (
          <Button variant="secondary" block className="mt-3" onClick={() => setSendOpen(true)}>
            {view.quote ? "견적 고치기" : "견적 보내기"}
          </Button>
        ) : (
          <ButtonPair className="mt-3" primaryWeight={2}>
            <Button variant="secondary" onClick={() => setDeclineOpen(true)}>
              어려워요
            </Button>
            <Button onClick={() => setSendOpen(true)}>견적 보내기</Button>
          </ButtonPair>
        )
      ) : null}

      {sendOpen ? (
        <QuoteSendSheet
          storeId={storeId}
          view={view}
          open={sendOpen}
          onClose={() => setSendOpen(false)}
        />
      ) : null}
      <BottomSheet
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="어려운 이유를 골라 주세요"
        description="손님에게는 “이번 요청은 어렵대요”로만 보여요"
      >
        <div className="flex flex-col">
          {DECLINE.map((d) => (
            <button
              key={d.value}
              type="button"
              disabled={declining}
              onClick={() => void onDecline(d.value)}
              className="h-12 border-b border-ink-100 text-left text-body text-ink-900 last:border-b-0"
            >
              {d.label}
            </button>
          ))}
        </div>
      </BottomSheet>
      {viewer ? (
        <button
          type="button"
          aria-label="닫기"
          onClick={() => setViewer(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
        >
          <img
            src={viewer}
            alt=""
            className="max-h-[80vh] max-w-[92vw] rounded-control object-contain"
          />
        </button>
      ) : null}
    </div>
  );
}
