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

/** 은/는만 돌려준다(따옴표로 감싼 이름 뒤에 붙일 때: "'1호'는", "'초 추가'는") */
export function eunNeun(word: string): string {
  const b = lastHangulHasBatchim(word);
  if (b === null) return "은(는)";
  return b ? "은" : "는";
}

/** 으로/로만 돌려준다(받침이 없거나 ㄹ 받침이면 "로": "'케이크'로", "'딸기 롤'로", "'초코 맛'으로") */
export function euRo(word: string): string {
  const ch = word.trim().slice(-1);
  const b = lastHangulHasBatchim(word);
  if (b === null) return "(으)로";
  if (!b) return "로";
  return (ch.charCodeAt(0) - 0xac00) % 28 === 8 ? "로" : "으로";
}
