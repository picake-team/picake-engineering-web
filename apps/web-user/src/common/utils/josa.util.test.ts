import { describe, expect, it } from "vitest";
import { withEulReul } from "@/apps/web-user/common/utils/josa.util";

describe("withEulReul", () => {
  it("받침에 맞춰 을/를", () => {
    expect(withEulReul("맛")).toBe("맛을");
    expect(withEulReul("사이즈")).toBe("사이즈를");
    expect(withEulReul("초 추가")).toBe("초 추가를");
    expect(withEulReul("Topping")).toBe("Topping를");
  });
});
