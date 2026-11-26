import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Checkbox } from "@/apps/web-seller/common/components/inputs/Checkbox";
import { TermsPreviewDialog } from "@/apps/web-seller/features/terms/components/TermsPreviewDialog";
import type { TermsType } from "@/apps/web-seller/features/terms/types/terms.dto";
import { cn } from "@/apps/web-seller/common/utils/classname.util";

export interface SellerTermsAgreementState {
  /** 만 14세 이상(판매자 약관 제5조, 법무 LG-02) — 문서가 없는 [필수] 항목, 서버에 agreedToAge14로 보낸다 */
  ageOver14: boolean;
  termsOfService: boolean;
  privacyPolicy: boolean;
}

export const INITIAL_SELLER_TERMS_STATE: SellerTermsAgreementState = {
  ageOver14: false,
  termsOfService: false,
  privacyPolicy: false,
};

export function isRequiredSellerTermsAllChecked(state: SellerTermsAgreementState): boolean {
  return state.ageOver14 && state.termsOfService && state.privacyPolicy;
}

interface SellerTermsAgreementSectionProps {
  value: SellerTermsAgreementState;
  onChange: (next: SellerTermsAgreementState) => void;
}

interface TermsItem {
  key: keyof SellerTermsAgreementState;
  label: string;
  /** 볼 문서가 없는 항목(만 14세 이상)은 비워 "›"를 그리지 않는다 */
  termsType?: TermsType;
}

const TERMS_ITEMS: TermsItem[] = [
  { key: "ageOver14", label: "만 14세 이상입니다" },
  {
    key: "termsOfService",
    label: "서비스 이용약관",
    termsType: "SELLER_TERMS_OF_SERVICE",
  },
  {
    key: "privacyPolicy",
    label: "개인정보 처리방침",
    termsType: "SELLER_PRIVACY_POLICY",
  },
];

const TERMS_ROW_CLASS = "flex min-h-7 items-center justify-between gap-1.5";
const TERMS_LINK_SLOT_CLASS = "flex size-6 shrink-0 items-center justify-center";

export function SellerTermsAgreementSection({ value, onChange }: SellerTermsAgreementSectionProps) {
  const allChecked = TERMS_ITEMS.every((item) => value[item.key]);
  const [previewTerms, setPreviewTerms] = useState<TermsItem | null>(null);

  return (
    <div className="border-t border-zinc-100 pt-4">
      <p className="mb-2 text-sm font-medium text-zinc-900">약관 동의</p>

      <div className="flex flex-col gap-1">
        <div className={TERMS_ROW_CLASS}>
          <Checkbox
            checked={allChecked}
            onChange={(checked) =>
              onChange({
                ageOver14: checked,
                termsOfService: checked,
                privacyPolicy: checked,
              })
            }
            label={<span className="font-medium">전체 동의</span>}
            className="min-w-0 flex-1"
          />
          <span className={cn(TERMS_LINK_SLOT_CLASS, "invisible")} aria-hidden>
            <ChevronRight className="size-4" />
          </span>
        </div>

        {TERMS_ITEMS.map((item) => (
          <div key={item.key} className={TERMS_ROW_CLASS}>
            <Checkbox
              checked={value[item.key]}
              onChange={(checked) => onChange({ ...value, [item.key]: checked })}
              label={
                <>
                  <span className="mr-1">[필수]</span>
                  {item.label}
                </>
              }
              className="min-w-0 flex-1"
            />
            {item.termsType ? (
              <button
                type="button"
                onClick={() => setPreviewTerms(item)}
                className={cn(TERMS_LINK_SLOT_CLASS, "text-zinc-400 hover:text-zinc-700")}
                aria-label={`${item.label} 보기`}
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            ) : (
              <span className={TERMS_LINK_SLOT_CLASS} aria-hidden />
            )}
          </div>
        ))}
      </div>

      {previewTerms?.termsType && (
        <TermsPreviewDialog
          open
          onClose={() => setPreviewTerms(null)}
          title={previewTerms.label}
          termsType={previewTerms.termsType}
        />
      )}
    </div>
  );
}
