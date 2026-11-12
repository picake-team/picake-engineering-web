"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { Checkbox } from "@/apps/web-user/common/components/inputs/Checkbox";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { cn } from "@/apps/web-user/common/lib/utils";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";
import { quoteLinkApi } from "@/apps/web-user/features/quote/apis/quote.api";
import {
  Field,
  NoticeBox,
  Pill,
} from "@/apps/web-user/features/quote/components/form/QuoteFormParts";
import { QUOTE_NO_REPLAY } from "@/apps/web-user/features/quote/constants/quote.constant";
import { dataUrlToFile, shrinkPhoto } from "@/apps/web-user/features/quote/utils/quote-photo.util";
import type {
  QuoteContactType,
  QuoteDeclineReason,
  QuoteLinkView,
  QuoteSimilarity,
} from "@/apps/web-user/features/quote/types/quote.type";
import { QuoteLinkChat } from "@/apps/web-user/features/quote/components/link/QuoteLinkChat";

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

const CONTACTS: { type: QuoteContactType; label: string; placeholder: string }[] = [
  { type: "KAKAO", label: "카카오톡 채널", placeholder: "pf.kakao.com/_가게" },
  { type: "INSTAGRAM", label: "인스타그램", placeholder: "@가게아이디" },
  { type: "PHONE", label: "전화", placeholder: "010-0000-0000" },
  { type: "NAVER", label: "네이버", placeholder: "톡톡·예약 주소" },
];

const DECLINE: { value: QuoteDeclineReason; label: string }[] = [
  { value: "FULLY_BOOKED", label: "그날 주문이 꽉 찼어요" },
  { value: "NOT_OUR_STYLE", label: "이런 디자인은 만들지 않아요" },
  { value: "BUDGET", label: "예산으로는 어려워요" },
  { value: "OTHER", label: "다른 이유" },
];

const MEMO_MAX = 200;
const PHOTOS_MAX = 3;

type FormState = {
  price: string;
  priceMayVary: boolean;
  similarity: QuoteSimilarity | null;
  contacts: Partial<Record<QuoteContactType, string>>;
  memo: string;
  photos: string[];
};

function initialForm(view: QuoteLinkView): FormState {
  const q = view.quote;
  const contacts: FormState["contacts"] = {};
  for (const c of q?.contacts ?? view.prefillContacts) {
    contacts[c.type] = c.type === "INSTAGRAM" ? `@${c.value}` : c.value;
  }
  return {
    price: q ? q.unitPrice.toLocaleString("ko-KR") : "",
    priceMayVary: q?.priceMayVary ?? false,
    similarity: q?.similarity ?? null,
    contacts,
    memo: q?.memo ?? "",
    photos: q?.photoUrls ?? [],
  };
}

const digits = (v: string) => Number(v.replace(/[^0-9]/g, "")) || 0;

/** 손님 요청서(이름·연락처 없이, 지역은 동네까지) */
function RequestCard({ view }: { view: QuoteLinkView }) {
  const [viewer, setViewer] = useState<string | null>(null);
  return (
    <section className="mb-[24px] rounded-xl border border-gray-100 px-[16px] py-[14px]">
      {view.photoUrls.length > 0 && (
        <div className={cn("mb-[12px] flex gap-[6px] overflow-auto", QUOTE_NO_REPLAY)}>
          {view.photoUrls.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => setViewer(url)}
              aria-label="사진 크게 보기"
            >
              <img
                src={url}
                alt="참고 사진"
                className="h-[96px] w-[96px] shrink-0 rounded-lg object-cover"
              />
            </button>
          ))}
        </div>
      )}
      <p className="text-sm font-bold text-gray-900">{view.pickup}</p>
      <p className="mt-[2px] text-sm text-gray-900">
        {view.cake}
        {view.area ? ` · ${view.area} 근처` : ""}
      </p>
      {view.description && (
        <p className={cn("mt-[6px] whitespace-pre-wrap text-sm text-gray-700", QUOTE_NO_REPLAY)}>
          설명 &ldquo;{view.description}&rdquo;
        </p>
      )}
      {view.requestNote && (
        <p className={cn("mt-[2px] whitespace-pre-wrap text-sm text-gray-700", QUOTE_NO_REPLAY)}>
          요청 사항 &ldquo;{view.requestNote}&rdquo;
        </p>
      )}
      <p className="mt-[6px] text-sm text-gray-700">예산 {view.budget}</p>
      {viewer && (
        <button
          type="button"
          aria-label="닫기"
          onClick={() => setViewer(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
        >
          <img
            src={viewer}
            alt=""
            className="max-h-[80vh] max-w-[92vw] rounded-lg object-contain"
          />
        </button>
      )}
    </section>
  );
}

