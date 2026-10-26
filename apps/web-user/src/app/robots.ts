import type { MetadataRoute } from "next";
import { SITE_BASE_URL } from "@/apps/web-user/common/constants/site.constants";
import { isProduction } from "@/apps/web-user/common/utils/environment.util";
import { buildRobots } from "@/apps/web-user/common/utils/seo.util";

export default function robots(): MetadataRoute.Robots {
  return buildRobots({
    isProduction: isProduction(process.env.NEXT_PUBLIC_NODE_ENV),
    baseUrl: SITE_BASE_URL,
  });
}
