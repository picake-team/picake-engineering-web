import {
  isWebViewEnvironment,
  openExternalInApp,
} from "@/apps/web-user/common/utils/webview.bridge";

/**
 * 바깥 링크(카카오톡 채팅·인스타·메일·전화·문자): 앱이면 앱이 휴대폰 브라우저·그 앱으로 열고, 열 앱이 없으면 reject.
 * 브라우저면 웹 주소는 새 창, mailto·tel은 그 자리에서(열렸는지 알 수 없어 늘 resolve). 열리지 않을 때 대신할 길은 useOpenExternal
 */
export function openExternalUrl(url: string): Promise<void> {
  if (isWebViewEnvironment()) {
    return openExternalInApp(url);
  }
  if (/^https?:/i.test(url)) {
    window.open(url, "_blank", "noopener,noreferrer");
    return Promise.resolve();
  }
  window.location.href = url;
  return Promise.resolve();
}

/**
 * 가게 카카오톡 채널 1:1 채팅 주소. 사장님은 채널 ID(예: "_xeaCon")를 적지만 주소 전체를 붙여 넣는 경우도 받는다.
 * 비었거나 알아볼 수 없으면 null
 */
export function storeKakaoChatUrl(channelId?: string | null): string | null {
  const raw = (channelId ?? "").trim();
  if (!raw) return null;
  const id = raw.match(/pf\.kakao\.com\/(_[A-Za-z0-9]+)/)?.[1] ?? raw.replace(/^@/, "");
  return /^_[A-Za-z0-9]+$/.test(id) ? `https://pf.kakao.com/${id}/chat` : null;
}

/** 가게 인스타그램 프로필 주소. "@이름"·주소 전체도 받는다. 비었거나 알아볼 수 없으면 null */
export function storeInstagramUrl(instagramId?: string | null): string | null {
  const raw = (instagramId ?? "").trim();
  if (!raw) return null;
  const id = (raw.match(/instagram\.com\/([A-Za-z0-9._]+)/)?.[1] ?? raw).replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(id) ? `https://instagram.com/${id}` : null;
}
