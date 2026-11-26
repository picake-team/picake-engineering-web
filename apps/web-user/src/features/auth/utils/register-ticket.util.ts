import { decodeJwtPayload } from "@/apps/web-user/features/auth/utils/jwt.util";

export type RegisterTicketProvider = "kakao" | "naver" | "google" | "apple";

/**
 * 가입표(registerToken)를 로그인 콜백 → 가입 화면으로 넘긴다.
 * 가입표에는 카카오가 준 전화번호·이름이 들어 있을 수 있어 주소(쿼리)에 싣지 않고 이 탭의 sessionStorage에 둔다.
 * 저장이 안 되는 브라우저(사생활 보호 모드 등)는 예전처럼 주소로 넘긴다.
 */
const KEY = (provider: RegisterTicketProvider) => `picake:register-ticket:${provider}`;
/** 이 기기가 가입표를 받은 시각(기기 시계) — 남은 시간을 기기 시계가 틀려도 맞게 세려고 */
const SAVED_AT_KEY = (provider: RegisterTicketProvider) =>
  `picake:register-ticket:${provider}:saved-at`;
const PROVIDERS: readonly RegisterTicketProvider[] = ["kakao", "naver", "google", "apple"];

/** 저장했으면 true — false면 주소로 넘긴다 */
export function saveRegisterTicket(provider: RegisterTicketProvider, token: string): boolean {
  try {
    window.sessionStorage.setItem(KEY(provider), token);
    window.sessionStorage.setItem(SAVED_AT_KEY(provider), String(Date.now()));
    return window.sessionStorage.getItem(KEY(provider)) === token;
  } catch {
    return false;
  }
}

/** 이 가입표를 이 기기가 받은 시각. 저장된 가입표가 이것과 같을 때만(주소로 넘어온 다른 가입표면 null) */
export function readRegisterTicketSavedAt(
  provider: RegisterTicketProvider,
  token: string,
): number | null {
  try {
    if (window.sessionStorage.getItem(KEY(provider)) !== token) return null;
    const v = Number(window.sessionStorage.getItem(SAVED_AT_KEY(provider)));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

/** 저장한 가입표, 없으면 주소의 registerToken(저장이 안 됐거나 배포 사이에 넘어온 경우) */
export function readRegisterTicket(
  provider: RegisterTicketProvider,
  fromQuery: string | null | undefined,
): string | null {
  try {
    const saved = window.sessionStorage.getItem(KEY(provider));
    if (saved) return saved;
  } catch {
    // 저장소를 못 쓰면 주소에서
  }
  const q = fromQuery?.trim();
  return q ? q : null;
}

export function clearRegisterTicket(provider: RegisterTicketProvider): void {
  try {
    window.sessionStorage.removeItem(KEY(provider));
    window.sessionStorage.removeItem(SAVED_AT_KEY(provider));
  } catch {
    // 지울 수 없으면 30분 뒤 서버가 받지 않는다
  }
}

/** 로그인에 성공하면 앞서 가입하다 만 가입표(번호·이름·이메일이 들어 있음)를 이 탭에 남기지 않는다 */
export function clearAllRegisterTickets(): void {
  for (const p of PROVIDERS) clearRegisterTicket(p);
}

/**
 * 가입표 안 소셜 서비스가 준 값(화면 표시용). 서명 확인은 서버가 하고, 화면은 읽기만 한다 —
 * 여기 값을 고쳐 보내도 서버는 가입표 원본만 쓴다.
 */
export interface RegisterTicketHints {
  /** 카카오·네이버가 준 국내 휴대폰 번호(숫자만) */
  phone?: string;
  name?: string;
  /** 카카오 간편가입에서 동의한 약관 태그 */
  terms?: string[];
}

export function readRegisterTicketHints(token: string): RegisterTicketHints {
  const p = decodeJwtPayload<{ phone?: unknown; name?: unknown; terms?: unknown }>(token);
  if (!p) return {};
  return {
    ...(typeof p.phone === "string" && /^01\d{8,9}$/.test(p.phone) ? { phone: p.phone } : {}),
    ...(typeof p.name === "string" && p.name.trim() ? { name: p.name.trim() } : {}),
    ...(Array.isArray(p.terms) ? { terms: p.terms.filter((t) => typeof t === "string") } : {}),
  };
}

/**
 * 가입표 30분이 지났는지(화면 표시용 — 판단은 서버). 가입 화면을 열 때 이미 지났으면 문자를 보내기 전에 다시 로그인하게 한다.
 * 이 기기가 받은 시각(`savedAtMs`)을 알면 받은 뒤 지난 시간으로 센다 — 기기 시계가 크게 틀려도(30분 넘게 빠름) 가입이 막히지 않게(11-16 검토).
 * 모르면 가입표의 만료 시각과 기기 시계를 비교한다. 어느 쪽이든 30초 여유.
 */
export function isRegisterTicketExpired(
  token: string,
  nowMs = Date.now(),
  savedAtMs: number | null = null,
): boolean {
  const p = decodeJwtPayload<{ exp?: unknown; iat?: unknown }>(token);
  if (!p || typeof p.exp !== "number") return false;
  if (savedAtMs !== null && typeof p.iat === "number") {
    return nowMs - savedAtMs > (p.exp - p.iat) * 1000 + 30_000;
  }
  return p.exp * 1000 + 30_000 < nowMs;
}

/**
 * 손님 필수 약관(카카오 간편가입 태그, backend KAKAO_SERVICE_TERMS.consumer와 같게).
 * 만 14세 이상(카카오 전용 연령 동의, 태그 user_age_check 고정 — 손님·사장님 같이, 법무 LG-02)은 웹이 먼저 필수로 본다 — 카카오에서 받지 못했으면 가입 화면 약관 칸에서 받는다
 * (서버는 1단계에서 기록만 하고 막지 않음).
 */
export const KAKAO_CONSUMER_REQUIRED_TERMS = [
  "user_age_check",
  "picake_c_tos",
  "picake_c_privacy",
  "picake_c_third_party",
] as const;

/** 카카오에서 손님 필수 약관에 모두 동의했으면 가입 화면에서 약관을 다시 받지 않는다 */
export function hasAllKakaoConsumerTerms(terms: string[] | undefined): boolean {
  const agreed = new Set(terms ?? []);
  return KAKAO_CONSUMER_REQUIRED_TERMS.every((t) => agreed.has(t));
}

/**
 * "01012345678" → "010-1234-5678". 가입하는 본인에게 보여 주는 화면이라 가리지 않는다 —
 * 카카오에 예전 번호가 남아 있으면 본인이 알아보고 "다른 번호"를 고를 수 있게(운영자 결정 11-16).
 */
export function formatPhoneForDisplay(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}
