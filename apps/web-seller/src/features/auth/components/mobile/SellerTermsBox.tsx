/**
 * 회원가입 약관 동의 상자(디자인 8-C): 전체 동의 + [필수] 서비스 이용약관·개인정보 처리방침, "보기"는 창으로 문서를 연다.
 * 동의 상태·필수 검사는 PC `SellerTermsAgreementSection`과 같은 값을 쓴다.
 */
import { useState } from "react";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { TermsDocumentScreen } from "@/apps/web-seller/features/terms/components/TermsDocumentScreen";
import type { TermsType } from "@/apps/web-seller/features/terms/types/terms.dto";
import type { SellerTermsAgreementState } from "@/apps/web-seller/features/auth/components/SellerTermsAgreementSection";

const ITEMS: { key: keyof SellerTermsAgreementState; label: string; type: TermsType }[] = [
  { key: "termsOfService", label: "서비스 이용약관", type: "SELLER_TERMS_OF_SERVICE" },
  { key: "privacyPolicy", label: "개인정보 처리방침", type: "SELLER_PRIVACY_POLICY" },
];

function Box({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-flex size-[22px] shrink-0 items-center justify-center rounded-check",
        on ? "bg-brand text-white" : "border-[1.5px] border-ink-200 bg-white",
      )}
    >
      {on ? <Icon name="check" size={14} strokeWidth={3} /> : null}
    </span>
  );
}

export function SellerTermsBox({
  value,
  onChange,
}: {
  value: SellerTermsAgreementState;
  onChange: (next: SellerTermsAgreementState) => void;
}) {
  const [preview, setPreview] = useState<(typeof ITEMS)[number] | null>(null);
  const all = ITEMS.every((i) => value[i.key]);
  return (
    <div className="rounded-card border border-ink-100 px-4 py-2">
      <label className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-ink-100 text-body font-bold text-ink-900">
        <input
          type="checkbox"
          className="sr-only"
          checked={all}
          onChange={(e) =>
            onChange({ termsOfService: e.target.checked, privacyPolicy: e.target.checked })
          }
        />
        <Box on={all} />
        전체 동의
      </label>
      {ITEMS.map((i) => (
        <div key={i.key} className="flex min-h-11 items-center gap-3 text-sub text-ink-900">
          <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="sr-only"
              checked={value[i.key]}
              onChange={(e) => onChange({ ...value, [i.key]: e.target.checked })}
            />
            <Box on={value[i.key]} />
            <span className="flex-1">[필수] {i.label}</span>
          </label>
          <button
            type="button"
            onClick={() => setPreview(i)}
            className="inline-flex min-h-11 items-center px-1 text-ink-600"
            aria-label={`${i.label} 보기`}
          >
            보기
          </button>
        </div>
      ))}
      <BottomSheet
        open={preview !== null}
        onClose={() => setPreview(null)}
        showClose
        title={preview?.label ?? ""}
      >
        {preview ? (
          <div className="-mx-5 text-sub">
            <TermsDocumentScreen termsType={preview.type} />
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
}
