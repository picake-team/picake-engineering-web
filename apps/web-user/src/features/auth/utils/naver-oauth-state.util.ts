/**
 * 네이버 로그인 state — 로그인 요청에 붙이는 이 탭만의 임의 값(네이버 필수, 남이 만든 로그인 결과를 받지 않으려고).
 * 이 탭의 sessionStorage에 두고, 콜백에서 돌아온 state가 같은지 먼저 확인한 뒤 서버에 code와 함께 보낸다.
 * 로그인 버튼이 여러 곳(로그인 창·로그인 화면)에 있어도 같은 값을 쓰도록 한 번 만들면 재사용하고, 콜백에서 지운다.
 * 네이버 로그인은 같은 탭(앱 웹뷰·인앱 브라우저 포함, 네이버 앱으로 로그인해도 원래 화면이 이어 받음)으로 돌아와서 저장한 값이 남아 있다.
 */
const KEY = "picake:naver-oauth-state";

function randomState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** 이 탭의 state(없으면 만들어 저장). 저장소를 못 쓰면 저장 없이 새 값 */
export function getOrCreateNaverOAuthState(): string {
  try {
    const saved = window.sessionStorage.getItem(KEY);
    if (saved) return saved;
    const state = randomState();
    window.sessionStorage.setItem(KEY, state);
    return state;
  } catch {
    return randomState();
  }
}

/**
 * 콜백으로 돌아온 state가 이 탭이 만든 값과 같은지.
 * 저장소를 아예 못 쓰는 브라우저(사생활 보호 모드 등)는 확인할 수 없어 통과시킨다 — 그 밖에 없거나 다르면 false.
 */
export function isNaverOAuthStateValid(returned: string | null | undefined): boolean {
  let saved: string | null;
  try {
    saved = window.sessionStorage.getItem(KEY);
  } catch {
    return Boolean(returned);
  }
  return Boolean(returned) && saved === returned;
}

/** 콜백을 처리하면 지운다 — 다음 로그인은 새 값으로 */
export function clearNaverOAuthState(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // 지울 수 없으면 다음 로그인도 같은 값을 쓴다(확인은 그대로 됨)
  }
}
