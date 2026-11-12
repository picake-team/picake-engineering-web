import { describe, expect, it } from "vitest";
import { toastIconFor } from "@/apps/web-seller/common/ui/toast-icon.util";

const noop = () => undefined;

describe("toastIconFor", () => {
  it("채팅 새 문의는 홈 답할 채팅 아이콘(서버 제목 '새 문의가 왔어요')", () => {
    expect(
      toastIconFor({
        severity: "info",
        title: "새 문의가 왔어요",
        message: "달콤한_마카롱_0000",
        onClick: noop,
      }),
    ).toEqual({ kind: "task", name: "chat" });
  });

  it("주문 알림은 홈 처리할 주문 아이콘과 같게", () => {
    expect(
      toastIconFor({
        severity: "info",
        title: "새 예약 신청이 왔어요",
        message: "케이크",
        onClick: noop,
      }),
    ).toEqual({ kind: "task", name: "confirm" });
    expect(
      toastIconFor({
        severity: "info",
        title: "손님이 입금했어요",
        message: "케이크",
        onClick: noop,
      }),
    ).toEqual({ kind: "task", name: "deposit" });
    expect(
      toastIconFor({
        severity: "info",
        title: "손님이 환불을 요청했어요",
        message: "케이크",
        onClick: noop,
      }),
    ).toEqual({ kind: "task", name: "refund" });
    expect(
      toastIconFor({
        severity: "info",
        title: "[2호점] 손님이 주문을 취소했어요",
        message: "케이크",
        onClick: noop,
      }),
    ).toEqual({ kind: "line", name: "close" });
    expect(
      toastIconFor({
        severity: "info",
        title: "입금 기한이 지나 주문이 취소됐어요",
        message: "케이크 · 14:00 픽업",
        onClick: noop,
      }),
    ).toEqual({ kind: "line", name: "close" });
    expect(
      toastIconFor({
        severity: "info",
        title: "예약이 확정됐어요",
        message: "케이크 · 14:00 픽업",
        onClick: noop,
      }),
    ).toEqual({ kind: "task", name: "confirm" });
    expect(
      toastIconFor({
        severity: "info",
        title: "픽업이 완료됐어요",
        message: "케이크",
        onClick: noop,
      }),
    ).toEqual({ kind: "task", name: "pickup" });
  });
  it("한 일·문제에 맞는 선 아이콘", () => {
    expect(toastIconFor({ severity: "success", message: "스토어 링크를 복사했어요" })).toEqual({
      kind: "line",
      name: "copy",
    });
    expect(toastIconFor({ severity: "success", message: "상품을 삭제했어요" })).toEqual({
      kind: "line",
      name: "trash",
    });
    expect(toastIconFor({ severity: "success", message: "상품을 저장했어요" })).toEqual({
      kind: "line",
      name: "check",
    });
    expect(toastIconFor({ severity: "error", message: "인터넷 연결을 확인해 주세요" })).toEqual({
      kind: "line",
      name: "offline",
    });
    expect(toastIconFor({ severity: "error", message: "일시적인 오류가 발생했어요" })).toEqual({
      kind: "line",
      name: "warning",
    });
  });
});
