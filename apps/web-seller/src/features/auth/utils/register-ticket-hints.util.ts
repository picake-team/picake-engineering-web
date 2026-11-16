/**
 * 가입표(registerToken) 안 카카오가 준 값(화면 표시용, 기획 I-59 B).
 * 서명 확인은 서버가 하고 화면은 읽기만 한다 — 여기 값을 고쳐 보내도 서버는 가입표 원본만 쓴다.
 */
export interface RegisterTicketHints {
  /** 카카오가 준 국내 휴대폰 번호(숫자만) */
  phone?: string;
  name?: string;
  /** 카카오 간편가입에서 동의한 약관 태그 */
  terms?: string[];
}

function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const binary = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function readRegisterTicketHints(token: string): RegisterTicketHints {
  const p = decodePayload(token);
  if (!p) return {};
  return {
    ...(typeof p.phone === "string" && /^01\d{8,9}$/.test(p.phone) ? { phone: p.phone } : {}),
    ...(typeof p.name === "string" && p.name.trim() ? { name: p.name.trim() } : {}),
    ...(Array.isArray(p.terms)
      ? { terms: p.terms.filter((t): t is string => typeof t === "string") }
      : {}),
  };
}

/** 사장님 필수 약관(카카오 간편가입 태그, backend KAKAO_SERVICE_TERMS.seller와 같게) */
export const KAKAO_SELLER_REQUIRED_TERMS = ["picake_s_tos", "picake_s_privacy"] as const;

/** 카카오에서 사장님 필수 약관에 모두 동의했으면 가입 화면에서 약관을 다시 받지 않는다 */
export function hasAllKakaoSellerTerms(terms: string[] | undefined): boolean {
  const agreed = new Set(terms ?? []);
  return KAKAO_SELLER_REQUIRED_TERMS.every((t) => agreed.has(t));
}

/** "01012345678" → "010-****-5678" */
export function maskPhoneForDisplay(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length < 10) return phone;
  return `${d.slice(0, 3)}-****-${d.slice(-4)}`;
}
