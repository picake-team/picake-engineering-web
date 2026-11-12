import { safeHttpUrl } from "@/apps/web-admin/common/utils/safe-url.util";
import React, { useState } from "react";
import { BaseButton as Button } from "@/apps/web-admin/common/components/buttons/BaseButton";
import { Card } from "@/apps/web-admin/common/components/cards/Card";
import { Input } from "@/apps/web-admin/common/components/inputs/Input";
import { LIST_CARD } from "@/apps/web-admin/common/constants/list-typography.constant";
import { useAlertStore } from "@/apps/web-admin/common/store/alert.store";
import getApiMessage from "@/apps/web-admin/common/utils/getApiMessage";
import {
  QUOTE_DECLINE_LABELS,
  QUOTE_TARGET_STATE_LABELS,
  formatDateTime,
  quoteAdminApi,
  useQuoteAdminAction,
  useQuoteSection,
  type AdminAddStoreBody,
  type AdminQuoteDetailDtoLike,
  type AdminQuoteInputBody,
  type AdminQuoteTargetStatusDto,
  type QuoteContactType,
  type QuoteDeclineReason,
  type QuoteSimilarity,
} from "@/apps/web-admin/features/quote-request-management/quote-request-management";

const SIMILARITY: { value: QuoteSimilarity; label: string }[] = [
  { value: "EXACT", label: "거의 똑같이" },
  { value: "SIMILAR", label: "비슷하게" },
  { value: "INSPIRED", label: "느낌만 살려서" },
];
const CONTACTS: { type: QuoteContactType; label: string }[] = [
  { type: "KAKAO", label: "카카오톡 채널" },
  { type: "INSTAGRAM", label: "인스타그램" },
  { type: "PHONE", label: "전화" },
  { type: "NAVER", label: "네이버" },
];

/** "솜사탕케이크를", "케이크샵을" — 받침에 맞춰 을/를 */
function withEulReul(word: string): string {
  const code = word.trim().slice(-1).charCodeAt(0) - 0xac00;
  const batchim = code >= 0 && code <= 11171 && code % 28 !== 0;
  return `${word}${batchim ? "을" : "를"}`;
}

/** 카카오맵 장소 링크에서 장소 번호(place.map.kakao.com/123, map.kakao.com/?itemId=123) */
function kakaoPlaceIdFrom(url: string): string | undefined {
  return url.match(/place\.map\.kakao\.com\/(\d+)/)?.[1] ?? url.match(/itemId=(\d+)/)?.[1];
}

/**
 * 사장님께 보낼 연락 문구(SC-46 ⑥, 제안). 진짜 손님 요청이 있을 때만 쓴다.
 * 입점 전 가게에는 가입 없이 금액만 남기면 된다는 말, 이미 입점한 가게에는 가입·입점 안내를 뺀다.
 */
function contactText(req: AdminQuoteDetailDtoLike, linkUrl: string): string {
  const area = req.areaName ? `${req.areaName} 근처 ` : "";
  return [
    "사장님, 안녕하세요. 케이크 주문 앱 Picake예요.",
    `${area}손님이 케이크 견적을 받고 싶어 해요.`,
    `· 픽업: ${req.summary.pickup}`,
    `· 케이크: ${req.summary.cake}`,
    `· 예산: ${req.summary.budget}`,
    "가입 없이 아래 링크에서 금액만 남겨 주시면 손님께 전해 드릴게요.",
    linkUrl,
  ].join("\n");
}

