import type { MetadataRoute } from "next";
import { SITE_BASE_URL } from "@/apps/web-info/common/constants/site.constants";
import { isProduction } from "@/apps/web-info/common/utils/environment.util";

export default function robots(): MetadataRoute.Robots {
  // 검증·개발 환경은 열어 두고 sitemap만 알리지 않는다. 검색에서 빼는 일은 next.config.ts의
  // X-Robots-Tag: noindex 헤더가 한다 — robots.txt로 막으면 구글이 그 헤더를 읽지 못한다(web-user와 같은 규칙)
  if (!isProduction(process.env.NEXT_PUBLIC_NODE_ENV)) {
    return { rules: { userAgent: "*", allow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_BASE_URL}/sitemap.xml`,
  };
}
