import { decodeJwtPayload } from "@/apps/web-user/features/auth/utils/jwt.util";

export type RegisterTicketProvider = "kakao" | "google" | "apple";

/**
 * 가입표(registerToken)를 로그인 콜백 → 가입 화면으로 넘긴다.
 * 가입표에는 카카오가 준 전화번호·이름이 들어 있을 수 있어 주소(쿼리)에 싣지 않고 이 탭의 sessionStorage에 둔다.
 * 저장이 안 되는 브라우저(사생활 보호 모드 등)는 예전처럼 주소로 넘긴다.
 */
const KEY = (provider: RegisterTicketProvider) => `picake:register-ticket:${provider}`;

/** 저장했으면 true — false면 주소로 넘긴다 */
export function saveRegisterTicket(provider: RegisterTicketProvider, token: string): boolean {
  try {
    window.sessionStorage.setItem(KEY(provider), token);
    return window.sessionStorage.getItem(KEY(provider)) === token;
  } catch {
    return false;
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
  } catch {
    // 지울 수 없으면 30분 뒤 서버가 받지 않는다
  }
}

/**
 * 가입표 안 카카오가 준 값(화면 표시용). 서명 확인은 서버가 하고, 화면은 읽기만 한다 —
 * 여기 값을 고쳐 보내도 서버는 가입표 원본만 쓴다.
 */
export interface RegisterTicketHints {
  /** 카카오가 준 국내 휴대폰 번호(숫자만) */
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
 * 기기 시계가 조금 틀려도 막지 않게 30초 여유.
 */
export function isRegisterTicketExpired(token: string, nowMs = Date.now()): boolean {
  const p = decodeJwtPayload<{ exp?: unknown }>(token);
  if (!p || typeof p.exp !== "number") return false;
  return p.exp * 1000 + 30_000 < nowMs;
}

/** 손님 필수 약관(카카오 간편가입 태그, backend KAKAO_SERVICE_TERMS.consumer와 같게) */
export const KAKAO_CONSUMER_REQUIRED_TERMS = [
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
