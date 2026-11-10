import { describe, expect, it } from "vitest";
import {
  isChunkLoadError,
  shouldReloadForChunk,
} from "@/apps/web-seller/common/utils/chunk-reload.util";

describe("화면 조각을 못 받았을 때", () => {
  it("브라우저마다 다른 조각 실패 글을 알아본다", () => {
    expect(
      isChunkLoadError(
        new TypeError(
          "Failed to fetch dynamically imported module: https://seller.picakes.com/assets/Detail-abc.js",
        ),
      ),
    ).toBe(true);
    expect(isChunkLoadError(new TypeError("Importing a module script failed."))).toBe(true); // 사파리
    expect(isChunkLoadError(new Error("error loading dynamically imported module"))).toBe(true); // 파이어폭스
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });

  it("인터넷이 되고 10초 안에 새로고침한 적이 없을 때만 새로고침", () => {
    expect(shouldReloadForChunk(100_000, null, true)).toBe(true);
    expect(shouldReloadForChunk(100_000, 95_000, true)).toBe(false); // 방금 했는데 또 실패
    expect(shouldReloadForChunk(100_000, 80_000, true)).toBe(true);
    expect(shouldReloadForChunk(100_000, null, false)).toBe(false); // 끊김
  });
});
