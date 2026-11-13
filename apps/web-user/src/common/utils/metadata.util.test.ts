import { describe, expect, it } from "vitest";
import { buildNotFoundMetadata } from "@/apps/web-user/common/utils/metadata.util";

describe("buildNotFoundMetadata", () => {
  it("없는 상품·가게 주소는 검색에 남지 않게 막는다", () => {
    const meta = buildNotFoundMetadata("상품을 찾을 수 없어요");
    expect(meta.title).toBe("상품을 찾을 수 없어요");
    expect(meta.robots).toEqual({ index: false, follow: false });
  });
});
