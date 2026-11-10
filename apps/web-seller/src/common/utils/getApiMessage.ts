const LOGIN_REQUIRED_MESSAGE = "로그인한 뒤 이용해 주세요.";
const TIMEOUT_MESSAGE = "요청 시간이 초과되었어요. 잠시 후 다시 시도해 주세요.";
const NETWORK_MESSAGE = "인터넷 연결을 확인해 주세요.";
const FALLBACK_MESSAGE = "일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";

const getApiMessage = {
  error(error: any) {
    const message = error?.response?.data?.data?.message || error?.response?.data?.message;

    // 토큰 관련 서버 원문([ACCESS_TOKEN_INVALID] ...)이 그대로 노출되지 않도록 안내 문구로 대체
    if (typeof message === "string" && message.includes("ACCESS_TOKEN_INVALID")) {
      return LOGIN_REQUIRED_MESSAGE;
    }
    // 서버 기본 영어 문구("Internal server error" 등)나 500 오류 원문은 보이지 않고 안내 문구로
    const status = error?.response?.status;
    if (typeof status === "number" && status >= 500) return FALLBACK_MESSAGE;
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
