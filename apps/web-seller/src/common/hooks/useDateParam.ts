import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { isDateKey } from "@/apps/web-seller/common/utils/kst-date.util";

/**
 * 고른 날을 주소(?date=YYYY-MM-DD)에도 둔다(홈 이번 주·캘린더, 기획 I-42): 주문 적기·상세에서 뒤로 오면 보던 날이
 * 그대로 열리게. 날짜를 고르면 주소도 바꾸되 뒤로 가기 기록은 늘리지 않고, 오늘을 고르면 ?date를 뺀다.
 * 없는 날짜(2026-02-30) 주소는 오늘로.
 * 주소는 라우터가 아니라 브라우저 기록만 바꾼다: 라우터로 바꾸면 PostHog 화면 보기(PostHogPageView는 search도 봄)가
 * 날짜를 누를 때마다 쌓인다(11-17 검토). 뒤로 오면 브라우저가 이 주소를 그대로 돌려줘 라우터가 읽는다.
 */
export function useDateParam(todayKey: string) {
  const [params] = useSearchParams();
  const dateParam = params.get("date");
  const [selectedKey, setSelectedKey] = useState(isDateKey(dateParam) ? dateParam : todayKey);
  const pickDay = useCallback(
    (key: string) => {
      setSelectedKey(key);
      const url = new URL(window.location.href);
      if (key === todayKey) url.searchParams.delete("date");
      else url.searchParams.set("date", key);
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    },
    [todayKey],
  );
  return { selectedKey, setSelectedKey, pickDay };
}
