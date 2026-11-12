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

describe("와/과·로/으로", () => {
  it("받침에 맞춰 붙인다(ㄹ 받침은 로)", async () => {
    const { withWaGwa, withRo } = await import("./josa.util");
    expect(withWaGwa("구름베이커리")).toBe("구름베이커리와");
    expect(withWaGwa("케이크샵")).toBe("케이크샵과");
    expect(withRo("구름베이커리")).toBe("구름베이커리로");
    expect(withRo("케이크샵")).toBe("케이크샵으로");
    expect(withRo("달콤한 마을")).toBe("달콤한 마을로");
  });
});