/**
 * 사장님 견적 링크(기획 I-46 SC-19). 가입 없이 금액·비슷한 정도·주문 받는 곳(필요하면 사진·메모)을 보낸다.
 * 보낸 뒤에는 손님이 고르기 전까지 고칠 수 있고, 손님과 링크 안에서 대화한다(기획 I-11).
 */
export function QuoteLinkScreen({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const {
    data: view,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["quote-link", token],
    queryFn: () => quoteLinkApi.view(token),
    enabled: !!token,
    retry: false,
  });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [more, setMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declining, setDeclining] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (view && !form) {
      setForm(initialForm(view));
      setMore(!!view.quote && (view.quote.photoUrls.length > 0 || !!view.quote.memo));
    }
  }, [view, form]);

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["quote-link", token] });
  }, [queryClient, token]);

  const header = (
    <header className="sticky top-0 z-10 flex h-[52px] items-center gap-[8px] border-b border-gray-50 bg-white px-[16px]">
      <Icon name="logoPicake" width={28} height={28} />
      <span className="text-sm font-bold text-gray-900">손님 견적 요청</span>
    </header>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        {header}
        <p className="py-[40px] text-center text-sm text-gray-400">불러오는 중…</p>
      </div>
    );
  }
  if (isError || !view || !form) {
    return (
      <div className="min-h-screen bg-white">
        {header}
        <div className="flex flex-col items-center gap-[16px] px-[20px] py-[48px]">
          <p className="text-center text-sm text-gray-700">
            {isError ? getApiMessage.error(error) : "견적 링크를 찾을 수 없어요."}
          </p>
          {/* 없는 링크(404)는 다시 해도 같아서 "다시 시도"를 보이지 않는다. 인터넷 끊김 등만 */}
          {!(isAxiosError(error) && error.response?.status === 404) && (
            <Button
              variant="outline"
              size="md"
              className="w-[160px]"
              onClick={() => void refetch()}
            >
              다시 시도
            </Button>
          )}
        </div>
      </div>
    );
  }

  const set = (patch: Partial<FormState>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const price = digits(form.price);
  const chosenContacts = CONTACTS.filter((c) => form.contacts[c.type] !== undefined);
  // 어려워요로 답한 뒤에도 "견적 보내기로 바꾸기"를 누르면 칸이 열린다
  const showForm =
    view.canEdit && (!view.quote || editing) && (view.state !== "DECLINED" || editing);
  const showDeclined = view.state === "DECLINED" && !editing;

  const toggleContact = (type: QuoteContactType) => {
    const next = { ...form.contacts };
    if (next[type] !== undefined) delete next[type];
    else next[type] = "";
    set({ contacts: next });
  };

  const onPickPhotos = async (files: FileList | null) => {
    if (!files) return;
    const room = PHOTOS_MAX - form.photos.length;
    const urls: string[] = [];
    for (const f of Array.from(files).slice(0, room)) {
      try {
        const shrunk = await shrinkPhoto(f);
        urls.push(
          await quoteLinkApi.uploadPhoto(token, dataUrlToFile(shrunk, `quote-${Date.now()}.jpg`)),
        );
      } catch (e) {
        setFormError(getApiMessage.error(e));
      }
    }
    set({ photos: [...form.photos, ...urls].slice(0, PHOTOS_MAX) });
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSubmit = async () => {
    setFormError(null);
    if (price < 1000) return setFormError("금액을 적어 주세요.");
    if (!form.similarity) return setFormError("사진과 얼마나 비슷하게 만들 수 있는지 골라 주세요.");
    const contacts = chosenContacts
      .map((c) => ({ type: c.type, value: (form.contacts[c.type] ?? "").trim() }))
      .filter((c) => c.value);
    if (contacts.length === 0)
      return setFormError("주문 받는 곳을 하나 이상 골라 주소나 번호를 적어 주세요.");
    setSending(true);
    try {
      await quoteLinkApi.submit(token, {
        unitPrice: price,
        priceMayVary: form.priceMayVary,
        similarity: form.similarity,
        contacts,
        ...(form.memo.trim() ? { memo: form.memo.trim() } : {}),
        photoUrls: form.photos,
      });
      setEditing(false);
      await reload();
    } catch (e) {
      setFormError(getApiMessage.error(e));
    } finally {
      setSending(false);
    }
  };

  const onDecline = async (reason: QuoteDeclineReason) => {
    setDeclining(true);
    try {
      await quoteLinkApi.decline(token, reason);
      setDeclineOpen(false);
      await reload();
    } catch (e) {
      setDeclineOpen(false);
      setFormError(getApiMessage.error(e));
    } finally {
      setDeclining(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-[120px]">
      {header}
      <main className="px-[20px] pt-[20px]">
        <h1 className="text-xl font-bold leading-[27.5px] text-gray-900">
          {view.storeName} 사장님께 온 케이크 요청이에요
        </h1>
        <p className="mb-[16px] mt-[4px] text-sm text-gray-500">
          가입 없이 금액만 보내면 돼요 · {view.deadline}까지
        </p>
        <RequestCard view={view} />

        {view.state === "CHOSEN_ME" && (
          <div className="mb-[20px]">
            <NoticeBox tone="blue">
              손님이 사장님 견적을 골랐어요. 아래 대화에서 손님과 이야기를 이어 가세요.
            </NoticeBox>
          </div>
        )}
        {view.state === "CHOSEN_OTHER" && (
          <div className="mb-[20px]">
            <NoticeBox>손님이 다른 견적을 골랐어요. 견적을 보내 주셔서 고마워요.</NoticeBox>
          </div>
        )}
        {view.state === "CLOSED" && (
          <div className="mb-[20px]">
            <NoticeBox>
              이 요청은 마감됐어요. 다른 가게를 골랐거나 견적 받는 기간이 끝났어요.
            </NoticeBox>
          </div>
        )}
        {view.state === "FULL" && !view.quote && (
          <div className="mb-[20px]">
            <NoticeBox>이 요청은 견적이 다 모였어요.</NoticeBox>
          </div>
        )}
        {showDeclined && (
          <div className="mb-[20px] flex flex-col gap-[10px]">
            <NoticeBox>
              어려워요로 답했어요({DECLINE.find((d) => d.value === view.declineReason)?.label ?? ""}
              ). 손님에게는 한 줄로 보여요.
            </NoticeBox>
            {view.canEdit && (
              <Button variant="outline" size="md" onClick={() => setEditing(true)}>
                견적 보내기로 바꾸기
              </Button>
            )}
          </div>
        )}

        {view.quote && !editing && (
          <section className="mb-[20px] rounded-xl border border-gray-100 px-[16px] py-[14px]">
            <p className="mb-[8px] text-sm font-bold text-gray-900">보낸 견적</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">금액</span>
              <span className="text-gray-900">
                {view.quote.quantity > 1
                  ? `1개 ${view.quote.unitPrice.toLocaleString("ko-KR")}원 × ${view.quote.quantity}개`
                  : `${view.quote.total.toLocaleString("ko-KR")}원`}{" "}
                · {view.quote.similarityLabel}
              </span>
            </div>
            <div className="mt-[6px] flex justify-between gap-[12px] text-sm">
              <span className="shrink-0 text-gray-500">주문 받는 곳</span>
              <span className="truncate text-gray-900">
                {view.quote.contacts.map((c) => c.label).join(" · ")}
              </span>
            </div>
            {view.canEdit && (
              <p className="mt-[10px] text-xs text-gray-500">
                손님이 사장님 견적을 고르면 이 화면과 Picake가 알려 드려요.
              </p>
            )}
            {view.canEdit && (
              <Button
                variant="outline"
                size="md"
                className="mt-[12px] w-full"
                onClick={() => {
                  setForm(initialForm(view));
                  setEditing(true);
                }}
              >
                견적 고치기
              </Button>
            )}
          </section>
        )}

        {showForm && (
          <section>
            <p className="mb-[16px] text-base font-bold text-gray-900">
              {view.quote ? "견적 고치기" : "견적 보내기"}
            </p>
            <Field label={view.quantity > 1 ? "1개 금액" : "금액"}>
              <div className="flex items-center gap-[8px]">
                <input
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => {
                    const n = digits(e.target.value);
                    set({ price: n ? n.toLocaleString("ko-KR") : "" });
                  }}
                  placeholder="58,000"
                  aria-label="금액"
                  className="h-[48px] flex-1 rounded-xl border border-gray-100 px-[14px] text-right text-base text-gray-900 outline-none focus:border-gray-900"
                />
                <span className="text-sm text-gray-900">원</span>
              </div>
              {view.quantity > 1 && price > 0 && (
                <p className="mt-[6px] text-right text-xs text-gray-500">
                  {view.quantity}개 합계 {(price * view.quantity).toLocaleString("ko-KR")}원
                </p>
              )}
              <div className="mt-[10px]">
                <Checkbox
                  checked={form.priceMayVary}
                  onChange={(v) => set({ priceMayVary: v })}
                  label={
                    <span className="text-sm text-gray-700">디자인을 보고 달라질 수 있어요</span>
                  }
                />
              </div>
            </Field>

            <Field
              label="사진과 얼마나 비슷하게 만들 수 있나요?"
              caption={SIMILARITY.find((s) => s.value === form.similarity)?.detail}
            >
              <div className="flex flex-wrap gap-[8px]">
                {SIMILARITY.map((s) => (
                  <Pill
                    key={s.value}
                    selected={form.similarity === s.value}
                    onClick={() => set({ similarity: s.value })}
                  >
                    {s.label}
                  </Pill>
                ))}
              </div>
            </Field>

            <Field
              label="주문 받는 곳"
              optional="여러 개 골라도 돼요"
              caption="손님이 사장님 견적을 고르면 고른 곳으로 연락해요"
            >
              <div className="mb-[10px] flex flex-wrap gap-[8px]">
                {CONTACTS.map((c) => (
                  <Pill
                    key={c.type}
                    selected={form.contacts[c.type] !== undefined}
                    onClick={() => toggleContact(c.type)}
                  >
                    {c.label}
                  </Pill>
                ))}
              </div>
              <div className="flex flex-col gap-[8px]">
                {chosenContacts.map((c) => (
                  <input
                    key={c.type}
                    value={form.contacts[c.type] ?? ""}
                    onChange={(e) =>
                      set({ contacts: { ...form.contacts, [c.type]: e.target.value } })
                    }
                    placeholder={`${c.label} · ${c.placeholder}`}
                    aria-label={c.label}
                    inputMode={c.type === "PHONE" ? "tel" : "text"}
                    className="h-[48px] rounded-xl border border-gray-100 px-[14px] text-sm text-gray-900 outline-none focus:border-gray-900"
                  />
                ))}
              </div>
            </Field>

            <button
              type="button"
              onClick={() => setMore((v) => !v)}
              className="mb-[16px] flex w-full items-center justify-between border-b border-gray-50 py-[10px] text-sm text-gray-900"
            >
              <span>
                비슷하게 만든 케이크 사진 · 메모 <span className="text-xs text-gray-400">선택</span>
              </span>
              <Icon
                name="selectArrow"
                width={20}
                height={20}
                className={cn("transition-transform duration-base", more && "rotate-180")}
              />
            </button>
            {more && (
              <>
                <Field label="사진" optional={`${PHOTOS_MAX}장까지`}>
                  <div className="flex gap-[8px]">
                    {form.photos.map((url) => (
                      <div key={url} className="relative">
                        <img
                          src={url}
                          alt=""
                          className="h-[72px] w-[72px] rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          aria-label="사진 빼기"
                          onClick={() => set({ photos: form.photos.filter((p) => p !== url) })}
                          className="absolute -right-[6px] -top-[6px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-gray-900 text-white"
                        >
                          <Icon name="close" width={12} height={12} />
                        </button>
                      </div>
                    ))}
                    {form.photos.length < PHOTOS_MAX && (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex h-[72px] w-[72px] items-center justify-center rounded-lg border border-gray-100 text-gray-400"
                        aria-label="사진 넣기"
                      >
                        <Icon name="plus" width={20} height={20} />
                      </button>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(e) => void onPickPhotos(e.target.files)}
                    />
                  </div>
                </Field>
                <Field label="메모" optional="고를 수 있는 맛, 포함 사항 등">
                  <textarea
                    value={form.memo}
                    maxLength={MEMO_MAX}
                    onChange={(e) => set({ memo: e.target.value })}
                    rows={3}
                    aria-label="메모"
                    className="w-full resize-none rounded-xl border border-gray-100 px-[14px] py-[12px] text-sm text-gray-900 outline-none focus:border-gray-900"
                  />
                  <p className="mt-[4px] text-right text-xs text-gray-400">
                    {form.memo.length}/{MEMO_MAX}
                  </p>
                </Field>
              </>
            )}
            <p className="mb-[10px] text-xs text-gray-500">
              보내면 손님에게 가게 이름·견적·메모·주문 받는 곳이 보여요
            </p>
            {formError && <p className="mb-[10px] text-sm text-red-400">{formError}</p>}
          </section>
        )}

        {view.showEntryGuide && view.quote && (
          <section className="mb-[20px] rounded-xl bg-gray-50 px-[16px] py-[14px]">
            <p className="text-sm font-bold text-gray-900">다음부터는 Picake로 바로 받아 보세요</p>
            <p className="mt-[4px] text-xs leading-[18px] text-gray-700">
              근처 손님 요청에 견적만 보내면 돼요.{" "}
              {/* 초기 입점 혜택 약속 문장(기획 P-60 그대로, 바꾸지 않음) */}
              처음 상품 등록은 저희가 대신 해 드리고, 입점하신 날부터 1년 동안 이용료·수수료는
              0원이에요.
            </p>
            {/* 다른 사이트라 next/link가 아니라 a(소개 페이지는 info로 리다이렉트) */}
            <a
              href={PATHS.PARTNER_ABOUT}
              className="-mb-[10px] mt-[-2px] inline-block py-[10px] text-sm font-bold text-gray-900"
            >
              입점 알아보기 ›
            </a>
          </section>
        )}

        {view.threadId && <QuoteLinkChat token={token} open={view.chatOpen} />}
      </main>

      {showForm && (
        <div className="fixed bottom-0 left-0 right-0 z-10 mx-auto flex max-w-[638px] gap-[8px] bg-white px-[20px] pb-[12px] pt-[10px]">
          {!view.quote && !editing && (
            <span className="w-1/3">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => setDeclineOpen(true)}
              >
                어려워요
              </Button>
            </span>
          )}
          {(view.quote || editing) && (
            <span className="w-1/3">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => setEditing(false)}
              >
                취소
              </Button>
            </span>
          )}
          <span className="flex-1">
            <Button size="lg" className="w-full" loading={sending} onClick={() => void onSubmit()}>
              {sending ? "보내는 중…" : view.quote ? "고친 견적 보내기" : "이 견적 보내기"}
            </Button>
          </span>
        </div>
      )}

      <BottomSheet
        isOpen={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="어려운 이유를 골라 주세요"
      >
        <div className="flex flex-col px-[20px] pb-[20px]">
          {DECLINE.map((d) => (
            <button
              key={d.value}
              type="button"
              disabled={declining}
              onClick={() => void onDecline(d.value)}
              className="border-b border-gray-50 py-[14px] text-left text-sm text-gray-900 last:border-b-0"
            >
              {d.label}
            </button>
          ))}
          <p className="mt-[8px] text-xs text-gray-500">
            손님에게는 &ldquo;이번 요청은 어렵대요&rdquo;로만 보여요.
          </p>
        </div>
      </BottomSheet>
    </div>
  );
}