function StoreRow({
  requestId,
  req,
  store,
  status,
  open,
  onWrite,
}: {
  requestId: string;
  req: AdminQuoteDetailDtoLike;
  store: AdminQuoteDetailDtoLike["stores"][number];
  status: AdminQuoteTargetStatusDto | undefined;
  open: boolean;
  onWrite: () => void;
}) {
  const { addAlert } = useAlertStore();
  const link = useQuoteAdminAction(requestId, () => quoteAdminApi.createLink(requestId, store.id));
  const onCopy = async () => {
    try {
      const { linkUrl } = await link.mutateAsync(undefined);
      await navigator.clipboard.writeText(contactText(req, linkUrl));
      addAlert({
        severity: "success",
        message: "링크와 연락 문구를 복사했어요. 인스타 DM·카톡으로 보내 주세요.",
      });
    } catch (e) {
      addAlert({ severity: "error", message: getApiMessage.error(e) });
    }
  };
  const q = status?.quote;
  return (
    <div className="flex flex-col gap-1 border-b border-border/60 py-3 text-sm last:border-0">
      <div className="flex items-center gap-2">
        <span className="font-medium">{store.name}</span>
        <span className="text-xs text-muted-foreground">
          {store.isPicakeStore ? "Picake 가게" : "입점 전"}
          {store.addedBy === "ADMIN" ? " · 운영자가 더함" : ""}
        </span>
        {status && (
          <span className="ml-auto rounded bg-muted px-2 py-0.5 text-xs">
            {QUOTE_TARGET_STATE_LABELS[status.state]}
          </span>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {[store.address, store.phone].filter(Boolean).join(" · ")}
        {safeHttpUrl(store.placeUrl) && (
          <>
            {store.address || store.phone ? " · " : ""}
            <a
              href={safeHttpUrl(store.placeUrl)!}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              카카오맵
            </a>
          </>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {store.isPicakeStore
          ? status?.sentToAppAt
            ? `판매자 앱으로 보냄 ${formatDateTime(status.sentToAppAt)}`
            : "판매자 앱으로 아직 안 보냄(받는 중일 때 보냄)"
          : status?.linkCreatedAt
            ? `링크 만듦 ${formatDateTime(status.linkCreatedAt)}${status.linkOpenedAt ? ` · 열어 봄 ${formatDateTime(status.linkOpenedAt)}` : " · 아직 안 열어 봄"}`
            : "아직 안 물어봄"}
        {status?.hasChat ? ` · 대화 있음${status.awaitingShopReply ? "(가게 답 기다림)" : ""}` : ""}
      </div>
      {q && (
        <div className="rounded bg-muted/60 px-3 py-2 text-xs">
          {q.total.toLocaleString("ko-KR")}원
          {q.quantity > 1 ? `(1개 ${q.unitPrice.toLocaleString("ko-KR")}원)` : ""} ·{" "}
          {q.similarityLabel}
          {q.priceMayVary ? " · 달라질 수 있음" : ""}
          {q.edited ? " · 고침" : ""} · {q.contacts.map((c) => c.label).join("·")}
          {q.source === "ADMIN"
            ? " · 운영자가 대신 적음"
            : q.source === "SELLER"
              ? " · 판매자 앱"
              : " · 링크"}
          {q.memo && <div className="mt-1 whitespace-pre-wrap">메모: {q.memo}</div>}
        </div>
      )}
      {!q && status?.declineReason && (
        <div className="text-xs">어려워요 — {QUOTE_DECLINE_LABELS[status.declineReason]}</div>
      )}
      {open && (
        <div className="flex flex-wrap gap-2 pt-1">
          {!store.isPicakeStore && (
            <Button
              variant="outline"
              size="sm"
              disabled={link.isPending}
              onClick={() => void onCopy()}
            >
              {status?.linkUrl ? "링크·연락 문구 복사" : "링크 만들고 연락 문구 복사"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onWrite}>
            {q ? "대신 고치기" : "대신 적기"}
          </Button>
        </div>
      )}
    </div>
  );
}

/** 대신 적기(SC-46 ⑦): 견적 링크와 같은 칸. 손님에게 보여도 된다는 확인을 받았을 때만 */
function WriteDialog({
  requestId,
  target,
  storeName,
  quantity,
  onClose,
}: {
  requestId: string;
  target: AdminQuoteTargetStatusDto;
  storeName: string;
  quantity: number;
  onClose: () => void;
}) {
  const { addAlert } = useAlertStore();
  const q = target.quote;
  const [price, setPrice] = useState(q ? String(q.unitPrice) : "");
  const [mayVary, setMayVary] = useState(q?.priceMayVary ?? false);
  const [similarity, setSimilarity] = useState<QuoteSimilarity>(q?.similarity ?? "SIMILAR");
  const [contacts, setContacts] = useState<Partial<Record<QuoteContactType, string>>>(() =>
    Object.fromEntries((q?.contacts ?? []).map((c) => [c.type, c.value])),
  );
  const [memo, setMemo] = useState(q?.memo ?? "");
  const [confirmed, setConfirmed] = useState(false);
  const submit = useQuoteAdminAction(requestId, (body: AdminQuoteInputBody) =>
    quoteAdminApi.submit(requestId, target.targetId, body),
  );
  const decline = useQuoteAdminAction(requestId, (reason: QuoteDeclineReason) =>
    quoteAdminApi.decline(requestId, target.targetId, reason),
  );
  const onSave = async () => {
    const list = CONTACTS.filter((c) => contacts[c.type]?.trim()).map((c) => ({
      type: c.type,
      value: contacts[c.type]!.trim(),
    }));
    try {
      await submit.mutateAsync({
        unitPrice: Number(price.replace(/[^0-9]/g, "")),
        priceMayVary: mayVary,
        similarity,
        contacts: list,
        ...(memo.trim() ? { memo: memo.trim() } : {}),
      });
      addAlert({ severity: "success", message: "견적을 적었어요. 손님에게 알림이 갔어요." });
      onClose();
    } catch (e) {
      addAlert({ severity: "error", message: getApiMessage.error(e) });
    }
  };
  const onDecline = async (reason: QuoteDeclineReason) => {
    try {
      await decline.mutateAsync(reason);
      onClose();
    } catch (e) {
      addAlert({ severity: "error", message: getApiMessage.error(e) });
    }
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-lg">
        <h2 className="mb-1 font-semibold">{storeName} 견적 대신 적기</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          사장님이 DM으로 답했을 때 적어요. 손님 화면에는 링크로 온 견적과 똑같이 보여요.
        </p>
        <div className="flex flex-col gap-3">
          <Input
            label={quantity > 1 ? `1개 금액(원) — ${quantity}개` : "금액(원)"}
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mayVary}
              onChange={(e) => setMayVary(e.target.checked)}
            />
            디자인을 보고 달라질 수 있어요
          </label>
          <div className="flex gap-2">
            {SIMILARITY.map((s) => (
              <Button
                key={s.value}
                size="sm"
                variant={similarity === s.value ? "default" : "outline"}
                onClick={() => setSimilarity(s.value)}
              >
                {s.label}
              </Button>
            ))}
          </div>
          {CONTACTS.map((c) => (
            <Input
              key={c.type}
              label={`주문 받는 곳 · ${c.label}`}
              value={contacts[c.type] ?? ""}
              onChange={(e) => setContacts((cur) => ({ ...cur, [c.type]: e.target.value }))}
            />
          ))}
          <label className="flex flex-col gap-1 text-sm">
            메모(선택, 200자)
            <textarea
              className="rounded-md border border-input p-2"
              rows={3}
              maxLength={200}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            사장님께 손님에게 보여도 된다고 확인받았어요
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button disabled={!confirmed || submit.isPending} onClick={() => void onSave()}>
            {submit.isPending ? "적는 중…" : "견적 적기"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          {!q && (
            <select
              className="ml-auto h-9 rounded-md border border-input px-2 text-sm"
              defaultValue=""
              onChange={(e) =>
                e.target.value && void onDecline(e.target.value as QuoteDeclineReason)
              }
            >
              <option value="">어려워요로 적기…</option>
              {Object.entries(QUOTE_DECLINE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 물어볼 가게와 견적(SC-46 ②~⑨, 기획 I-46 ②). 가게마다 링크·판매자 앱으로 보냄·견적·대화 상태,
 * 가게 추가, 대신 적기, 입점 전 가게를 고르면 "알렸어요", 요청 마감하기.
 */
export function QuoteTargetsCard({ req }: { req: AdminQuoteDetailDtoLike }) {
  const requestId = req.id;
  const { addAlert } = useAlertStore();
  const { data: section } = useQuoteSection(requestId);
  const [writing, setWriting] = useState<AdminQuoteTargetStatusDto | null>(null);
  const [name, setName] = useState("");
  const [placeUrl, setPlaceUrl] = useState("");
  const [storeId, setStoreId] = useState("");
  const add = useQuoteAdminAction(requestId, (body: AdminAddStoreBody) =>
    quoteAdminApi.addStore(requestId, body),
  );
  const notified = useQuoteAdminAction(requestId, () => quoteAdminApi.chosenNotified(requestId));
  const close = useQuoteAdminAction(requestId, () => quoteAdminApi.close(requestId));
  const open = req.status === "OPEN";
  const byId = new Map((section?.targets ?? []).map((t) => [t.targetId, t]));
  const chosen = req.stores.find((s) => s.id === section?.chosenTargetId);

  const onAdd = async () => {
    const body: AdminAddStoreBody = storeId.trim()
      ? { storeId: storeId.trim() }
      : {
          name: name.trim(),
          ...(safeHttpUrl(placeUrl.trim()) ? { placeUrl: placeUrl.trim() } : {}),
          ...(kakaoPlaceIdFrom(placeUrl) ? { kakaoPlaceId: kakaoPlaceIdFrom(placeUrl) } : {}),
        };
    try {
      await add.mutateAsync(body);
      setName("");
      setPlaceUrl("");
      setStoreId("");
    } catch (e) {
      addAlert({ severity: "error", message: getApiMessage.error(e) });
    }
  };

  return (
    <Card className={LIST_CARD}>
      <div className="px-5 py-3">
        <h2 className="mb-1 font-semibold">물어볼 가게 · 견적</h2>
        <p className="mb-2 text-xs text-muted-foreground">
          Picake 가게는 판매자 앱 채팅으로 요청서가 바로 가요. 입점 전 가게는 링크를 만들어 DM으로
          보내 주세요.
        </p>

        {chosen && section && (
          <div className="mb-3 rounded-md border border-primary/40 px-3 py-2 text-sm">
            손님이 <b>{withEulReul(chosen.name)}</b> 골랐어요
            {section.chosenAt ? ` (${formatDateTime(section.chosenAt)})` : ""}.
            {section.chosenStalled && (
              <div className="text-destructive">
                가게가 24시간째 손님 글에 답이 없어요. 다시 연락해 보세요.
              </div>
            )}
            {section.chosenIsUnentered &&
              (section.chosenNotifiedAt ? (
                <div className="text-xs text-muted-foreground">
                  사장님께 알림 {formatDateTime(section.chosenNotifiedAt)}
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs">
                    그 가게에 &quot;손님이 사장님 견적을 골랐어요, 링크에서 손님과 대화해
                    주세요&quot;를 DM으로 보낸 뒤 눌러 주세요.
                  </span>
                  <Button
                    size="sm"
                    disabled={notified.isPending}
                    onClick={() => notified.mutate(undefined)}
                  >
                    알렸어요
                  </Button>
                </div>
              ))}
          </div>
        )}

        {req.stores.length === 0 && (
          <p className="py-2 text-sm text-muted-foreground">
            손님이 넣은 가게가 없어요. 근처 가게를 더해 물어봐 주세요.
          </p>
        )}
        {req.stores.map((s) => (
          <StoreRow
            key={s.id}
            requestId={requestId}
            req={req}
            store={s}
            status={byId.get(s.id)}
            open={open}
            onWrite={() => {
              const st = byId.get(s.id);
              if (st) setWriting(st);
            }}
          />
        ))}

        {open && !req.onlyDesignatedStores && (
          <div className="mt-3 flex flex-col gap-2 rounded-md bg-muted/40 p-3">
            <span className="text-sm font-medium">가게 추가</span>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <Input
                placeholder="가게 이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="카카오맵 링크(선택)"
                value={placeUrl}
                onChange={(e) => setPlaceUrl(e.target.value)}
              />
            </div>
            <Input
              placeholder="또는 Picake 스토어 ID"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            />
            <Button
              size="sm"
              disabled={add.isPending || (!name.trim() && !storeId.trim())}
              onClick={() => void onAdd()}
            >
              더하기
            </Button>
          </div>
        )}

        {open && (
          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={close.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    "이 요청을 마감할까요? 손님에게는 마감으로 보이고 되돌릴 수 없어요.",
                  )
                ) {
                  close.mutate(undefined);
                }
              }}
            >
              요청 마감하기
            </Button>
          </div>
        )}
      </div>
      {writing && (
        <WriteDialog
          requestId={requestId}
          target={writing}
          storeName={req.stores.find((s) => s.id === writing.targetId)?.name ?? "가게"}
          quantity={req.quantity}
          onClose={() => setWriting(null)}
        />
      )}
    </Card>
  );
}
