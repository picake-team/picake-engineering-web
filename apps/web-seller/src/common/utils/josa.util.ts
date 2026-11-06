/**
 * 한국어 조사 고르기("초코 케이크를", "무화과 빵을"). 마지막 글자가 한글이 아니면 둘 다 쓴다("ABC을(를)").
 */
function lastHangulHasBatchim(word: string): boolean | null {
  const ch = word.trim().slice(-1);
  if (!ch) return null;
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return null;
  return (code - 0xac00) % 28 !== 0;
}

/** 을/를 */
export function withEulReul(word: string): string {
  const b = lastHangulHasBatchim(word);
  if (b === null) return `${word}을(를)`;
  return `${word}${b ? "을" : "를"}`;
}
