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
  /** 백엔드 `AUTH_ERROR_MESSAGES.REGISTER_TICKET_INVALID`와 동일 — 가입표가 없거나 30분 지남(2026-11-16 계정 보강 ②) */
  REGISTER_TICKET_INVALID: "가입 시간이 지났어요. 다시 로그인해 주세요.",
} as const;

/** 회원가입 API가 가입표를 받지 않음(30분 지남·잘못됨) — 다시 로그인해야 한다 */
function isRegisterTicketInvalid(error: unknown): boolean {
  const e = error as {
    response?: { status?: number; data?: { data?: { message?: unknown }; message?: unknown } };
  };
  const message = e?.response?.data?.data?.message ?? e?.response?.data?.message;
  return (
    e?.response?.status === 400 &&
    typeof message === "string" &&
    message.includes(AUTH_ERROR_MESSAGES.REGISTER_TICKET_INVALID)
  );
}

export { AUTH_ERROR_MESSAGES, isRegisterTicketInvalid };
