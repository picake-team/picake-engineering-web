import { describe, expect, it } from "vitest";
import { cancelReasonForEvent } from "@/apps/web-user/features/order/utils/cancel-reason.util";

describe("cancelReasonForEvent", () => {
  it("고른 사유 이름은 그대로, 손님이 쓴 기타 글은 '기타'로", () => {
    expect(cancelReasonForEvent("단순 변심")).toBe("단순 변심");
    expect(cancelReasonForEvent("010-1234-5678로 연락 주세요")).toBe("기타");
  });
});
