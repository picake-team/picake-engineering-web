/**
 * 사람이 아닌(합성) 접속 판별
 *
 * 아래 접속은 PostHog가 봇으로 표시하지 않아 실제 방문자처럼 집계되고, 방문자가 적은 서비스에서는
 * 몇 건만으로도 방문자 수·기기 비율·웹 바이탈(p75)이 크게 왜곡된다. 그래서 분석 전송 자체를 막는다.
 * - 브라우저 자동화(Playwright·Selenium 등): `navigator.webdriver === true`
 * - 구글 PageSpeed Insights(Lighthouse) 모바일 가상 기기: UA에 `moto g power (2022)`
 *   (웹 성능 점검 루틴이 매일 이 기기로 접속한다)
 */
const LIGHTHOUSE_MOBILE_DEVICE_PATTERN = /moto g power \(2022\)/i;

export function isSyntheticTraffic(userAgent: string, isWebdriver: boolean): boolean {
  return isWebdriver || LIGHTHOUSE_MOBILE_DEVICE_PATTERN.test(userAgent);
}

/** 현재 브라우저가 합성 접속인지 (서버 렌더링 중에는 판단할 수 없어 false) */
export function isSyntheticBrowser(): boolean {
  if (typeof navigator === "undefined") return false;

  return isSyntheticTraffic(navigator.userAgent, navigator.webdriver === true);
}
