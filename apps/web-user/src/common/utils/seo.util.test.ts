import { describe, expect, it, vi } from "vitest";

import {
  CRAWL_DISALLOWED_PATHS,
  buildRobots,
  buildSitemapEntries,
  collectAllPages,
} from "./seo.util";

const BASE_URL = "https://picakes.com";

describe("buildRobots", () => {
  it("상용에서는 모든 크롤러를 허용하고 비공개 경로만 차단한다", () => {
    const robots = buildRobots({ isProduction: true, baseUrl: BASE_URL });

    expect(robots.rules).toEqual({
      userAgent: "*",
      allow: "/",
      disallow: CRAWL_DISALLOWED_PATHS,
    });
    expect(robots.sitemap).toBe("https://picakes.com/sitemap.xml");
  });

  it("상용이 아니면 전체를 차단하고 sitemap을 알리지 않는다", () => {
    const robots = buildRobots({ isProduction: false, baseUrl: BASE_URL });

    expect(robots.rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(robots.sitemap).toBeUndefined();
  });

  it("공개 페이지(홈·상품·스토어)는 차단 목록에 없다", () => {
    expect(CRAWL_DISALLOWED_PATHS.some((path) => "/product/1".startsWith(path))).toBe(false);
    expect(CRAWL_DISALLOWED_PATHS.some((path) => "/store/1".startsWith(path))).toBe(false);
    expect(CRAWL_DISALLOWED_PATHS).not.toContain("/");
  });
});

describe("collectAllPages", () => {
  it("hasNext가 false가 될 때까지 모든 페이지를 모은다", async () => {
    const fetchPage = vi.fn(async (page: number) => ({
      data: [`item-${page}`],
      hasNext: page < 3,
    }));

    await expect(collectAllPages(fetchPage)).resolves.toEqual(["item-1", "item-2", "item-3"]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it("중간 페이지가 실패하면 그때까지 모은 것만 돌려준다", async () => {
    const fetchPage = vi.fn(async (page: number) =>
      page === 2 ? null : { data: [`item-${page}`], hasNext: true },
    );

    await expect(collectAllPages(fetchPage)).resolves.toEqual(["item-1"]);
  });

  it("최대 페이지 수를 넘겨서 호출하지 않는다", async () => {
    const fetchPage = vi.fn(async () => ({ data: ["x"], hasNext: true }));

    await collectAllPages(fetchPage, 4);
    expect(fetchPage).toHaveBeenCalledTimes(4);
  });
});

describe("buildSitemapEntries", () => {
  it("홈, 스토어, 상품 주소를 만든다", () => {
    const entries = buildSitemapEntries({
      baseUrl: BASE_URL,
      products: [{ id: "p1", updatedAt: "2026-10-01T00:00:00.000Z" }],
      stores: [{ id: "s1" }],
    });

    expect(entries.map((entry) => entry.url)).toEqual([
      "https://picakes.com",
      "https://picakes.com/store/s1",
      "https://picakes.com/product/p1",
    ]);
    expect(entries[2].lastModified).toEqual(new Date("2026-10-01T00:00:00.000Z"));
    expect(entries[1].lastModified).toBeUndefined();
  });

  it("날짜 형식이 올바르지 않으면 lastModified를 비워 둔다", () => {
    const entries = buildSitemapEntries({
      baseUrl: BASE_URL,
      products: [{ id: "p1", updatedAt: "not-a-date" }],
      stores: [],
    });

    expect(entries[1].lastModified).toBeUndefined();
  });

  it("상품·스토어가 없어도 홈은 포함한다", () => {
    const entries = buildSitemapEntries({ baseUrl: BASE_URL, products: [], stores: [] });

    expect(entries).toHaveLength(1);
    expect(entries[0].url).toBe(BASE_URL);
  });
});
