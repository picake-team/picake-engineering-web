import { describe, expect, it } from "vitest";
import type { StoreInfo } from "@/apps/web-user/features/store/types/store.type";
import {
  getMapBox,
  getStoresInMapBounds,
  isInMapBox,
  pickNearestInBox,
} from "@/apps/web-user/features/store/utils/map.util";

/** 카카오 map.getBounds() 모양만 흉내 낸 지도 */
function fakeMap(sw: [number, number], ne: [number, number]) {
  const point = ([lat, lng]: [number, number]) => ({ getLat: () => lat, getLng: () => lng });
  return { getBounds: () => ({ getSouthWest: () => point(sw), getNorthEast: () => point(ne) }) };
}

const store = (id: string, latitude: number, longitude: number) =>
  ({ id, latitude, longitude }) as unknown as StoreInfo;

describe("getMapBox", () => {
  it("지도 범위를 사각형으로, padRatio만큼 사방으로 넓힌다", () => {
    const map = fakeMap([37.0, 127.0], [37.2, 127.4]);
    expect(getMapBox(map)).toEqual({ minLat: 37.0, maxLat: 37.2, minLng: 127.0, maxLng: 127.4 });
    const padded = getMapBox(map, 0.5)!;
    expect(padded.minLat).toBeCloseTo(36.9);
    expect(padded.maxLat).toBeCloseTo(37.3);
    expect(padded.minLng).toBeCloseTo(126.8);
    expect(padded.maxLng).toBeCloseTo(127.6);
  });

  it("지도가 없으면 null", () => {
    expect(getMapBox(null)).toBeNull();
    expect(getMapBox({})).toBeNull();
  });
});

describe("getStoresInMapBounds", () => {
  const map = fakeMap([37.0, 127.0], [37.2, 127.2]);
  const inside = store("in", 37.1, 127.1);
  const justOutside = store("near", 37.25, 127.1);
  const farOutside = store("far", 38, 128);

  it("보이는 범위(0)는 안쪽만", () => {
    expect(getStoresInMapBounds(map, [inside, justOutside, farOutside]).map((s) => s.id)).toEqual([
      "in",
    ]);
  });

  it("넓혀서 미리 그릴 때는 둘레까지", () => {
    expect(
      getStoresInMapBounds(map, [inside, justOutside, farOutside], 0.5).map((s) => s.id),
    ).toEqual(["in", "near"]);
  });
});

describe("pickNearestInBox", () => {
  const box = { minLat: 37, maxLat: 38, minLng: 127, maxLng: 128 };
  const center = { lat: 37.5, lng: 127.5 };
  const at = (id: string, lat: number, lng: number) => ({ id, lat, lng });
  const get = (p: { lat: number; lng: number }) => p;

  it("사각형 안에서 가운데와 가까운 순으로 limit개", () => {
    const items = [
      at("far", 37.9, 127.9),
      at("outside", 36.5, 127.5),
      at("near", 37.51, 127.5),
      at("mid", 37.7, 127.5),
    ];
    expect(pickNearestInBox(items, get, box, center, 2).map((p) => p.id)).toEqual(["near", "mid"]);
  });

  it("경도 차이는 위도에 맞춰 줄여 잰다(서울에서 경도 1도는 위도 1도보다 짧다)", () => {
    const items = [at("east", 37.5, 127.6), at("north", 37.6, 127.5)];
    expect(pickNearestInBox(items, get, box, center, 1)[0].id).toBe("east");
  });

  it("좌표가 숫자가 아니면 뺀다", () => {
    expect(pickNearestInBox([at("bad", NaN, 127.5)], get, box, center, 5)).toEqual([]);
  });

  it("isInMapBox는 경계를 포함한다", () => {
    expect(isInMapBox(box, 37, 127)).toBe(true);
    expect(isInMapBox(box, 38.0001, 127.5)).toBe(false);
  });
});
