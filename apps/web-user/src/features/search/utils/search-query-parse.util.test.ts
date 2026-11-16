import { describe, expect, it } from "vitest";
import { ProductCategoryType as C } from "@/apps/web-user/features/product/types/product.type";
import { productCategoryFromKeyword } from "@/apps/web-user/features/product/constants/product-category.constant";
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

  it("만·천 섞인 금액, 숫자 없는 만원, 원 단위 숫자도 가격으로(11-16 검토)", () => {
    expect(parseSearchQuery("3만5천원 이하")).toEqual({ keyword: "", filter: { maxPrice: 35000 } });
    expect(parseSearchQuery("레터링 3만 5천원 이하").filter).toMatchObject({ maxPrice: 35000 });
    expect(parseSearchQuery("만원 이하")).toEqual({ keyword: "", filter: { maxPrice: 10000 } });
    expect(parseSearchQuery("35000원")).toEqual({ keyword: "", filter: { maxPrice: 35000 } });
    expect(parseSearchQuery("30,000원 이하 하트").filter).toMatchObject({
      maxPrice: 30000,
      productCategoryTypes: [C.HEART],
    });
    expect(parseSearchQuery("3만5000원").filter).toEqual({ maxPrice: 35000 });
    expect(parseSearchQuery("35000원~40000원").filter).toEqual({
      minPrice: 35000,
      maxPrice: 40000,
    });
    expect(parseSearchQuery("레터링 만원대").filter).toMatchObject({
      minPrice: 10000,
      maxPrice: 20000,
    });
    // 숫자와 만 사이 띄어쓰기는 원래대로 3만원
    expect(parseSearchQuery("3 만원 이하").filter).toEqual({ maxPrice: 30000 });
    // 가격이 아닌 숫자·말은 그대로
    expect(parseSearchQuery("1호선 근처 케이크").keyword).toBe("1호선 근처 케이크");
    expect(parseSearchQuery("만두 케이크").keyword).toBe("만두 케이크");
    expect(parseSearchQuery("이만원").keyword).toBe("이만원");
    expect(parseSearchQuery("10000000원").keyword).toBe("10000000원");
  });

  it("같은 말을 두 번 쳐도 한 번으로 서버가 찾는다", () => {
    expect(parseSearchQuery("생일 생일")).toEqual({ keyword: "생일", filter: {} });
    expect(parseSearchQuery("초코  초코")).toEqual({ keyword: "초코", filter: {} });
    expect(parseSearchQuery("초코 초코 하트")).toEqual({
      keyword: "초코",
      filter: { productCategoryTypes: [C.HEART] },
    });
  });

  it("띄어 쓴 같은 뜻 말은 붙여서 읽는다(11-16 검토 — 한 말씩 나눠 거의 0건이던 것)", () => {
    // 친 말 전체가 같은 뜻 말이면 오늘 전처럼 그대로 서버에
    expect(parseSearchQuery("당일 픽업 케이크")).toEqual({
      keyword: "당일 픽업 케이크",
      filter: {},
    });
    expect(parseSearchQuery("남자 친구")).toEqual({ keyword: "남자 친구", filter: {} });
    // 다른 조건과 섞이면 두 말을 붙여 카테고리로("친구"만 생일로 읽지 않음)
    const boyfriend = productCategoryFromKeyword("남자친구");
    expect(boyfriend).toBeDefined();
    expect(parseSearchQuery("남자 친구 3만원 이하")).toEqual({
      keyword: "",
      filter: { productCategoryTypes: [boyfriend], maxPrice: 30000 },
    });
    expect(parseSearchQuery("당일 픽업 하트").filter.productCategoryTypes).toEqual([
      C.SAME_DAY_PICKUP,
      C.HEART,
    ]);
  });

  it("카테고리 말 하나 + 군더더기 말이면 그 말만 서버에, 카테고리 말이 둘이면 필터로", () => {
    expect(parseSearchQuery("생일 케이크 추천")).toEqual({ keyword: "생일 케이크", filter: {} });
    expect(parseSearchQuery("근처 생일케이크")).toEqual({ keyword: "생일케이크", filter: {} });
    expect(parseSearchQuery("레터링 케이크 주문")).toEqual({
      keyword: "레터링 케이크",
      filter: {},
    });
    expect(parseSearchQuery("여친 100일")).toMatchObject({ keyword: "" });
    expect(parseSearchQuery("여친 100일").filter.productCategoryTypes?.length).toBeGreaterThan(0);
    expect(parseSearchQuery("오늘 당일")).toEqual({
      keyword: "",
      filter: { productCategoryTypes: [C.SAME_DAY_PICKUP] },
    });
    expect(parseSearchQuery("당일 오늘")).toEqual(parseSearchQuery("오늘 당일"));
  });

  it("가격 뒤 꼬리말·기호, 원 없는 금액, 에서~사이 범위", () => {
    const birthday = { productCategoryTypes: [C.BIRTHDAY] };
    expect(parseSearchQuery("생일 3만원 정도")).toEqual({
      keyword: "",
      filter: { ...birthday, maxPrice: 30000 },
    });
    expect(parseSearchQuery("3만원짜리 레터링")).toEqual({
      keyword: "",
      filter: { productCategoryTypes: [C.LETTERING], maxPrice: 30000 },
    });
    expect(parseSearchQuery("레터링 3만원 이하로").keyword).toBe("");
    expect(parseSearchQuery("레터링 ~3만원").keyword).toBe("");
    expect(parseSearchQuery("레터링 3만원 내")).toMatchObject({
      keyword: "",
      filter: { maxPrice: 30000 },
    });
    expect(parseSearchQuery("생일 3만")).toEqual({
      keyword: "",
      filter: { ...birthday, maxPrice: 30000 },
    });
    expect(parseSearchQuery("2만원에서 3만원 사이").filter).toEqual({
      minPrice: 20000,
      maxPrice: 30000,
    });
    expect(parseSearchQuery("2만원부터 3만원까지").filter).toEqual({
      minPrice: 20000,
      maxPrice: 30000,
    });
    // "내일"의 "내"는 가격 말이 아니다
    expect(parseSearchQuery("레터링 3만원 내일").keyword).toBe("내일");
    // 가격이 없으면 꼬리말처럼 보여도 그대로
    expect(parseSearchQuery("초코 정도").keyword).toBe("초코 정도");
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
