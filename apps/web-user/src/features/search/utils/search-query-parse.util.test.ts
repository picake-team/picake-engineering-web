import { describe, expect, it } from "vitest";
import { ProductCategoryType as C } from "@/apps/web-user/features/product/types/product.type";
import {
  mergeSearchFilters,
  parseSearchQuery,
  splitSheetFilter,
} from "@/apps/web-user/features/search/utils/search-query-parse.util";

describe("parseSearchQuery", () => {
  it("카테고리·크기·가격을 알아듣고 남은 말만 검색어로", () => {
    expect(parseSearchQuery("생일 레터링 1호 3만원 이하")).toEqual({
      keyword: "",
      filter: { productCategoryTypes: [C.BIRTHDAY, C.LETTERING], sizes: ["1호"], maxPrice: 30000 },
    });
    expect(parseSearchQuery("엄마 생신 꽃 케이크")).toEqual({
      keyword: "",
      filter: { productCategoryTypes: [C.THANKS, C.BIRTHDAY, C.FLOWER] },
    });
    expect(parseSearchQuery("초코 도시락케이크")).toEqual({
      keyword: "초코",
      filter: { sizes: ["도시락"] },
    });
  });

  it("가격 말 여러 모양", () => {
    expect(parseSearchQuery("레터링 2~3만원").filter).toMatchObject({
      minPrice: 20000,
      maxPrice: 30000,
    });
    expect(parseSearchQuery("레터링 5만원대").filter).toMatchObject({
      minPrice: 50000,
      maxPrice: 60000,
    });
    expect(parseSearchQuery("레터링 3만원 이상").filter).toMatchObject({ minPrice: 30000 });
    expect(parseSearchQuery("레터링 4만원").filter).toMatchObject({ maxPrice: 40000 });
  });

  it("가격 말이 남아 검색어를 막지 않는다(범위 양쪽 만원, 위·아래 둘 다, 원 없이)", () => {
    expect(parseSearchQuery("레터링 2만~3만원")).toEqual({
      keyword: "",
      filter: { productCategoryTypes: [C.LETTERING], minPrice: 20000, maxPrice: 30000 },
    });
    expect(parseSearchQuery("생일 3만원 이상 5만원 이하").filter).toMatchObject({
      minPrice: 30000,
      maxPrice: 50000,
    });
    expect(parseSearchQuery("생일 3만 이하")).toEqual({
      keyword: "",
      filter: { productCategoryTypes: [C.BIRTHDAY], maxPrice: 30000 },
    });
    expect(parseSearchQuery("2~3만원대 레터링").keyword).toBe("");
    expect(parseSearchQuery("레터링 5만원 이상 3만원 이하").filter).toMatchObject({
      minPrice: 30000,
      maxPrice: 50000,
    });
    expect(parseSearchQuery("100일 케이크 2.5만원").filter).toMatchObject({ maxPrice: 25000 });
  });

  it('서버가 모르는 "오늘" 하나만 쳐도 당일픽업으로', () => {
    expect(parseSearchQuery("오늘")).toEqual({
      keyword: "",
      filter: { productCategoryTypes: [C.SAME_DAY_PICKUP] },
    });
  });

  it("오늘·당일은 당일픽업", () => {
    expect(parseSearchQuery("오늘 생일케이크").filter.productCategoryTypes).toEqual([
      C.SAME_DAY_PICKUP,
      C.BIRTHDAY,
    ]);
  });

  it("카테고리 말 하나나 알아들은 게 없으면 지금처럼 친 말 그대로", () => {
    expect(parseSearchQuery("생일케이크")).toEqual({ keyword: "생일케이크", filter: {} });
    expect(parseSearchQuery("남친")).toEqual({ keyword: "남친", filter: {} });
    expect(parseSearchQuery("달콤스토어 케이크")).toEqual({
      keyword: "달콤스토어 케이크",
      filter: {},
    });
    expect(parseSearchQuery("케이크")).toEqual({ keyword: "케이크", filter: {} });
  });
});

describe("필터 창과 친 말의 조건", () => {
  it("더할 때 카테고리·크기는 합치고 가격은 친 말이 이긴다", () => {
    expect(
      mergeSearchFilters(
        { productCategoryTypes: [C.BIRTHDAY], maxPrice: 50000 },
        { productCategoryTypes: [C.LETTERING], sizes: ["2호"], maxPrice: 30000 },
      ),
    ).toEqual({
      productCategoryTypes: [C.BIRTHDAY, C.LETTERING],
      sizes: ["2호"],
      minPrice: undefined,
      maxPrice: 30000,
    });
  });

  it("창에서 고치면 친 말 몫은 남은 것만, 나머지는 고른 필터로", () => {
    const typed = {
      productCategoryTypes: [C.BIRTHDAY, C.LETTERING],
      sizes: ["1호"],
      maxPrice: 30000,
    };
    const sheet = { productCategoryTypes: [C.BIRTHDAY, C.FLOWER], sizes: ["1호"], maxPrice: 40000 };
    expect(splitSheetFilter(sheet, typed)).toEqual({
      picked: {
        productCategoryTypes: [C.FLOWER],
        sizes: undefined,
        minPrice: undefined,
        maxPrice: 40000,
      },
      typed: {
        productCategoryTypes: [C.BIRTHDAY],
        sizes: ["1호"],
        minPrice: undefined,
        maxPrice: undefined,
      },
    });
  });
});
