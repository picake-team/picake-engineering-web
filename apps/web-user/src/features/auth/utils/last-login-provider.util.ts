/**
 * 이 기기에서 마지막으로 로그인(가입 포함)한 방법 — 로그인 화면 "최근 로그인" 말풍선(2026-11-16 운영자, 시안 C).
 * 서버에 두지 않고 이 브라우저(앱 웹뷰)에만 둔다. 로그아웃해도 남기고, 탈퇴하면 지운다. 심사용 로그인은 남기지 않는다.
 */
export type LastLoginProvider = "kakao" | "naver" | "google" | "apple";

const KEY = "picake:last-login-provider";
const PROVIDERS: readonly LastLoginProvider[] = ["kakao", "naver", "google", "apple"];

export function saveLastLoginProvider(provider: LastLoginProvider): void {
  try {
    window.localStorage.setItem(KEY, provider);
  } catch {
    // 저장소를 못 쓰면(사생활 보호 모드 등) 말풍선만 안 뜬다
  }
}

export function readLastLoginProvider(): LastLoginProvider | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return PROVIDERS.includes(v as LastLoginProvider) ? (v as LastLoginProvider) : null;
  } catch {
    return null;
  }
}

export function clearLastLoginProvider(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // 지울 수 없으면 그대로 둔다(말풍선만 남음)
  }
}
