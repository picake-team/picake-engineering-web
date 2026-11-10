/** 받침이 있는 글자인지(한글이 아니면 받침 없음으로 본다) */
function hasBatchim(word: string): boolean {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return false;
  return code % 28 !== 0;
}

/** "맛을", "사이즈를" — 이름 뒤 을/를을 받침에 맞춰 붙인다("을(를)" 대신) */
export function withEulReul(word: string): string {
  return `${word}${hasBatchim(word) ? "을" : "를"}`;
}
