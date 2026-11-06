import { describe, expect, it } from "vitest";
import { withEulReul } from "@/apps/web-seller/common/utils/josa.util";

describe("withEulReul", () => {
  it("받침이 있으면 을, 없으면 를", () => {
    expect(withEulReul("무화과 빵")).toBe("무화과 빵을");
    expect(withEulReul("초코 생크림 케이크")).toBe("초코 생크림 케이크를");
  });
  it("한글로 끝나지 않으면 을(를)", () => {
    expect(withEulReul("[E2E] 케이크 2")).toBe("[E2E] 케이크 2을(를)");
  });
});
