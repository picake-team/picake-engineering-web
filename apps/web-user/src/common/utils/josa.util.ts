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

/** "구름베이커리와", "솜사탕케이크과" 대신 받침에 맞춰 와/과 */
export function withWaGwa(word: string): string {
  return `${word}${hasBatchim(word) ? "과" : "와"}`;
}

/** "구름베이커리로", "케이크샵으로"(ㄹ 받침은 "로") */
export function withRo(word: string): string {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return `${word}로`;
  const jong = code % 28;
  return `${word}${jong === 0 || jong === 8 ? "로" : "으로"}`;
}
