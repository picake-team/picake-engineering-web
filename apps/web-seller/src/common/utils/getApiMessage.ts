const LOGIN_REQUIRED_MESSAGE = "로그인한 뒤 이용해 주세요.";
const TIMEOUT_MESSAGE = "요청 시간이 초과되었어요. 잠시 후 다시 시도해 주세요.";
const NETWORK_MESSAGE = "인터넷 연결을 확인해 주세요.";
const FALLBACK_MESSAGE = "일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";

const getApiMessage = {
  error(error: any) {
    const raw = error?.response?.data?.data?.message || error?.response?.data?.message;
    // 입력 검사(class-validator) 오류는 메시지가 배열이다 — 첫 줄만 쓰고 아래 영어 거르기를 받게 한다
    // (배열은 거르지 않아 "reason must be shorter than…" 같은 영어 원문이 창에 보이던 것, 11-16 검토)
    const message = Array.isArray(raw) ? raw.find((m: unknown) => typeof m === "string") : raw;

    // 토큰 관련 서버 원문([ACCESS_TOKEN_INVALID] ...)이 그대로 노출되지 않도록 안내 문구로 대체
    if (typeof message === "string" && message.includes("ACCESS_TOKEN_INVALID")) {
      return LOGIN_REQUIRED_MESSAGE;
    }
    // 서버 기본 영어 문구("Internal server error" 등)나 500 오류 원문은 보이지 않고 안내 문구로
    const status = error?.response?.status;
    // 502·503은 우리 서버가 일부러 보내는 안내("오늘은 AI 초안을 더 만들 수 없어요", "지금은 대화를 읽을 수 없어요. 직접 적어 주세요.")가
    // 있어 한국어면 그대로 보인다 — 모두 "잠시 후 다시 시도"로 바꾸면 하루 한도에 닿았는데 다시 하라고 했다(11-18 검토).
    // nginx 502·503은 본문이 HTML이라 글이 없어 아래 안내 문구로 간다
    const intentional =
      (status === 502 || status === 503) && typeof message === "string" && /[가-힣]/.test(message);
    if (typeof status === "number" && status >= 500 && !intentional) return FALLBACK_MESSAGE;
    if (typeof message === "string" && message && !/[가-힣]/.test(message)) return FALLBACK_MESSAGE;
    if (message) return message;

    // 서버 응답 없이 실패한 경우 axios 원문(Network Error, timeout of 10000ms exceeded)이 노출되므로 대체
    if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") return TIMEOUT_MESSAGE;
    if (error?.code === "ERR_NETWORK") return NETWORK_MESSAGE;

    // axios 원문("Request failed with status code 500")은 보이지 않는다
    return FALLBACK_MESSAGE;
  },
  success(data: any) {
    return data.message;
  },
};

export default getApiMessage;
