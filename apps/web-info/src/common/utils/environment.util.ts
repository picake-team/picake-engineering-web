import { NODE_ENV } from "@/apps/web-info/common/constants/environment.constants";

/**
 * NODE_ENV 해석 유틸리티
 * `=== "production"` / `!== "production"` 같은 문자열 비교가 코드 전반에 흩어지지 않도록
 * 환경 판별 로직을 한 곳으로 모읍니다.
 */

/** 상용(production) 환경 여부 */
export function isProduction(nodeEnv?: string | null): boolean {
  return nodeEnv === NODE_ENV.PRODUCTION;
}
