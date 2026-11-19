/** 상품 등록 중 손님 화면 미리보기 계산(PC에만, 기획 I-54) */
/** 상세 설명(편집기 HTML)을 글자만 */
export function descriptionText(html: string | undefined): string {
  if (!html) return "";
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent ?? "").replace(/\s+\n/g, "\n").trim();
  } catch {
    return html.replace(/<[^>]+>/g, " ").trim();
  }
}

/** 할인율(%) — 할인하지 않으면 0 */
export function discountRate(original?: number, sale?: number): number {
  if (!original || !sale || sale >= original) return 0;
  return Math.round(((original - sale) / original) * 100);
}
