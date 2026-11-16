/**
 * 네이버 로그인 state — 로그인 요청에 붙이는 이 탭만의 임의 값(네이버 필수, 남이 만든 로그인 결과를 받지 않으려고).
 * 이 탭의 sessionStorage에 두고, 콜백에서 돌아온 state가 이 탭이 만든 값인지 먼저 확인한 뒤 서버에 code와 함께 보낸다.
 * 네이버 로그인은 같은 탭(앱 웹뷰·인앱 브라우저 포함, 네이버 앱으로 로그인해도 원래 화면이 이어 받음)으로 돌아와서 저장한 값이 남아 있다.
 *
 * 값 하나만 두고 콜백마다 지우면, 네이버 동의 화면에서 "취소"한 뒤 다시 시도할 때 네이버가 앞 시도의 state를 돌려줘
 * "로그인을 확인하지 못했어요"가 떴다(2026-11-16 staging, 운영자 첫 가입). 그래서 이 탭이 만든 값을 30분 동안 몇 개 기억하고
 * 그중 하나와 같으면 통과시킨다. 통과한 값만 지운다(취소·실패로 돌아온 값은 남겨 다시 시도할 때 쓴다).
 * 이 탭 밖에서는 값을 알 수 없으니 남이 만든 로그인 결과를 막는 것은 그대로다.
 */
const KEY = "picake:naver-oauth-state";
/** 동의 화면에서 휴대폰 확인까지 하는 사람도 넉넉히(가입표 수명과 같게) */
const TTL_MS = 30 * 60 * 1000;
const MAX_STATES = 5;

interface IssuedState {
  s: string;
  t: number;
}

function randomState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** 저장된 값 목록(오래된 것은 뺌). 예전 모양(값 하나 문자열)도 읽는다 */
function readStates(storage: Storage, now: number): IssuedState[] {
  const raw = storage.getItem(KEY);
  if (!raw) return [];
  let list: IssuedState[];
  try {
    const parsed: unknown = JSON.parse(raw);
    list = Array.isArray(parsed)
      ? parsed.filter(
          (x): x is IssuedState =>
            typeof x === "object" &&
            x !== null &&
            typeof (x as IssuedState).s === "string" &&
            typeof (x as IssuedState).t === "number",
        )
      : [];
  } catch {
    list = /^[0-9a-f]{32}$/.test(raw) ? [{ s: raw, t: now }] : [];
  }
  return list.filter((x) => now - x.t >= 0 && now - x.t <= TTL_MS);
}

function writeStates(storage: Storage, list: IssuedState[]): void {
  if (list.length === 0) storage.removeItem(KEY);
  else storage.setItem(KEY, JSON.stringify(list.slice(-MAX_STATES)));
}

/**
 * 로그인 시작 주소에 붙일 state. 아직 쓰지 않은 값이 있으면 가장 최근 값을 다시 쓰고(로그인 버튼이 여러 곳이어도 같은 값),
 * 없으면 새로 만들어 저장한다. 저장소를 못 쓰면 저장 없이 새 값(콜백에서 막힌다).
 */
export function getOrCreateNaverOAuthState(): string {
  try {
    const storage = window.sessionStorage;
    const now = Date.now();
    const list = readStates(storage, now);
    const latest = list[list.length - 1];
    if (latest) return latest.s;
    const state = randomState();
    writeStates(storage, [...list, { s: state, t: now }]);
    return state;
  } catch {
    return randomState();
  }
}

/**
 * 콜백으로 돌아온 state가 이 탭이 30분 안에 만든 값 중 하나인지. 없거나 다르면 false.
 * 저장소를 아예 못 쓰는 브라우저(모든 쿠키·사이트 데이터 차단 등)는 확인할 수 없어 막는다(남이 만든 로그인 결과를 받지 않게, 11-16 검토).
 */
export function isNaverOAuthStateValid(returned: string | null | undefined): boolean {
  if (!returned) return false;
  try {
    return readStates(window.sessionStorage, Date.now()).some((x) => x.s === returned);
  } catch {
    return false;
  }
}

/** 확인을 통과한 state를 지운다 — 같은 로그인 결과를 두 번 쓰지 않고, 다음 로그인은 새 값 */
export function consumeNaverOAuthState(used: string): void {
  try {
    const storage = window.sessionStorage;
    writeStates(
      storage,
      readStates(storage, Date.now()).filter((x) => x.s !== used),
    );
  } catch {
    // 지울 수 없으면 30분 뒤 저절로 못 쓰게 된다
  }
}
