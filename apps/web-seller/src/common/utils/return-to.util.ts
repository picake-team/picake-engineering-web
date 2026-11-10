/**
 * 로그인이 풀린 채 들어온 주소(휴대폰 알림을 눌러 연 주문 등)를 기억했다가 로그인 뒤 그곳으로 보낸다
 * (I-48 휴대폰 알림 "로그인이 풀려 있으면 로그인한 뒤 그 주문으로 간다"). 소셜 로그인으로 밖에 다녀와도
 * 같은 탭이면 남도록 sessionStorage에 둔다.
 */
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";

const KEY = "picake.seller.returnTo";

/**
 * 기억해도 되는 주소인지(우리 사이트 안, 로그인·약관 화면이 아님).
 * 스토어 만들기도 빼서 로그인 뒤에는 첫 화면이 스토어가 있는지 보고 정하게 한다
 */
export function isReturnablePath(path: string): boolean {
  const pathname = path.split(/[?#]/)[0];
  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("/auth") &&
    !path.startsWith("/terms") &&
    path !== "/" &&
    pathname !== ROUTES.STORE_CREATE
  );
}

export function rememberReturnTo(path: string) {
  if (!isReturnablePath(path)) return;
  try {
    window.sessionStorage.setItem(KEY, path);
  } catch {
    // 저장 못 해도 로그인 뒤 첫 화면으로 간다
  }
}

/** 기억한 주소를 꺼내고 지운다 */
export function consumeReturnTo(): string | null {
  try {
    const v = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    return v && isReturnablePath(v) ? v : null;
  } catch {
    return null;
  }
}
