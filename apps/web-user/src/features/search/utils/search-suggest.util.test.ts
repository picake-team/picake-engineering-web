import { describe, expect, it } from "vitest";
import { DESIGNS } from "@/apps/web-user/features/design/constants/designs.constant";
import { productCategoryFromKeyword } from "@/apps/web-user/features/product/constants/product-category.constant";
import { MAP_LIST_SIZE_OPTIONS } from "@/apps/web-user/features/store/constants/map.constant";
import {
  ALL_RECOMMENDED_KEYWORDS,
  SUGGEST_WORDS,
  recommendedSearchKeywords,
  EVERGREEN_KEYWORDS,
  suggestSearchKeywords,
} from "@/apps/web-user/features/search/utils/search-suggest.util";

describe("suggestSearchKeywords", () => {
  it("내가 찾았던 말이 먼저, 그다음 아는 말(앞에서 맞는 것 먼저)", () => {
    const rows = suggestSearchKeywords("렡", ["레터링 케이크"]);
    expect(rows[0]).toMatchObject({ text: "레터링 케이크", kind: "recent" });
    expect(rows.some((r) => r.text === "레터링" && r.kind === "keyword")).toBe(true);
  });

  it("내가 찾은 말과 같은 아는 말은 한 번만", () => {
    const rows = suggestSearchKeywords("레터", ["레터링"]);
    expect(rows.filter((r) => r.text === "레터링")).toHaveLength(1);
  });

  it("두 단어 이상이면 앞말은 두고 마지막 단어를 잇는다", () => {
    const rows = suggestSearchKeywords("생일 렡", []);
    expect(rows[0]).toMatchObject({ text: "생일 레터링", highlight: [0, 5] });
    expect(suggestSearchKeywords("생일 1", []).map((r) => r.text)).toContain("생일 1호");
    // 끝 띄어쓰기·#은 빼고 본다(치는 중에 줄이 사라졌다 나타나지 않게)
    expect(suggestSearchKeywords("생일 ", [])[0]).toMatchObject({ text: "생일" });
    expect(suggestSearchKeywords("#레", [])[0]).toMatchObject({ text: "레터링" });
  });

  it("8줄까지(내가 찾은 말은 3줄까지), 빈 검색어는 없음", () => {
    expect(suggestSearchKeywords("ㅅ", []).length).toBeLessThanOrEqual(8);
    const recent = ["생일1", "생일2", "생일3", "생일4"];
    expect(suggestSearchKeywords("생일", recent).filter((r) => r.kind === "recent")).toHaveLength(
      3,
    );
    expect(suggestSearchKeywords(" ", ["레터링"])).toEqual([]);
  });

  it("디자인 모음의 모양 말은 모두 자동완성에 있다(새 모양 말이 생기면 DESIGN_STYLE_WORDS에 더하기)", () => {
    const missing = [...new Set(DESIGNS.map((d) => d.style))].filter(
      (style) => !SUGGEST_WORDS.includes(style),
    );
    expect(missing).toEqual([]);
  });
});

describe("recommendedSearchKeywords", () => {
  it("철 말이 많은 11월에도 늘 보이는 말은 모두 보인다(결혼기념일 잘림, 11-17)", () => {
    const nov = recommendedSearchKeywords(new Date("2026-11-16T03:00:00Z"));
    for (const w of EVERGREEN_KEYWORDS) expect(nov).toContain(w);
    expect(nov.length).toBeLessThanOrEqual(9);
  });

  it("11월 중순에는 크리스마스·연말·합격이 앞에, 늘 찾는 말이 뒤에", () => {
    expect(recommendedSearchKeywords(new Date("2026-11-16T03:00:00Z")).slice(0, 4)).toEqual([
      "크리스마스",
      "연말",
      "합격",
      "생일",
    ]);
  });

  it("한국 날짜로 바뀐다(UTC 4월 30일 밤 = 한국 5월 1일)", () => {
    expect(recommendedSearchKeywords(new Date("2026-04-30T16:00:00Z")).slice(0, 2)).toEqual([
      "어버이날",
      "스승의날",
    ]);
  });

  it("추천 칩은 모두 카테고리나 크기로 이어진다(누르면 결과가 나오게)", () => {
    const deadEnds = ALL_RECOMMENDED_KEYWORDS.filter(
      (w) => !productCategoryFromKeyword(w) && !MAP_LIST_SIZE_OPTIONS.includes(w),
    );
    expect(deadEnds).toEqual([]);
  });
});
