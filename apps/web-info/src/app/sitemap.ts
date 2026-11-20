import type { MetadataRoute } from "next";
import { SITE_BASE_URL } from "@/apps/web-info/common/constants/site.constants";
import { isProduction } from "@/apps/web-info/common/utils/environment.util";

export default function sitemap(): MetadataRoute.Sitemap {
  // 검증·개발 환경은 검색에서 빼므로(next.config.ts의 noindex 헤더) 주소 목록을 만들지 않는다
  if (!isProduction(process.env.NEXT_PUBLIC_NODE_ENV)) return [];

  return [
    {
      url: `${SITE_BASE_URL}/seller/about`,
      // 내용을 크게 바꾸면 이 날짜도 바꾼다(검색엔진이 다시 읽으러 오는 신호)
      lastModified: "2026-11-20",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
