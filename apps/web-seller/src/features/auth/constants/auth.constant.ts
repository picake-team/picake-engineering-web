const AUTH_ERROR_MESSAGES = {
  LOGIN_REQUIRED: "로그인 해주세요.",
  PHONE_INVALID_FORMAT: "올바른 휴대폰번호 형식을 입력해 주세요. (예: 01012345678)",
  PHONE_REQUIRED: "휴대폰번호를 입력해 주세요.",
  VERIFICATION_CODE_REQUIRED: "인증번호를 입력해 주세요.",
  /** 백엔드 `AUTH_ERROR_MESSAGES.PHONE_VERIFICATION_REQUIRED` 와 동일 (구글 로그인 400 분기·폼 안내 공통) */
  PHONE_VERIFICATION_REQUIRED: "휴대폰 인증이 필요합니다.",
  VERIFICATION_CODE_INVALID_FORMAT: "올바른 인증번호 형식을 입력해 주세요. (예: 123456)",
  NAME_REQUIRED: "이름을 입력해 주세요.",
  NAME_MAX_LENGTH: "이름은 50자 이하로 입력해 주세요.",
  /** 백엔드 `AUTH_ERROR_MESSAGES.ACCOUNT_INACTIVE`와 동일 */
  ACCOUNT_INACTIVE: "비활성화된 계정입니다. 관리자에게 문의해 주세요.",
} as const;

export { AUTH_ERROR_MESSAGES };
