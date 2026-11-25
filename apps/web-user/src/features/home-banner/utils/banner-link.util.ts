import { SITE_BASE_URL } from "@/apps/web-user/common/constants/site.constants";

/**
 * 홈 배너 링크를 어떻게 열지 정한다.
 *
 * 관리자 API는 링크를 절대 주소(`https://…`)로만 받는다(서버 `IsUrl`). 그래서 우리 사이트 주소도 `https://picakes.com/…`로 오는데,
 * 예전처럼 `http`로 시작하면 모두 새 창으로 열면 손님 앱 웹뷰에서 우리 화면이 바깥 브라우저로 나간다.
 * - 우리 사이트(상용·검증·지금 사이트) 주소 → 같은 창에서 주소창 이동(`page`). 경로만 남긴다.
 *   `next/link` 대신 주소창 이동인 까닭: `/partner`처럼 다른 도메인으로 보내는 주소는 클라이언트 이동이 RSC를 못 받아 오류를 남긴다.
 * - `/`로 시작하는 경로 → 앱 안 이동(`route`)
 * - 그 밖의 주소 → 새 창(`external`)
 */
export type BannerLink =
  | { kind: "route"; href: string }
  | { kind: "page"; href: string }
  | { kind: "external"; href: string };

const SAME_SITE_HOSTS = new Set(["picakes.com", "www.picakes.com", "staging.picakes.com"]);

function siteHost(): string | null {
  try {
    return new URL(SITE_BASE_URL).host;
  } catch {
    return null;
  }
}

export function resolveBannerLink(linkUrl: string): BannerLink {
  if (!/^https?:\/\//i.test(linkUrl)) return { kind: "route", href: linkUrl };
  try {
    const url = new URL(linkUrl);
    if (SAME_SITE_HOSTS.has(url.host) || url.host === siteHost()) {
      return { kind: "page", href: `${url.pathname}${url.search}${url.hash}` };
    }
  } catch {
    // 이상한 주소는 예전처럼 새 창으로 둔다
  }
  return { kind: "external", href: linkUrl };
}
