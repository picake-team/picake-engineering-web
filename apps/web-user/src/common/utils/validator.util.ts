export const PATTERNS = {
  USER_ID_PATTERN: /^[a-zA-Z0-9_]{4,20}$/,
  PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  // 한국 휴대폰 번호: 010은 11자리만(한 자리 빠진 010 번호로 알림톡이 아무에게도 안 가던 것, 11-16 검토),
  // 옛 번호 011·016~019는 10·11자리(서버 IsValidKoreanPhone과 같게)
  PHONE_PATTERN: /^(010\d{8}|01[16-9]\d{7,8})$/,
  VERIFICATION_CODE_PATTERN: /^\d{6}$/, // 6자리 숫자 패턴
} as const;

export const normalizePhone = (phone: string): string => phone.replace(/[\s\-()]/g, "");

export const isValidUserId = (userId: string) => PATTERNS.USER_ID_PATTERN.test(userId);
export const isValidPassword = (password: string) => PATTERNS.PASSWORD_PATTERN.test(password);
export const isValidPhone = (phone: string) => PATTERNS.PHONE_PATTERN.test(phone);
export const isValidVerificationCode = (verificationCode: string) =>
  PATTERNS.VERIFICATION_CODE_PATTERN.test(verificationCode);
