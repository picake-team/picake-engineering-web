import type { MetadataRoute } from "next";
import { SITE_BASE_URL } from "@/apps/web-info/common/constants/site.constants";
import { isProduction } from "@/apps/web-info/common/utils/environment.util";

export default function sitemap(): MetadataRoute.Sitemap {
  // 검증·개발 환경은 robots.txt로 전체 차단하므로 주소 목록을 만들지 않는다
  if (!isProduction(process.env.NEXT_PUBLIC_NODE_ENV)) return [];

  return [{ url: `${SITE_BASE_URL}/seller/about`, changeFrequency: "monthly", priority: 1 }];
}
