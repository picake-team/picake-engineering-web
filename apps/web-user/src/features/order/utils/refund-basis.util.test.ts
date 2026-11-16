import { describe, expect, it } from "vitest";
import { getRefundBasis, refundNoticeMessage } from "./refund-basis.util";

const none = {
  sellerCancelReason: null,
  sellerCancelRefundPendingReason: null,
  paymentPendingExpiredAt: null,
};

describe("refund-basis.util (2026-11-16)", () => {
  it("가게가 취소한 예약은 결제한 금액을 돌려받는다", () => {
    expect(getRefundBasis({ ...none, sellerCancelRefundPendingReason: "재료가 없어요" })).toBe(
      "store-cancel",
    );
    expect(getRefundBasis({ ...none, sellerCancelReason: "영업 사정" })).toBe("store-cancel");
    expect(
      refundNoticeMessage({ ...none, sellerCancelReason: "영업 사정", totalPrice: 42000 }),
    ).toBe("결제 금액 42,000원 · 가게 사정으로 취소되어 결제한 금액을 돌려받아요");
  });

  it("입금 마감으로 자동 취소됐다가 입금이 확인된 예약도 결제한 금액을 돌려받는다", () => {
    const order = { ...none, paymentPendingExpiredAt: "2026-11-15T10:00:00.000Z" };
    expect(getRefundBasis(order)).toBe("payment-expired");
    expect(refundNoticeMessage({ ...order, totalPrice: 30000 })).toBe(
      "결제 금액 30,000원 · 입금이 확인되어 결제한 금액을 돌려받아요",
    );
  });

  it("손님이 취소·환불을 요청한 예약만 가게 환불 규정대로", () => {
    expect(getRefundBasis(none)).toBe("store-rules");
    expect(getRefundBasis({})).toBe("store-rules");
    expect(refundNoticeMessage({ ...none, totalPrice: 35000 })).toBe(
      "결제 금액 35,000원 · 환불 금액은 가게 환불 규정대로 정해요",
    );
  });
});
