import { describe, expect, it } from "vitest";
import {
  NAV_EXPANDED_MIN_WIDTH_PX,
  PHONE_MAX_WIDTH_PX,
  TWO_PANE_MIN_WIDTH_PX,
  WIDE_MIN_WIDTH_PX,
  windowClassOf,
} from "./screen.constant";

describe("windowClassOf", () => {
  it("767까지는 휴대폰 화면", () => {
    expect(windowClassOf(320)).toBe("phone");
    expect(windowClassOf(390)).toBe("phone");
    expect(windowClassOf(PHONE_MAX_WIDTH_PX)).toBe("phone");
  });

  it("768~1199는 태블릿(아이콘 메뉴)", () => {
    expect(windowClassOf(768)).toBe("tablet");
    expect(windowClassOf(834)).toBe("tablet");
    expect(windowClassOf(1024)).toBe("tablet");
    expect(windowClassOf(NAV_EXPANDED_MIN_WIDTH_PX - 1)).toBe("tablet");
  });

  it("1200부터 PC, 1600부터 넓은 PC", () => {
    expect(windowClassOf(1200)).toBe("desktop");
    expect(windowClassOf(1440)).toBe("desktop");
    expect(windowClassOf(WIDE_MIN_WIDTH_PX)).toBe("wide");
    expect(windowClassOf(1920)).toBe("wide");
  });

  it("두 칸은 태블릿 구간 안에서 시작한다(840)", () => {
    expect(TWO_PANE_MIN_WIDTH_PX).toBeGreaterThan(PHONE_MAX_WIDTH_PX);
    expect(TWO_PANE_MIN_WIDTH_PX).toBeLessThan(NAV_EXPANDED_MIN_WIDTH_PX);
  });
});
