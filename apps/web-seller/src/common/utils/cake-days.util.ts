/**
 * 케이크 대목(기획 I-42): 주문이 몰리는 날을 달력 날짜 아래 작은 글씨로 알린다(홈 이번 주·캘린더·날짜 고르기 창).
 * 해마다 같은 날만(음력 명절은 케이크 대목이 아니라 넣지 않음). short는 칸 폭(약 48px)에 들어가는 이름
 */
const CAKE_DAYS: Record<string, { short: string; full: string }> = {
  "02-14": { short: "밸런타인", full: "밸런타인데이" },
  "03-14": { short: "화이트데이", full: "화이트데이" },
  "05-05": { short: "어린이날", full: "어린이날" },
  "05-08": { short: "어버이날", full: "어버이날" },
  "05-15": { short: "스승의날", full: "스승의날" },
  "12-24": { short: "이브", full: "크리스마스이브" },
  "12-25": { short: "성탄절", full: "크리스마스" },
  "12-31": { short: "연말", full: "연말" },
};

/** YYYY-MM-DD → 대목이면 이름 */
export function cakeDayOf(key: string): { short: string; full: string } | null {
  return CAKE_DAYS[key.slice(5)] ?? null;
}
