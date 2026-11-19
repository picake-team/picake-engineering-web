/**
 * 운영자 대신 입력 중(기획 I-41) 맨 위 고정 띠: "운영자 대신 입력 중 · 스토어 이름 · n분 남음 · 끝내기".
 * 대리 출입증이 있는 탭에만 그린다. 띠 높이만큼 화면을 내린다(`--act-as-band`, globals.css·위쪽 줄·알림 배너가 씀).
 * 시간이 다 되면 끝난 화면으로 간다(서버도 그때부터 401). 모양은 스낵바와 같은 검정 띠 + 주황 글자 버튼.
 */
import { useEffect, useLayoutEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import {
  ACT_AS_PATH,
  endActAsAndLeave,
  getActAsInfo,
  getActAsToken,
  remainingMinutes,
} from "@/apps/web-seller/common/utils/act-as.util";
import { actAsApi, finishActAs } from "@/apps/web-seller/features/act-as/apis/act-as.api";

/** 띠 높이(px, h-10) */
export const ACT_AS_BAND_HEIGHT = 40;

function ActAsBannerBar() {
  const info = getActAsInfo();
  const { data } = useQuery({
    queryKey: ["act-as", "me"],
    queryFn: actAsApi.me,
    staleTime: Infinity,
    retry: false,
  });
  const expiresAt = data?.expiresAt ?? info?.expiresAt ?? null;
  const [now, setNow] = useState(() => Date.now());
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(t);
  }, []);

  const minutes = expiresAt ? remainingMinutes(expiresAt, now) : null;
  useEffect(() => {
    if (minutes === 0) endActAsAndLeave();
  }, [minutes]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--act-as-band",
      `calc(${ACT_AS_BAND_HEIGHT}px + env(safe-area-inset-top))`,
    );
    return () => {
      root.style.removeProperty("--act-as-band");
    };
  }, []);

  const end = () => {
    if (ending) return;
    setEnding(true);
    void finishActAs();
  };

  return (
    <div
      role="region"
      aria-label="운영자 대신 입력 중"
      className="fixed inset-x-0 top-0 z-[70] bg-ink-900 pt-[env(safe-area-inset-top)] font-app text-white print:hidden"
    >
      <div className="mx-auto flex h-10 max-w-[1280px] items-center gap-2 pl-4 pr-1 text-sub">
        <span className="shrink-0 font-bold">운영자 대신 입력 중</span>
        {data?.storeName ? (
          <>
            <span aria-hidden className="shrink-0 text-ink-400">
              ·
            </span>
            <span className="min-w-0 truncate">{data.storeName}</span>
          </>
        ) : (
          <span className="min-w-0 flex-1" />
        )}
        <span className="ml-auto shrink-0 tabular-nums text-ink-200">
          {minutes === null ? "" : `${minutes}분 남음`}
        </span>
        <button
          type="button"
          onClick={end}
          disabled={ending}
          className="inline-flex h-10 shrink-0 items-center rounded-[8px] px-3 font-bold text-brand active:bg-white/10 disabled:text-ink-400"
        >
          {ending ? "끝내는 중…" : "끝내기"}
        </button>
      </div>
    </div>
  );
}

export function ActAsBanner() {
  const { pathname } = useLocation();
  // 들어오기·끝난 화면에는 띠를 그리지 않는다
  if (!getActAsToken() || pathname === ACT_AS_PATH || pathname.startsWith(`${ACT_AS_PATH}/`)) {
    return null;
  }
  return <ActAsBannerBar />;
}
