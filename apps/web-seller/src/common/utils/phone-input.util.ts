/**
 * 번호 칸 입력·기기 자동완성 도우미.
 * 번호 칸에 `autoComplete="tel"`을 붙이면 아이폰·크롬이 기기에 저장된 내 번호를 키보드 위에 띄운다.
 * 이때 "010-1234-5678"이나 "+82 10-1234-5678"처럼 채워지기도 해서, 국가번호(+82)는 0으로 바꾸고 하이픈은 뺀다.
 */

/** 자동완성 값이 하이픈·국가번호로 와도 잘리지 않을 칸 길이("+82 010-1234-5678" = 17자) */
export const PHONE_INPUT_MAX_LENGTH = 20;

/**
 * 국가번호로 시작하는 한국 휴대폰 번호("+82 10-1234-5678", "821012345678")를 국내 숫자("01012345678")로.
 * 그 밖의 값은 그대로 돌려준다(손으로 쓴 하이픈은 남긴다).
 */
export function fromAutofillPhone(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+82")) {
    const rest = trimmed.slice(3).replace(/\D/g, "").replace(/^0/, "");
    // 손으로 "+82"부터 치는 중이면(뒷자리가 아직 짧으면) 그대로 둔다 — 칸이 지워지지 않게
    return rest.length >= 9 ? `0${rest}` : raw;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (/^821[016789]\d{7,8}$/.test(digits)) return `0${digits.slice(2)}`;
  return raw;
}

/** 번호 칸 값 → 국내 휴대폰 숫자만(최대 11자리). 하이픈·공백·국가번호 자동완성도 받는다 */
export function toPhoneDigits(raw: string): string {
  return fromAutofillPhone(raw).replace(/\D/g, "").slice(0, 11);
}
