import React from "react";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { useCreateDescriptionDraft } from "@/apps/web-seller/features/product/hooks/mutations/useProductNaverMutation";
import type { ProductDescriptionDraftResponseDto } from "@/apps/web-seller/features/product/types/product-naver.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import {
  buildOptionSummary,
  textToHtml,
} from "@/apps/web-seller/features/product/utils/naver-product.util";

/** AI가 판매자 확인을 부탁할 때 쓰는 표시 (서버와 같음) */
export const SELLER_CHECK_MARK = "[판매자 확인 필요]";

/** 패널 상태. 탭을 옮겨도 남도록 폼이 들고 있는다 */
export type AiDraftPanelState = {
  open: boolean;
  sourceText: string;
  sellerFacts: string;
  draft: ProductDescriptionDraftResponseDto | null;
};

export const initialAiDraftPanelState: AiDraftPanelState = {
  open: false,
  sourceText: "",
  sellerFacts: "",
  draft: null,
};

interface Props {
  storeId: string;
  form: ProductForm;
  state: AiDraftPanelState;
  onStateChange: (updater: (prev: AiDraftPanelState) => AiDraftPanelState) => void;
  onInsert: (html: string, how: "replace" | "append") => void;
}

const highlight = (text: string) =>
  text.split(SELLER_CHECK_MARK).flatMap((part, i, all) =>
    i < all.length - 1
      ? [
          part,
          <mark key={i} className="rounded bg-amber-100 px-1 text-amber-900">
            {SELLER_CHECK_MARK}
          </mark>,
        ]
      : [part],
  );

/**
 * 상품 상세설명 AI 초안 (I-43)
 * 네이버 설명·직접 확인한 사실·옵션만 근거로 초안을 만든다. 재료·알레르기·보관처럼 중요한 내용이 없으면
 * [판매자 확인 필요]로 남긴다. 넣은 뒤 판매자가 읽고 고쳐 확인해야 저장된다.
 */
export const ProductAiDescriptionDraft: React.FC<Props> = ({
  storeId,
  form,
  state,
  onStateChange,
  onInsert,
}) => {
  const draftMutation = useCreateDescriptionDraft();
  const { open, sourceText, sellerFacts, draft } = state;
  const patch = (p: Partial<AiDraftPanelState>) => onStateChange((prev) => ({ ...prev, ...p }));

  const optionSummary = buildOptionSummary(form);
  const canCreate = !!form.name.trim() && (!!sourceText.trim() || !!sellerFacts.trim());

  const handleCreate = async () => {
    const result = await draftMutation.mutateAsync({
      storeId,
      request: {
        productName: form.name.trim(),
        sourceText: sourceText.trim() || undefined,
        sellerFacts: sellerFacts.trim() || undefined,
        optionSummary: optionSummary || undefined,
      },
    });
    patch({ draft: result });
  };

  const draftHtml = draft ? textToHtml(draft.paragraphs.join("\n\n")) : "";

  return (
    <div className="mb-4 rounded-md border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => patch({ open: !open })}
        aria-expanded={open}
      >
        <span className="text-sm font-medium">AI로 상세정보 초안 만들기</span>
        <span className="text-xs text-muted-foreground">{open ? "접기" : "펼치기"}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            AI는 아래 자료에 있는 내용만 써요. 재료·알레르기·보관 방법처럼 중요한 내용이 자료에
            없으면 {SELLER_CHECK_MARK}로 남겨요. 넣은 뒤 꼭 읽고 고쳐 주세요.
          </p>

          <label className="block space-y-1">
            <span className="text-sm font-medium">참고 자료 (네이버 설명 등)</span>
            <textarea
              className="min-h-24 w-full rounded border bg-background p-2 text-sm"
              value={sourceText}
              maxLength={4000}
              onChange={(e) => patch({ sourceText: e.target.value })}
              placeholder="네이버에서 가져오면 자동으로 들어가요. 직접 붙여 넣어도 돼요."
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">직접 확인한 사실</span>
            <textarea
              className="min-h-20 w-full rounded border bg-background p-2 text-sm"
              value={sellerFacts}
              maxLength={2000}
              onChange={(e) => patch({ sellerFacts: e.target.value })}
              placeholder="예: 동물성 생크림·제철 무화과 사용 / 우유·밀·계란 포함 / 냉장 보관, 당일 드시는 걸 권장"
            />
          </label>

          {optionSummary && (
            <p className="whitespace-pre-line text-xs text-muted-foreground">
              함께 보내는 옵션 · {optionSummary}
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            disabled={!canCreate || draftMutation.isPending}
            onClick={handleCreate}
          >
            {draftMutation.isPending ? "만드는 중…" : draft ? "다시 만들기" : "초안 만들기"}
          </Button>
          {!form.name.trim() && (
            <p className="text-xs text-muted-foreground">
              기본 정보 탭에서 상품명을 먼저 적어 주세요.
            </p>
          )}

          {draft && (
            <div className="space-y-3 rounded-md bg-muted/50 p-3">
              <div className="space-y-2">
                {draft.paragraphs.map((p, i) => (
                  <p key={i} className="whitespace-pre-line text-sm">
                    {highlight(p)}
                  </p>
                ))}
              </div>
              {draft.questions.length > 0 && (
                <div>
                  <p className="text-xs font-medium">AI가 확인을 부탁한 것</p>
                  <ul className="mt-1 list-disc pl-4 space-y-0.5">
                    {draft.questions.map((q) => (
                      <li key={q} className="text-xs text-muted-foreground">
                        {q}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-xs text-muted-foreground">
                    답을 &apos;직접 확인한 사실&apos;에 적고 다시 만들면 더 정확해져요.
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => onInsert(draftHtml, "replace")}>
                  상세정보를 이 초안으로 바꾸기
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onInsert(draftHtml, "append")}
                >
                  상세정보 끝에 붙이기
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
