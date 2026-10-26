import type { MetadataRoute } from "next";
import { SITE_BASE_URL } from "@/apps/web-user/common/constants/site.constants";
import { isProduction } from "@/apps/web-user/common/utils/environment.util";
import { fetchConsumerApi } from "@/apps/web-user/common/utils/server-api.util";
import {
  SITEMAP_PAGE_SIZE,
  buildSitemapEntries,
  collectAllPages,
  type SitemapPage,
  type SitemapSourceItem,
} from "@/apps/web-user/common/utils/seo.util";
import type { ProductListResponse } from "@/apps/web-user/features/product/types/product.type";
import type { StoreListResponse } from "@/apps/web-user/features/store/types/store.type";

/** 새 상품·스토어가 생겨도 1시간 안에 반영 (목록 API fetch의 캐시 시간과 동일) */
export const revalidate = 3600;

async function fetchProductPage(page: number): Promise<SitemapPage<SitemapSourceItem> | null> {
  const result = await fetchConsumerApi<ProductListResponse>(
    `/products?sortBy=latest&page=${page}&limit=${SITEMAP_PAGE_SIZE}`,
  );
  return result ? { data: result.data, hasNext: result.meta.hasNext } : null;
}

async function fetchStorePage(page: number): Promise<SitemapPage<SitemapSourceItem> | null> {
  const result = await fetchConsumerApi<StoreListResponse>(
    `/store?page=${page}&limit=${SITEMAP_PAGE_SIZE}`,
  );
  return result ? { data: result.data, hasNext: result.meta.hasNext } : null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 검증·개발 환경은 robots.txt로 전체 차단하므로 주소 목록을 만들지 않는다
  if (!isProduction(process.env.NEXT_PUBLIC_NODE_ENV)) return [];

  const [products, stores] = await Promise.all([
    collectAllPages(fetchProductPage),
    collectAllPages(fetchStorePage),
  ]);

  return buildSitemapEntries({ baseUrl: SITE_BASE_URL, products, stores });
}
