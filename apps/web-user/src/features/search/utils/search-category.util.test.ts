import { describe, expect, it } from "vitest";
import { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";
import { readSearchCategory } from "@/apps/web-user/features/search/utils/search-category.util";

describe("readSearchCategory", () => {
  it("필터 유형에 있는 값은 그대로 읽는다", () => {
    expect(readSearchCategory("BIRTHDAY")).toBe(ProductCategoryType.BIRTHDAY);
    expect(readSearchCategory("SAME_DAY_PICKUP")).toBe(ProductCategoryType.SAME_DAY_PICKUP);
  });

  it("값이 없으면 없는 것으로 본다", () => {
    expect(readSearchCategory(null)).toBeUndefined();
    expect(readSearchCategory(undefined)).toBeUndefined();
    expect(readSearchCategory("")).toBeUndefined();
  });

  it("모르는 값이나 필터에서 뺀 커스텀은 받지 않는다", () => {
    expect(readSearchCategory("birthday")).toBeUndefined();
    expect(readSearchCategory("WORK")).toBeUndefined();
    expect(readSearchCategory(ProductCategoryType.LETTERING)).toBeUndefined();
  });
});
