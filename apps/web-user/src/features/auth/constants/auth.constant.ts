/** 손님 화면에 보이는 입력 안내 글(화면 글, 해요체로 바꿔도 된다) */
const AUTH_ERROR_MESSAGES = {
  PHONE_INVALID_FORMAT: "올바른 휴대폰번호 형식을 입력해주세요. (예: 01012345678)",
  VERIFICATION_CODE_INVALID_FORMAT: "올바른 인증번호 형식을 입력해주세요. (예: 123456)",
  NAME_REQUIRED: "이름을 입력해주세요.",
  NAME_MAX_LENGTH: "이름은 50자 이하로 입력해주세요.",
} as const;

/**
 * 서버(backend `AUTH_ERROR_MESSAGES`)가 보내는 오류 글과 맞춰 보는 값. 화면 글이 아니다.
 * 이 글이 서버와 한 글자라도 다르면 소셜 가입(휴대폰 인증으로 넘어가기)·이미 가입한 계정 안내가 깨진다.
 * 서버 문구를 해요체로 바꾸는 중이라(backend #65, 2026-11-11) 옛 글과 새 글을 모두 알아본다.
 * 서버 글을 바꾸면 여기에 새 글을 먼저 더하고, 서버가 나간 뒤 옛 글을 지운다.
 */
const SERVER_AUTH_MESSAGES = {
  PHONE_VERIFICATION_REQUIRED: ["휴대폰 인증이 필요합니다.", "휴대폰 인증이 필요해요."],
  PHONE_VERIFICATION_EXPIRED: ["인증번호가 만료되었습니다.", "인증번호가 만료됐어요."],
  PHONE_KAKAO_ACCOUNT_EXISTS: [
    "해당 휴대폰 번호로 이미 등록된 카카오 계정이 있습니다.",
    "해당 휴대폰 번호로 이미 등록된 카카오 계정이 있어요.",
  ],
  PHONE_GOOGLE_ACCOUNT_EXISTS: [
    "해당 휴대폰 번호로 이미 등록된 구글 계정이 있습니다.",
    "해당 휴대폰 번호로 이미 등록된 구글 계정이 있어요.",
  ],
  PHONE_APPLE_ACCOUNT_EXISTS: [
    "해당 휴대폰 번호로 이미 등록된 애플 계정이 있습니다.",
    "해당 휴대폰 번호로 이미 등록된 애플 계정이 있어요.",
  ],
} as const satisfies Record<string, readonly string[]>;

/** 서버 오류 글이 그 종류인지(옛 글·새 글 모두) */
function isServerAuthMessage(
  message: unknown,
  kind: keyof typeof SERVER_AUTH_MESSAGES,
): message is string {
  return (
    typeof message === "string" &&
    (SERVER_AUTH_MESSAGES[kind] as readonly string[]).includes(message)
  );
}

export { AUTH_ERROR_MESSAGES, SERVER_AUTH_MESSAGES, isServerAuthMessage };
