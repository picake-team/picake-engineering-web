import type { MetadataRoute } from "next";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";

/** 검색엔진·AI 크롤러가 수집하지 않아야 하는 경로 (로그인 필요·내부용·API) */
export const CRAWL_DISALLOWED_PATHS = [
  "/api/",
  "/alarm",
  "/auth",
  "/chat",
  "/mypage",
  "/order",
  "/reservation",
  "/saved",
];

/** sitemap 한 번에 모으는 목록 API 페이지 크기·최대 페이지 수 (최대 5,000건) */
export const SITEMAP_PAGE_SIZE = 100;
export const SITEMAP_MAX_PAGES = 50;

interface BuildRobotsInput {
  isProduction: boolean;
  baseUrl: string;
}

/**
 * robots.txt 규칙
 * - 상용: 모든 크롤러(AI 크롤러 포함) 허용, 비공개 경로만 차단하고 sitemap 안내
 * - 그 외(검증·개발): 전체 차단 — 테스트 데이터가 검색 결과에 노출되지 않게 함
 */
export function buildRobots({ isProduction, baseUrl }: BuildRobotsInput): MetadataRoute.Robots {
  if (!isProduction) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: CRAWL_DISALLOWED_PATHS },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

export interface SitemapSourceItem {
  id: string;
  updatedAt?: string | Date;
}

export interface SitemapPage<T> {
  data: T[];
  hasNext: boolean;
}

/**
 * 페이지네이션 목록을 끝까지(또는 maxPages까지) 모은다.
 * 한 페이지라도 실패(null)하면 거기서 멈추고 지금까지 모은 것만 돌려준다 —
 * 백엔드 일시 오류로 sitemap 전체가 실패하는 것보다 부분 목록이 낫다.
 */
export async function collectAllPages<T>(
  fetchPage: (page: number) => Promise<SitemapPage<T> | null>,
  maxPages: number = SITEMAP_MAX_PAGES,
): Promise<T[]> {
  const items: T[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const result = await fetchPage(page);
    if (!result) break;

    items.push(...result.data);
    if (!result.hasNext) break;
  }

  return items;
}

function toLastModified(updatedAt: SitemapSourceItem["updatedAt"]): Date | undefined {
  if (!updatedAt) return undefined;

  const date = new Date(updatedAt);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

interface BuildSitemapInput {
  baseUrl: string;
  products: SitemapSourceItem[];
  stores: SitemapSourceItem[];
}

/** 홈 + 상품 상세 + 스토어 상세 주소 목록 (id만 사용 — 목록 응답의 다른 필드는 쓰지 않음) */
export function buildSitemapEntries({
  baseUrl,
  products,
  stores,
}: BuildSitemapInput): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    ...stores.map((store) => ({
      url: `${baseUrl}${PATHS.STORE.DETAIL(store.id)}`,
      lastModified: toLastModified(store.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}${PATHS.PRODUCT.DETAIL(product.id)}`,
      lastModified: toLastModified(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
