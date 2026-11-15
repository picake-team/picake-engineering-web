"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ReviewLoginBottomSheet } from "@/apps/web-user/features/auth/components/ReviewLoginBottomSheet";

const APP_VERSION = "0.0.1";

/** 이 횟수만큼 연속으로 탭하면 심사용 로그인 진입점이 열림 */
const REVIEW_LOGIN_TAP_THRESHOLD = 10;
/** 탭 사이 간격이 이보다 벌어지면 탭 카운트를 리셋 */
const REVIEW_LOGIN_TAP_RESET_MS = 2000;

/**
 * 임시: "웹 버전"을 이 횟수만큼 연속으로 누르면 홈 새 화면 시안(/preview/home)으로 간다.
 * 운영자가 실제 앱에서 시안을 보려고(11-15). 시안을 홈으로 옮길 때 같이 지운다
 */
const HOME_PREVIEW_TAP_THRESHOLD = 7;
const HOME_PREVIEW_PATH = "/preview/home";

/** 짧은 간격으로 threshold번 누르면 onReach를 부른다 */
function useTapCounter(threshold: number, onReach: () => void) {
  const countRef = useRef(0);
  const lastAtRef = useRef(0);
  return () => {
    const now = Date.now();
    if (now - lastAtRef.current > REVIEW_LOGIN_TAP_RESET_MS) countRef.current = 0;
    lastAtRef.current = now;
    countRef.current += 1;
    if (countRef.current >= threshold) {
      countRef.current = 0;
      onReach();
    }
  };
}

interface VersionInfoRowProps {
  label: string;
  value: string;
  onLabelClick?: () => void;
}

function VersionInfoRow({ label, value, onLabelClick }: VersionInfoRowProps) {
  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <div className="flex items-center justify-between gap-4">
        <span
          className="text-sm font-bold text-gray-900 shrink-0 select-none"
          onClick={onLabelClick}
        >
          {label}
        </span>
        <span className="text-sm text-gray-700 text-right break-all font-mono">{value}</span>
      </div>
    </div>
  );
}

function formatBuildNumber(commitSha: string | undefined): string {
  const sha = commitSha?.trim();
  if (!sha) return "—";
  return sha.slice(0, 7);
}

export function VersionInfoScreen() {
  const buildNumber = formatBuildNumber(process.env.NEXT_PUBLIC_GITHUB_SHA);
  const router = useRouter();
  const [isReviewLoginOpen, setIsReviewLoginOpen] = useState(false);
  const handleVersionLabelClick = useTapCounter(REVIEW_LOGIN_TAP_THRESHOLD, () =>
    setIsReviewLoginOpen(true),
  );
  const handleWebVersionLabelClick = useTapCounter(HOME_PREVIEW_TAP_THRESHOLD, () =>
    router.push(HOME_PREVIEW_PATH),
  );

  return (
    <div className="pt-4 pb-10">
      <VersionInfoRow label="앱 버전" value={APP_VERSION} onLabelClick={handleVersionLabelClick} />
      <VersionInfoRow
        label="웹 버전"
        value={buildNumber}
        onLabelClick={handleWebVersionLabelClick}
      />
      <ReviewLoginBottomSheet
        isOpen={isReviewLoginOpen}
        onClose={() => setIsReviewLoginOpen(false)}
      />
    </div>
  );
}
