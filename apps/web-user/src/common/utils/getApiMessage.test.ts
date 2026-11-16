import { describe, expect, it } from "vitest";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";

const FALLBACK = "일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";

describe("getApiMessage.error(손님)", () => {
  it("서버가 준 한국어 문구는 그대로, 영어 원문·500은 안내 문구로", () => {
    expect(
      getApiMessage.error({
        response: { status: 400, data: { data: { message: "이미 사용 중인 휴대폰 번호예요." } } },
      }),
    ).toBe("이미 사용 중인 휴대폰 번호예요.");
    expect(
      getApiMessage.error({ response: { status: 400, data: { message: "Bad Request" } } }),
    ).toBe(FALLBACK);
    expect(getApiMessage.error({ response: { status: 500, data: { message: "서버 오류" } } })).toBe(
      FALLBACK,
    );
  });

  it("입력 검사 오류의 배열 메시지: 영어 원문이 창에 보이지 않는다(11-16 검토)", () => {
    expect(
      getApiMessage.error({
        response: {
          status: 400,
          data: { data: { message: ["reason must be shorter than or equal to 1000 characters"] } },
        },
      }),
    ).toBe(FALLBACK);
    expect(
      getApiMessage.error({
        response: {
          status: 400,
          data: { data: { message: ["올바른 한국 휴대폰 번호 형식이 아닙니다."] } },
        },
      }),
    ).toBe("올바른 한국 휴대폰 번호 형식이 아닙니다.");
  });

  it("응답 없는 실패는 연결·시간 초과 안내", () => {
    expect(getApiMessage.error({ code: "ERR_NETWORK" })).toBe("인터넷 연결을 확인해 주세요.");
    expect(getApiMessage.error({ code: "ECONNABORTED" })).toContain("요청 시간이 초과");
  });
});
