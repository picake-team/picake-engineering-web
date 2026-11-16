import { describe, expect, it } from "vitest";
import { ProductCategoryType as C } from "@/apps/web-user/features/product/types/product.type";
import { parseSearchQuery } from "@/apps/web-user/features/search/utils/search-query-parse.util";
import {
  recommendedSearchKeywords,
  suggestSearchKeywords,
} from "@/apps/web-user/features/search/utils/search-suggest.util";

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

describe("suggestSearchKeywords", () => {
  it("내가 찾았던 말이 먼저, 그다음 아는 말(앞에서 맞는 것 먼저)", () => {
    const rows = suggestSearchKeywords("렡", ["레터링 케이크"]);
    expect(rows[0]).toMatchObject({ text: "레터링 케이크", kind: "recent" });
    expect(rows.some((r) => r.text === "레터링" && r.kind === "keyword")).toBe(true);
  });

  it("두 단어 이상이면 앞말은 두고 마지막 단어를 잇는다", () => {
    const rows = suggestSearchKeywords("생일 렡", []);
    expect(rows[0]).toMatchObject({ text: "생일 레터링", highlight: [0, 5] });
    expect(suggestSearchKeywords("생일 1", []).map((r) => r.text)).toContain("생일 1호");
    expect(suggestSearchKeywords("생일 ", [])).toEqual([]);
  });

  it("8줄까지, 빈 검색어는 없음", () => {
    expect(suggestSearchKeywords("ㅅ", []).length).toBeLessThanOrEqual(8);
    expect(suggestSearchKeywords(" ", ["레터링"])).toEqual([]);
  });
});

describe("recommendedSearchKeywords", () => {
  it("11월 중순에는 크리스마스·연말·합격이 앞에, 늘 찾는 말이 뒤에", () => {
    expect(recommendedSearchKeywords(new Date("2026-11-16T03:00:00Z")).slice(0, 4)).toEqual([
      "크리스마스",
      "연말",
      "합격",
      "생일",
    ]);
  });

  it("5월 초에는 어버이날·스승의날", () => {
    expect(recommendedSearchKeywords(new Date("2026-05-03T03:00:00Z")).slice(0, 2)).toEqual([
      "어버이날",
      "스승의날",
    ]);
  });
});
