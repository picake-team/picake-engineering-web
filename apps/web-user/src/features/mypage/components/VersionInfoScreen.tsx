"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { appVersion } from "@/apps/web-user/common/utils/webview.bridge";
import { ReviewLoginBottomSheet } from "@/apps/web-user/features/auth/components/ReviewLoginBottomSheet";

/** 앱 버전은 앱이 넣는 값이라 바뀌지 않는다(구독할 것이 없음) */
function subscribeNothing(): () => void {
  return () => {};
}

/** 서버 렌더에는 앱이 없다. 첫 화면 맞추기(hydration) 뒤 앱 값으로 바뀐다 */
function noAppVersion(): string | null {
  return null;
}

/** 이 횟수만큼 연속으로 탭하면 심사용 로그인 진입점이 열림 */
const REVIEW_LOGIN_TAP_THRESHOLD = 10;
/** 탭 사이 간격이 이보다 벌어지면 탭 카운트를 리셋 */
const REVIEW_LOGIN_TAP_RESET_MS = 2000;

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
  // 앱이 알려 준 버전(앱 레포 version.json). 브라우저로 열면 앱이 없어 "—"
  const installedAppVersion = useSyncExternalStore(subscribeNothing, appVersion, noAppVersion);
  const buildNumber = formatBuildNumber(process.env.NEXT_PUBLIC_GITHUB_SHA);
  const [isReviewLoginOpen, setIsReviewLoginOpen] = useState(false);
  const tapCountRef = useRef(0);
  const lastTapAtRef = useRef(0);

  const handleVersionLabelClick = () => {
    const now = Date.now();
    if (now - lastTapAtRef.current > REVIEW_LOGIN_TAP_RESET_MS) {
      tapCountRef.current = 0;
    }
    lastTapAtRef.current = now;
    tapCountRef.current += 1;

    if (tapCountRef.current >= REVIEW_LOGIN_TAP_THRESHOLD) {
      tapCountRef.current = 0;
      setIsReviewLoginOpen(true);
    }
  };

  return (
    <div className="pt-4 pb-10">
      <VersionInfoRow
        label="앱 버전"
        value={installedAppVersion ?? "—"}
        onLabelClick={handleVersionLabelClick}
      />
      <VersionInfoRow label="웹 버전" value={buildNumber} />
      <ReviewLoginBottomSheet
        isOpen={isReviewLoginOpen}
        onClose={() => setIsReviewLoginOpen(false)}
      />
    </div>
  );
}
