/**
 * 케이크 대목·기념일(기획 I-42): 주문이 몰리는 날을 달력 날짜 아래 작은 글씨로 알린다(홈 이번 주·캘린더·날짜 고르기 창).
 * short는 칸 폭(약 48px)에 들어가는 이름, full은 고른 날 제목 옆·주문 적기 날짜 아래에 쓰는 이름.
 */
type CakeDay = { short: string; full: string };

/** 해마다 같은 날(양력) */
const FIXED_DAYS: Record<string, CakeDay> = {
  "01-01": { short: "새해", full: "새해 첫날" },
  "02-14": { short: "밸런타인", full: "밸런타인데이" },
  "03-14": { short: "화이트데이", full: "화이트데이" },
  "05-05": { short: "어린이날", full: "어린이날" },
  "05-08": { short: "어버이날", full: "어버이날" },
  "05-15": { short: "스승의날", full: "스승의날" },
  "05-21": { short: "부부의날", full: "부부의날" },
  "10-31": { short: "할로윈", full: "할로윈" },
  "11-11": { short: "빼빼로", full: "빼빼로데이" },
  "12-24": { short: "이브", full: "크리스마스이브" },
  "12-25": { short: "성탄절", full: "크리스마스" },
  "12-31": { short: "연말", full: "연말" },
};

/**
 * 설날·추석(음력이라 해마다 다름). 한국천문연구원 달력 기준으로 확인한 날짜(2026-11-17).
 * 2031년부터는 여기에 더한다(없으면 그해 설날·추석만 안 보일 뿐 다른 날은 그대로)
 */
const LUNAR_DAYS: Record<string, CakeDay> = {
  "2026-02-17": { short: "설날", full: "설날" },
  "2026-09-25": { short: "추석", full: "추석" },
  "2027-02-07": { short: "설날", full: "설날" },
  "2027-09-15": { short: "추석", full: "추석" },
  "2028-01-27": { short: "설날", full: "설날" },
  "2028-10-03": { short: "추석", full: "추석" },
  "2029-02-13": { short: "설날", full: "설날" },
  "2029-09-22": { short: "추석", full: "추석" },
  "2030-02-03": { short: "설날", full: "설날" },
  "2030-09-12": { short: "추석", full: "추석" },
};

const COMING_OF_AGE: CakeDay = { short: "성년의날", full: "성년의날" };

/** 성년의날: 5월 셋째 월요일 */
function isComingOfAgeDay(key: string): boolean {
  if (key.slice(5, 7) !== "05") return false;
  const day = Number(key.slice(8, 10));
  const weekday = new Date(`${key}T00:00:00Z`).getUTCDay();
  return weekday === 1 && day >= 15 && day <= 21;
}

/** YYYY-MM-DD → 대목·기념일이면 이름 */
export function cakeDayOf(key: string): CakeDay | null {
  return (
    LUNAR_DAYS[key] ?? FIXED_DAYS[key.slice(5)] ?? (isComingOfAgeDay(key) ? COMING_OF_AGE : null)
  );
}
