import { describe, expect, it } from "vitest";

import { isSyntheticTraffic } from "./synthetic-traffic.util";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const LIGHTHOUSE_UA =
  "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36";

describe("isSyntheticTraffic", () => {
  it("일반 iOS·Android 사용자는 합성 접속이 아니다", () => {
    expect(isSyntheticTraffic(IPHONE_UA, false)).toBe(false);
    expect(isSyntheticTraffic(ANDROID_UA, false)).toBe(false);
  });

  it("Lighthouse(PageSpeed Insights) 모바일 가상 기기는 합성 접속이다", () => {
    expect(isSyntheticTraffic(LIGHTHOUSE_UA, false)).toBe(true);
  });

  it("기기 이름은 대소문자를 구분하지 않고 찾는다", () => {
    expect(isSyntheticTraffic(LIGHTHOUSE_UA.toUpperCase(), false)).toBe(true);
  });

  it("브라우저 자동화(webdriver)는 UA와 상관없이 합성 접속이다", () => {
    expect(isSyntheticTraffic(IPHONE_UA, true)).toBe(true);
  });

  it("비슷한 이름의 다른 기기는 합성 접속으로 보지 않는다", () => {
    const otherMoto = ANDROID_UA.replace("SM-S918N", "moto g power (2021)");

    expect(isSyntheticTraffic(otherMoto, false)).toBe(false);
  });
});
