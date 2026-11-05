/** AI가 판매자 확인을 부탁할 때 쓰는 표시 (서버와 같음) */
export const SELLER_CHECK_MARK = "[판매자 확인 필요]";

/**
 * 표시 찾기: "[판매자 확인 필요]"와 "[판매자 확인 필요: 소비기한]" 둘 다 잡는다.
 * 상세정보에 하나라도 남아 있으면 저장을 막는다.
 */
const PATTERN_SOURCE = "\\[\\s*판매자\\s*확인\\s*필요[^\\]]*\\]";

export const hasSellerCheckMark = (text: string | null | undefined) =>
  !!text && new RegExp(PATTERN_SOURCE).test(text);

/** 강조 표시용: 글을 표시 부분과 나머지로 나눈다 */
export function splitBySellerCheckMark(text: string): { text: string; isMark: boolean }[] {
  const parts: { text: string; isMark: boolean }[] = [];
  const re = new RegExp(PATTERN_SOURCE, "g");
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) parts.push({ text: text.slice(last, m.index), isMark: false });
    parts.push({ text: m[0], isMark: true });
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), isMark: false });
  return parts;
}
