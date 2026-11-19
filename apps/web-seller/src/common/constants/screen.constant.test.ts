import { describe, expect, it } from "vitest";
import {
  NAV_EXPANDED_MIN_WIDTH_PX,
  PHONE_MAX_WIDTH_PX,
  TWO_PANE_MIN_WIDTH_PX,
} from "./screen.constant";

// tailwind md·split·nav는 tailwind.config.ts가 이 상수를 가져다 쓴다(값이 갈라지지 않는다)
describe("화면 폭 구간(기획 I-54)", () => {
  it("휴대폰 화면 → PC 틀(아이콘 메뉴) → 두 칸 → 이름 메뉴 순서", () => {
    expect(PHONE_MAX_WIDTH_PX).toBe(767);
    expect(TWO_PANE_MIN_WIDTH_PX).toBeGreaterThan(PHONE_MAX_WIDTH_PX);
    expect(TWO_PANE_MIN_WIDTH_PX).toBeLessThan(NAV_EXPANDED_MIN_WIDTH_PX);
  });
});
