import { describe, expect, it } from "vitest";
import { euRo, eunNeun, withEulReul } from "@/apps/web-seller/common/utils/josa.util";

describe("withEulReul", () => {
  it("받침이 있으면 을, 없으면 를", () => {
    expect(withEulReul("무화과 빵")).toBe("무화과 빵을");
    expect(withEulReul("초코 생크림 케이크")).toBe("초코 생크림 케이크를");
  });
  it("한글로 끝나지 않으면 을(를)", () => {
    expect(withEulReul("[E2E] 케이크 2")).toBe("[E2E] 케이크 2을(를)");
  });
});

describe("eunNeun", () => {
  it("받침이 있으면 은, 없으면 는, 한글로 끝나지 않으면 은(는)", () => {
    expect(eunNeun("초 추가(큰 초)")).toBe("은(는)");
    expect(eunNeun("1호")).toBe("는");
    expect(eunNeun("레터링 문구")).toBe("는");
    expect(eunNeun("초코 맛")).toBe("은");
  });
});

describe("euRo", () => {
  it("받침이 없거나 ㄹ 받침이면 로, 다른 받침이면 으로", () => {
    expect(euRo("초코 무스 케이크")).toBe("로");
    expect(euRo("딸기 롤")).toBe("로");
    expect(euRo("초코 맛")).toBe("으로");
    expect(euRo("Cake")).toBe("(으)로");
  });
});
