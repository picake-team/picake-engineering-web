import {
  isWebViewEnvironment,
  toExternalAppSchemeUrl,
} from "@/apps/web-user/common/utils/webview.bridge";

/** 바깥 링크(카카오톡 채팅·인스타·메일): 앱이면 앱이 가로채 그 앱으로, 브라우저면 새 창 */
export function openExternalUrl(url: string) {
  if (isWebViewEnvironment()) {
    window.location.href = toExternalAppSchemeUrl(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
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
