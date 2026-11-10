import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { Dialog } from "@/apps/web-seller/common/components/dialogs/Dialog";
import { Textarea } from "@/apps/web-seller/common/components/textareas/Textarea";
import {
  FRAME_SUBMIT_BUTTON_CLASS,
  useInMobileFrame,
} from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { Button as AppButton } from "@/apps/web-seller/common/ui/Button";
import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { useCreateDescriptionDraft } from "@/apps/web-seller/features/product/hooks/mutations/useProductNaverMutation";
import type { ProductDescriptionDraftResponseDto } from "@/apps/web-seller/features/product/types/product-naver.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import {
  buildOptionSummary,
  textToHtml,
} from "@/apps/web-seller/features/product/utils/naver-product.util";
import { splitBySellerCheckMark } from "@/apps/web-seller/features/product/utils/ai-draft.util";

interface Props {
  open: boolean;
  onClose: () => void;
  storeId: string;
  form: ProductForm;
  /** 네이버에서 가져온 설명 (바뀌면 참고 자료에 넣는다) */
  sourceText: string;
  onInsert: (html: string, how: "replace" | "append") => void;
}

const highlight = (text: string, inFrame: boolean) =>
  splitBySellerCheckMark(text).map((part, i) =>
    part.isMark ? (
      <mark
        key={i}
        className={
          inFrame
            ? // 휴대폰 틀 안: 노란 칸 대신 앱 경고 글씨(#B5401C 굵게)
              "bg-transparent font-semibold text-brand-ink"
            : "rounded bg-amber-100 px-1 text-amber-900"
        }
      >
        {part.text}
      </mark>
    ) : (
      <React.Fragment key={i}>{part.text}</React.Fragment>
    ),
  );

/**
 * 상세 설명 AI 초안 (I-43). 자료 적기 → 초안 보기 → 넣기 세 단계가 한 창에서 끝난다.
 * AI는 적어 준 내용만 쓰고, 모르는 중요한 정보는 [판매자 확인 필요]로 남긴다(남아 있으면 저장되지 않음).
 * 창을 닫았다 열어도 적은 내용과 초안은 남는다.
 */
