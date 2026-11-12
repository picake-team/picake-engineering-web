/**
 * 날짜를 상대 시간 문자열로 포맷팅
 *
 * @param date - 포맷팅할 날짜 (Date 객체 또는 null)
 * @returns 상대 시간 문자열 (예: "방금 전", "5분 전", "2시간 전", "3일 전", 또는 날짜 문자열)
 *
 * @example
 * formatRelativeTime(new Date()) // "방금 전"
 * formatRelativeTime(new Date(Date.now() - 5 * 60000)) // "5분 전"
 * formatRelativeTime(new Date(Date.now() - 2 * 3600000)) // "2시간 전"
 */
export const formatRelativeTime = (date: Date | null): string => {
  if (!date) return "";
  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now.getTime() - messageDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  // "10월 3일", 올해가 아니면 "2025년 12월 24일"(서울 기준, 방 안 날짜 줄과 같은 말)
  const seoul = (d: Date) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(d);
    const get = (t: string) => Number(parts.find((x) => x.type === t)?.value ?? 0);
    return { y: get("year"), m: get("month"), d: get("day") };
  };
  const t = seoul(messageDate);
  return `${t.y === seoul(now).y ? "" : `${t.y}년 `}${t.m}월 ${t.d}일`;
};

/**
 * 날짜를 시간 문자열로 포맷팅 (HH:mm 형식)
 *
 * @param date - 포맷팅할 날짜 (Date 객체 또는 string)
 * @returns 시간 문자열 (예: "14:30", "09:05")
 *
 * @example
 * formatTime(new Date()) // "14:30"
 * formatTime("2024-01-01T14:30:00.000Z") // "14:30"
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * 날짜를 점 구분 문자열로 포맷팅 (YYYY.MM.DD 형식)
 *
 * @param date - 포맷팅할 날짜 (Date 객체 또는 ISO 문자열)
 * @returns 날짜 문자열 (예: "2024.01.05")
 *
 * @example
 * formatDateDot(new Date()) // "2024.01.05"
 * formatDateDot("2024-01-05T12:00:00.000Z") // "2024.01.05"
 */
export const formatDateDot = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}.${String(m).padStart(2, "0")}.${String(day).padStart(2, "0")}`;
};
