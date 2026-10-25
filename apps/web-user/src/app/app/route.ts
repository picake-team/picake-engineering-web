import { NextResponse, type NextRequest } from "next/server";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
} from "@/apps/web-user/common/constants/app-download.constants";

/**
 * 명함 QR 등 오프라인 인쇄물의 공용 앱 다운로드 진입점 (`https://picakes.com/app`).
 *
 * 인쇄된 QR은 회수할 수 없으므로 QR에는 이 주소만 담고, 실제 목적지는 여기서 정합니다.
 * 스토어 링크가 바뀌어도 QR·명함은 그대로 두고
 * {@link ../../common/constants/app-download.constants.ts}의 링크만 고치면 됩니다.
 *
 * | UA      | 이동 대상                                        |
 * | ------- | ------------------------------------------------ |
 * | iOS     | App Store                                        |
 * | Android | Play Store                                       |
 * | 그 외   | 홈 (모바일 웹)                                    |
 */

/** UA로 분기하므로 정적 생성/캐시 대상이 되면 안 됩니다. */
export const dynamic = "force-dynamic";

/** UA 문자열 기준으로 이동할 대상(절대 URL 또는 내부 경로)을 고릅니다. */
function resolveDestination(userAgent: string): string {
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return APP_STORE_URL;
  }

  if (/Android/i.test(userAgent)) {
    return PLAY_STORE_URL;
  }

  return PATHS.HOME;
}

export function GET(request: NextRequest) {
  const destination = resolveDestination(request.headers.get("user-agent") ?? "");

  // 302(임시). 301로 보내면 브라우저가 목적지를 영구 캐시해서
  // 스토어 링크를 바꾼 뒤에도 예전 대상으로 가버립니다 — 인쇄물 QR에는 치명적입니다.
  const response = NextResponse.redirect(new URL(destination, request.url), 302);

  // 같은 URL이 UA마다 다른 곳으로 가므로 중간 캐시가 응답을 재사용하면 안 됩니다.
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Vary", "User-Agent");
  response.headers.set("X-Robots-Tag", "noindex");

  return response;
}
