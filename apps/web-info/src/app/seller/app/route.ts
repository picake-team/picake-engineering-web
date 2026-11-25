import { NextResponse, type NextRequest } from "next/server";
import { SELLER_PLAY_STORE_URL } from "@/apps/web-info/common/constants/app-download.constants";
import { SELLER_SIGNUP_URL } from "@/apps/web-info/common/constants/partner.constants";

/**
 * 사장님 앱 받기 입구(`https://info.picakes.com/seller/app`). 사장님 소개의 휴대폰 "앱 받기"와 PC QR이 여기로 온다.
 * 손님 웹 `/app`(picakes.com)과 같은 방식: QR·링크는 이 주소로 고정하고 목적지는 여기서 정한다.
 *
 * | 기기    | 이동                                                         |
 * | ------- | ------------------------------------------------------------ |
 * | Android | Google Play "픽케이크 사장님"                                |
 * | iOS     | 판매자 웹(seller.picakes.com) — App Store 앱이 아직 없어서   |
 * | 그 외   | 사장님 소개의 앱 칸(`/seller/about#app`, PC는 QR을 보여 준다) |
 */

/** UA로 나누므로 정적으로 만들거나 캐시하면 안 된다 */
export const dynamic = "force-dynamic";

function resolveDestination(userAgent: string): string {
  if (/Android/i.test(userAgent)) return SELLER_PLAY_STORE_URL;
  if (/iPhone|iPad|iPod/i.test(userAgent)) return SELLER_SIGNUP_URL;
  return "/seller/about#app";
}

export function GET(request: NextRequest) {
  const destination = resolveDestination(request.headers.get("user-agent") ?? "");
  // 302(임시): 301은 브라우저가 목적지를 오래 기억해 스토어 주소를 바꿔도 예전 곳으로 간다
  const response = NextResponse.redirect(new URL(destination, request.url), 302);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Vary", "User-Agent");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}
