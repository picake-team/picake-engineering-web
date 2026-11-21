import { describe, expect, it } from "vitest";
import { headingBucket, userLocationMarkerSvg } from "./user-location-marker.util";

describe("headingBucket", () => {
  it("방향이 없으면 null(점만)", () => {
    expect(headingBucket(null)).toBeNull();
    expect(headingBucket(Number.NaN)).toBeNull();
  });

  it("5° 단위로 반올림하고 0~355로 맞춘다", () => {
    expect(headingBucket(32)).toBe(30);
    expect(headingBucket(33)).toBe(35);
    expect(headingBucket(358)).toBe(0);
    expect(headingBucket(-10)).toBe(350);
    expect(headingBucket(725)).toBe(5);
  });
});

describe("userLocationMarkerSvg", () => {
  it("방향이 없으면 삼각형 없이 점만", () => {
    expect(userLocationMarkerSvg(null)).not.toContain("rotate(");
  });

  it("방향이 있으면 점 바깥 삼각형을 그 각도로 돌린다", () => {
    expect(userLocationMarkerSvg(30)).toContain("rotate(30 22 22)");
  });
});
