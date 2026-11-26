"use client";

import { useState } from "react";
import { Checkbox } from "@/apps/web-user/common/components/inputs/Checkbox";
import { Icon } from "@/apps/web-user/common/components/icons";
import { TermsPreviewBottomSheet } from "@/apps/web-user/features/terms/components/TermsPreviewBottomSheet";
import type { TermsType } from "@/apps/web-user/features/terms/types/terms.dto";

export interface TermsAgreementState {
  /** 만 14세 이상(약관 제5조, 법무 LG-02) — 문서가 없는 [필수] 항목, 서버에 agreedToAge14로 보낸다 */
  ageOver14: boolean;
  termsOfService: boolean;
  privacyPolicy: boolean;
  thirdPartyConsent: boolean;
  locationTerms: boolean;
}

export const INITIAL_TERMS_STATE: TermsAgreementState = {
  ageOver14: false,
  termsOfService: false,
  privacyPolicy: false,
  thirdPartyConsent: false,
  locationTerms: false,
};

export function isRequiredTermsAllChecked(state: TermsAgreementState): boolean {
  return state.ageOver14 && state.termsOfService && state.privacyPolicy && state.thirdPartyConsent;
}

interface TermsAgreementSectionProps {
  value: TermsAgreementState;
  onChange: (next: TermsAgreementState) => void;
}

interface TermsItem {
  key: keyof TermsAgreementState;
  label: string;
  required: boolean;
  /** 볼 문서가 없는 항목(만 14세 이상)은 비워 "›"를 그리지 않는다 */
  termsType?: TermsType;
}

const TERMS_ITEMS: TermsItem[] = [
  // 카카오계정 가입처럼 전체 동의 바로 아래 첫 줄(운영자 11-26)
  { key: "ageOver14", label: "만 14세 이상입니다", required: true },
  {
    key: "termsOfService",
    label: "서비스 이용약관",
    required: true,
    termsType: "CONSUMER_TERMS_OF_SERVICE",
  },
  {
    key: "privacyPolicy",
    label: "개인정보 처리방침",
    required: true,
    termsType: "CONSUMER_PRIVACY_POLICY",
  },
  {
    key: "thirdPartyConsent",
    label: "개인정보 제3자 제공 동의",
    required: true,
    termsType: "CONSUMER_THIRD_PARTY_CONSENT",
  },
  {
    key: "locationTerms",
    label: "위치기반서비스 이용약관",
    required: false,
    termsType: "CONSUMER_LOCATION_TERMS",
  },
];

export function TermsAgreementSection({ value, onChange }: TermsAgreementSectionProps) {
  const allChecked = TERMS_ITEMS.every((item) => value[item.key]);
  const [previewTerms, setPreviewTerms] = useState<TermsItem | null>(null);

  return (
    <div className="mt-8">
      {/* 구분선 */}
      <div className="h-px bg-gray-100 mb-5" />

      {/* 전체 동의 */}
      <Checkbox
        checked={allChecked}
        onChange={(checked) =>
          onChange({
            ageOver14: checked,
            termsOfService: checked,
            privacyPolicy: checked,
            thirdPartyConsent: checked,
            locationTerms: checked,
          })
        }
        label={<span className="font-bold">전체 동의</span>}
        className="mb-3"
      />

      {/* 구분선 */}

      {/* 개별 항목 */}
      <div className="flex flex-col gap-2">
        {TERMS_ITEMS.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <Checkbox
              checked={value[item.key]}
              onChange={(checked) => onChange({ ...value, [item.key]: checked })}
              label={
                <span>
                  <span className={item.required ? "text-primary mr-1" : "text-gray-400 mr-1"}>
                    {item.required ? "[필수]" : "[선택]"}
                  </span>
                  {item.label}
                </span>
              }
              className="flex-1 min-w-0"
            />
            {item.termsType ? (
              <button
                type="button"
                onClick={() => setPreviewTerms(item)}
                className="shrink-0 ml-2 p-1"
                aria-label={`${item.label} 보기`}
              >
                <Icon name="arrow" width={16} height={16} className="text-gray-400 rotate-90" />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {previewTerms?.termsType && (
        <TermsPreviewBottomSheet
          isOpen
          onClose={() => setPreviewTerms(null)}
          title={previewTerms.label}
          termsType={previewTerms.termsType}
        />
      )}
    </div>
  );
}
