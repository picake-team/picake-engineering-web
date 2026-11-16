/** StrictMode remount 후에도 회원가입(휴대폰 인증) 플로우 유지 */
/**
 * 가입표(registerToken): 로그인 때 서버가 확인한 소셜 ID가 들어 있다(30분). 가입은 이 값으로만 한다 — 소셜 ID는 들고 다니지 않는다.
 */
export type PendingGoogleRegister = { provider: "google"; registerToken: string };
export type PendingKakaoRegister = { provider: "kakao"; registerToken: string };
export type PendingOAuthRegister = PendingGoogleRegister | PendingKakaoRegister;

let pendingRegister: PendingOAuthRegister | null = null;

export function setPendingOAuthRegister(data: PendingOAuthRegister): void {
  pendingRegister = data;
}

export function getPendingOAuthRegister(): PendingOAuthRegister | null {
  return pendingRegister;
}

export function clearPendingOAuthRegister(): void {
  pendingRegister = null;
}
