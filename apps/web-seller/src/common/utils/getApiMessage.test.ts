import { describe, expect, it } from "vitest";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";

describe("getApiMessage.error", () => {
  it("입력 검사 오류의 배열 메시지: 한국어 첫 줄은 그대로, 영어면 안내 문구로(11-16 검토)", () => {
    expect(
      getApiMessage.error({
        response: {
          status: 400,
          data: { data: { message: ["예금주명은 2자 이상이어야 해요.", "x"] } },
        },
      }),
    ).toBe("예금주명은 2자 이상이어야 해요.");
    expect(
      getApiMessage.error({
        response: {
          status: 400,
          data: {
            data: {
              message: ["reservationContactName must be shorter than or equal to 50 characters"],
            },
          },
        },
      }),
    ).toBe("일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
  });

  it("서버가 준 한국어 문구는 그대로", () => {
    const error = {
      response: { status: 400, data: { data: { message: "주문이 있는 상품은 지울 수 없어요." } } },
    };
    expect(getApiMessage.error(error)).toBe("주문이 있는 상품은 지울 수 없어요.");
  });
  it("500 오류·영어 원문은 안내 문구로 바꾼다", () => {
    const fallback = "일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";
    expect(
      getApiMessage.error({
        response: { status: 500, data: { message: "Internal server error" } },
      }),
    ).toBe(fallback);
    expect(
      getApiMessage.error({
        response: { status: 400, data: { message: "name should not be empty" } },
      }),
    ).toBe(fallback);
    expect(getApiMessage.error({ message: "Request failed with status code 500" })).toBe(fallback);
  });
  it("끊김·시간 초과는 그 안내", () => {
    expect(getApiMessage.error({ code: "ERR_NETWORK" })).toBe("인터넷 연결을 확인해 주세요.");
  });
});
