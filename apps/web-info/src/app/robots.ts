import type { MetadataRoute } from "next";
import { SITE_BASE_URL } from "@/apps/web-info/common/constants/site.constants";
import { isProduction } from "@/apps/web-info/common/utils/environment.util";

export default function robots(): MetadataRoute.Robots {
  // 검증·개발 환경은 전체 차단 (web-user와 같은 규칙)
  if (!isProduction(process.env.NEXT_PUBLIC_NODE_ENV)) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_BASE_URL}/sitemap.xml`,
  };
}