export function AiDescriptionDialog({ open, onClose, storeId, form, sourceText, onInsert }: Props) {
  const inFrame = useInMobileFrame();
  const draftMutation = useCreateDescriptionDraft();
  const [source, setSource] = useState(sourceText);
  const [facts, setFacts] = useState("");
  const [draft, setDraft] = useState<ProductDescriptionDraftResponseDto | null>(null);

  useEffect(() => {
    if (sourceText) setSource(sourceText);
  }, [sourceText]);

  const optionSummary = buildOptionSummary(form);
  const canCreate = !!form.name.trim() && (!!source.trim() || !!facts.trim());

  const create = async () => {
    try {
      const result = await draftMutation.mutateAsync({
        storeId,
        request: {
          productName: form.name.trim(),
          sourceText: source.trim() || undefined,
          sellerFacts: facts.trim() || undefined,
          optionSummary: optionSummary || undefined,
        },
      });
      setDraft(result);
    } catch {
      // 오류 알림은 mutation이 띄운다
    }
  };

  const insert = (how: "replace" | "append") => {
    if (!draft) return;
    onInsert(textToHtml(draft.paragraphs.join("\n\n")), how);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="AI로 상세 설명 쓰기"
      description="적어 주신 내용만 써요. 재료·알레르기·보관처럼 모르는 건 [판매자 확인 필요]로 남겨요."
      footer={
        inFrame ? (
          // 휴대폰 틀 안: 앱 창 버튼 줄(가득 찬 48, 흰 보조 | 주황 주 버튼, 약한 행동은 회색 글자)
          draft ? (
            <div className="flex flex-col gap-1">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={FRAME_SUBMIT_BUTTON_CLASS}
                  onClick={() => insert("append")}
                >
                  끝에 붙이기
                </Button>
                <Button
                  type="button"
                  className={cn(FRAME_SUBMIT_BUTTON_CLASS, "flex-[2]")}
                  onClick={() => insert("replace")}
                >
                  이 초안으로 바꾸기
                </Button>
              </div>
              <AppButton
                variant="quiet"
                className="self-center"
                onClick={create}
                disabled={!canCreate || draftMutation.isPending}
              >
                {draftMutation.isPending ? "다시 쓰는 중…" : "다시 쓰기"}
              </AppButton>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {!form.name.trim() && (
                <p className="font-app text-caption font-semibold text-brand-ink">
                  상품명을 먼저 적어 주세요.
                </p>
              )}
              <Button
                type="button"
                className={cn(FRAME_SUBMIT_BUTTON_CLASS, "w-full")}
                onClick={create}
                disabled={!canCreate || draftMutation.isPending}
              >
                {draftMutation.isPending ? "쓰는 중…" : "초안 만들기"}
              </Button>
            </div>
          )
        ) : draft ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={create}
              disabled={!canCreate || draftMutation.isPending}
            >
              {draftMutation.isPending ? "다시 쓰는 중…" : "다시 쓰기"}
            </Button>
            <Button type="button" variant="outline" onClick={() => insert("append")}>
              지금 설명 끝에 붙이기
            </Button>
            <Button type="button" onClick={() => insert("replace")}>
              이 초안으로 바꾸기
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            {!form.name.trim() && (
              <p className="mr-auto text-xs text-muted-foreground">상품명을 먼저 적어 주세요.</p>
            )}
            <Button type="button" onClick={create} disabled={!canCreate || draftMutation.isPending}>
              <Sparkles className="h-4 w-4" />
              {draftMutation.isPending ? "쓰는 중…" : "초안 만들기"}
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-4">
        <label className={inFrame ? "flex flex-col gap-2" : "block space-y-1"}>
          <span
            className={inFrame ? "font-app text-sub font-bold text-ink-700" : "text-sm font-medium"}
          >
            참고할 글
          </span>
          <Textarea
            rows={4}
            className={inFrame ? undefined : "min-h-24 p-2"}
            value={source}
            maxLength={4000}
            onChange={(e) => setSource(e.target.value)}
            placeholder="네이버 설명이나 인스타 글을 붙여 넣으세요. 네이버에서 가져오면 자동으로 들어가요."
          />
        </label>
        <label className={inFrame ? "flex flex-col gap-2" : "block space-y-1"}>
          <span
            className={inFrame ? "font-app text-sub font-bold text-ink-700" : "text-sm font-medium"}
          >
            사장님이 확인한 사실
          </span>
          <Textarea
            rows={3}
            className={inFrame ? undefined : "min-h-20 p-2"}
            value={facts}
            maxLength={2000}
            onChange={(e) => setFacts(e.target.value)}
            placeholder="예: 동물성 생크림, 제철 무화과 / 우유·밀·계란 포함 / 냉장 보관, 당일 드시는 걸 권장"
          />
        </label>
        {optionSummary && (
          <p
            className={
              inFrame
                ? "whitespace-pre-line font-app text-caption text-ink-600"
                : "whitespace-pre-line text-xs text-muted-foreground"
            }
          >
            사이즈·맛도 함께 보내요 · {optionSummary.replace(/\n/g, " · ")}
          </p>
        )}

        {draft && (
          <div
            className={
              inFrame
                ? "flex flex-col gap-3 rounded-card bg-ink-50 p-4 font-app"
                : "space-y-3 rounded-lg border bg-muted/30 p-4"
            }
          >
            <p
              className={
                inFrame
                  ? "text-caption font-bold text-ink-600"
                  : "text-xs font-medium text-muted-foreground"
              }
            >
              초안
            </p>
            {draft.paragraphs.map((p, i) => (
              <p
                key={i}
                className={
                  inFrame
                    ? "whitespace-pre-line text-body leading-normal text-ink-900"
                    : "whitespace-pre-line text-sm"
                }
              >
                {highlight(p, inFrame)}
              </p>
            ))}
            {draft.questions.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-medium">알려 주시면 더 정확해져요</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {draft.questions.map((q) => (
                    <li key={q} className="text-xs text-muted-foreground">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
