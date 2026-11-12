/**
 * 사장님 견적 링크(/q/열쇠, 기획 I-46 SC-19)의 열쇠는 그 가게로서 견적을 보내고 손님과 대화하는 권한이다.
 * 분석(PostHog)·오류(Sentry) 기록에 주소째 남지 않게 열쇠 자리를 지운다(11-12 검토).
 * 화면 주소 `/q/열쇠`와 그 화면이 부르는 API `/quote-links/열쇠` 둘 다.
 */
const LINK_TOKEN_PATTERNS: [RegExp, string][] = [
  [/\/q\/[A-Za-z0-9_-]+/g, "/q/[token]"],
  [/\/quote-links\/[A-Za-z0-9_-]+/g, "/quote-links/[token]"],
];

export function scrubLinkToken(value: string): string {
  let out = value;
  for (const [re, to] of LINK_TOKEN_PATTERNS) out = out.replace(re, to);
  return out;
}

/** 지금 화면이 견적 링크인지(녹화를 멈출 때) */
export function isQuoteLinkPath(pathname: string): boolean {
  return /^\/q\//.test(pathname);
}
