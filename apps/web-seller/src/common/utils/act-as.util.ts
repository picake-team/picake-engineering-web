/**
 * 운영자 대신 입력(기획 I-41): 관리자 화면에서 "이 가게로 들어가기"로 연 탭.
 * 대리 출입증은 이 탭의 sessionStorage에만 둔다 — 사장님 출입증(localStorage)은 건드리지 않고, 탭을 닫으면 사라진다.
 * 출입증이 있는 동안은 이것을 먼저 쓴다(`token.util`), PostHog·알림 토큰 등록·실시간 알림을 끈다.
 */

const TOKEN_KEY = "actAsToken";
const INFO_KEY = "actAsInfo";
/** 이 탭에서 대리 입력이 끝났다는 표시 — 뒤로 가기로 사장님 화면 주소에 돌아와도 로그인 화면이 아니라 끝난 화면으로 */
const ENDED_KEY = "actAsEnded";

/** 들어오기(코드 → 출입증)와 끝난 화면 주소(`ROUTES.ACT_AS`와 같음 — 이 파일은 경로 상수를 불러오지 않는다) */
export const ACT_AS_PATH = "/act-as";
export const ACT_AS_ENDED_PATH = "/act-as/ended";

export interface ActAsInfo {
  storeId: string;
  /** 세션이 끝나는 시각(ISO) */
  expiresAt: string;
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function getActAsToken(): string | null {
  try {
    return storage()?.getItem(TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

export function getActAsInfo(): ActAsInfo | null {
  try {
    const raw = storage()?.getItem(INFO_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<ActAsInfo>;
    return typeof v.storeId === "string" && typeof v.expiresAt === "string"
      ? { storeId: v.storeId, expiresAt: v.expiresAt }
      : null;
  } catch {
    return null;
  }
}

/** 저장하고 다시 읽어 맞으면 true. 저장소를 못 쓰면(사생활 보호 모드 등) false — 들어오기 화면이 실패로 알린다 */
export function setActAsSession(token: string, info: ActAsInfo): boolean {
  try {
    storage()?.removeItem(ENDED_KEY);
    storage()?.setItem(TOKEN_KEY, token);
    storage()?.setItem(INFO_KEY, JSON.stringify(info));
  } catch {
    return false;
  }
  return getActAsToken() === token && getActAsInfo()?.storeId === info.storeId;
}

export function clearActAsSession(): void {
  try {
    storage()?.removeItem(TOKEN_KEY);
    storage()?.removeItem(INFO_KEY);
  } catch {
    // 무시
  }
}

let endedInThisPage = false;

/**
 * 대리 입력을 끝내고(끝내기·시간 지남·서버 401) 끝난 화면으로 간다.
 * 끝낸 뒤 늦게 도착한 다른 요청의 401이 사장님 로그인 화면으로 보내지 않게 이 화면에서는 끝났다고 기억한다.
 */
export function endActAsAndLeave(): void {
  endedInThisPage = true;
  clearActAsSession();
  try {
    storage()?.setItem(ENDED_KEY, "1");
  } catch {
    // 표시를 못 남겨도 이 화면에서는 위 변수로 기억한다
  }
  if (typeof window !== "undefined" && window.location.pathname !== ACT_AS_ENDED_PATH) {
    window.location.replace(ACT_AS_ENDED_PATH);
  }
}

/** 이 화면에서 대리 입력을 끝냈는지(출입증은 이미 지웠다) */
export function isActAsEndedInThisPage(): boolean {
  if (endedInThisPage) return true;
  try {
    return storage()?.getItem(ENDED_KEY) === "1";
  } catch {
    return false;
  }
}

/** 이 탭이 운영자 대신 입력 중인지(들어오기·끝난 화면 주소도 포함) */
export function isActAsMode(pathname?: string): boolean {
  if (getActAsToken()) return true;
  const path = pathname ?? (typeof window === "undefined" ? "" : window.location.pathname);
  return path === ACT_AS_PATH || path.startsWith(`${ACT_AS_PATH}/`);
}

/** 남은 분(올림, 0 이하면 0) */
export function remainingMinutes(expiresAt: string, now: number = Date.now()): number {
  const ms = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.ceil(ms / 60000);
}
