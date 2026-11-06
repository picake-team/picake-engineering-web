import { describe, expect, it } from "vitest";
import {
  OrderStatus,
  type OrderResponseDto,
} from "@/apps/web-seller/features/order/types/order.dto";
import {
  detailActionsFor,
  groupsForTab,
  orderCardMeta,
  orderItemsLine,
  orderItemsShort,
  orderStepState,
  searchParamsFor,
  statusTone,
  tabForStatus,
  telHref,
} from "@/apps/web-seller/features/order/utils/order-mobile.util";

function order(partial: Partial<OrderResponseDto>): OrderResponseDto {
  return {
    id: "o1",
    productName: "무화과 케이크",
    totalQuantity: 1,
    totalPrice: 48000,
    orderStatus: OrderStatus.RESERVATION_REQUESTED,
    createdAt: new Date("2026-11-06T00:12:00.000Z"),
    orderItems: [],
    ...partial,
  } as OrderResponseDto;
}

describe("탭과 할 일 칸", () => {
  it("처리할 것 4칸, 진행 중 2칸, 나머지는 지난 주문", () => {
    expect(groupsForTab("todo").map((g) => g.label)).toEqual([
      "예약 확인",
      "입금 확인",
      "픽업 처리",
      "환불 처리",
    ]);
    expect(groupsForTab("doing").map((g) => g.label)).toEqual([
      "입금 기다리는 중",
      "픽업 기다리는 중",
    ]);
    expect(tabForStatus(OrderStatus.NO_SHOW)).toBe("past");
    expect(tabForStatus(OrderStatus.CANCEL_REFUND_PENDING)).toBe("todo");
  });

  it("배지 색은 누가 할 차례인지", () => {
    expect(statusTone(OrderStatus.PAYMENT_COMPLETED)).toBe("turn");
    expect(statusTone(OrderStatus.PAYMENT_PENDING)).toBe("wait");
    expect(statusTone(OrderStatus.CONFIRMED)).toBe("wait");
    expect(statusTone(OrderStatus.PICKUP_COMPLETED)).toBe("done");
  });
});

describe("단계 막대", () => {
  it("정상 단계는 지금 단계까지 칠하고 지금 단계를 표시", () => {
    expect(orderStepState(order({ orderStatus: OrderStatus.PAYMENT_COMPLETED }))).toEqual({
      current: 2,
      filledThrough: 2,
    });
  });

  it("단계 밖 상태는 지나온 곳까지만, 지금 단계 표시 없음", () => {
    expect(orderStepState(order({ orderStatus: OrderStatus.CANCEL_REFUND_PENDING }))).toEqual({
      current: null,
      filledThrough: 2,
    });
    expect(orderStepState(order({ orderStatus: OrderStatus.CANCEL_COMPLETED }))).toEqual({
      current: null,
      filledThrough: 0,
    });
    expect(
      orderStepState(
        order({ orderStatus: OrderStatus.CANCEL_COMPLETED, paymentPendingAt: "2026-11-06" }),
      ),
    ).toEqual({ current: null, filledThrough: 1 });
    expect(orderStepState(order({ orderStatus: OrderStatus.NO_SHOW }))).toEqual({
      current: null,
      filledThrough: 4,
    });
  });
});

describe("처리 버튼", () => {
  it("상태마다 지금 PC와 같은 처리, 주 버튼은 오른쪽 하나", () => {
    expect(detailActionsFor(OrderStatus.RESERVATION_REQUESTED)).toEqual({
      primary: OrderStatus.PAYMENT_PENDING,
      secondary: OrderStatus.CANCEL_COMPLETED,
      more: undefined,
    });
    expect(detailActionsFor(OrderStatus.PAYMENT_PENDING).primary).toBe(OrderStatus.CONFIRMED);
    expect(detailActionsFor(OrderStatus.PAYMENT_COMPLETED)).toMatchObject({
      primary: OrderStatus.CONFIRMED,
      secondary: OrderStatus.CANCEL_REFUND_PENDING,
    });
    expect(detailActionsFor(OrderStatus.PICKUP_PENDING)).toEqual({
      primary: OrderStatus.PICKUP_COMPLETED,
      secondary: undefined,
      more: [OrderStatus.NO_SHOW, OrderStatus.CANCEL_REFUND_PENDING],
    });
    expect(detailActionsFor(OrderStatus.CANCEL_REFUND_PENDING).primary).toBe(
      OrderStatus.CANCEL_REFUND_COMPLETED,
    );
  });

  it("끝난 주문은 버튼 없음", () => {
    for (const s of [
      OrderStatus.PICKUP_COMPLETED,
      OrderStatus.NO_SHOW,
      OrderStatus.CANCEL_COMPLETED,
      OrderStatus.CANCEL_REFUND_COMPLETED,
    ]) {
      expect(detailActionsFor(s)).toEqual({
        primary: undefined,
        secondary: undefined,
        more: undefined,
      });
    }
  });
});

describe("카드 글자", () => {
  it("사이즈가 하나면 이름 뒤에, 이름에 이미 있으면 빼고", () => {
    expect(
      orderItemsLine(
        order({ orderItems: [{ sizeDisplayName: "2호" }] as OrderResponseDto["orderItems"] }),
      ),
    ).toBe("무화과 케이크 2호 ×1");
    expect(
      orderItemsLine(
        order({
          productName: "레터링 미니 케이크",
          totalQuantity: 2,
          orderItems: [
            { sizeDisplayName: "미니" },
            { sizeDisplayName: "미니" },
          ] as OrderResponseDto["orderItems"],
        }),
      ),
    ).toBe("레터링 미니 케이크 ×2");
    expect(
      orderItemsLine(
        order({
          totalQuantity: 2,
          orderItems: [
            { sizeDisplayName: "1호" },
            { sizeDisplayName: "2호" },
          ] as OrderResponseDto["orderItems"],
        }),
      ),
    ).toBe("무화과 케이크 ×2");
  });

  it("홈 픽업 줄은 개수가 여럿일 때만 'n개'", () => {
    expect(
      orderItemsShort(
        order({
          productName: "딸기 생크림 케이크",
          orderItems: [{ sizeDisplayName: "1호" }] as OrderResponseDto["orderItems"],
        }),
      ),
    ).toBe("딸기 생크림 케이크 1호");
    expect(
      orderItemsShort(
        order({
          productName: "레터링 미니 케이크",
          totalQuantity: 2,
          orderItems: [{ sizeDisplayName: "미니" }] as OrderResponseDto["orderItems"],
        }),
      ),
    ).toBe("레터링 미니 케이크 2개");
  });

  it("상태마다 필요한 정보", () => {
    const now = new Date("2026-11-06T03:00:00.000Z").getTime();
    expect(orderCardMeta(order({}), now)).toBe("주문 11월 6일 09:12");
    expect(
      orderCardMeta(
        order({ orderStatus: OrderStatus.PAYMENT_COMPLETED, depositorName: "김○○" }),
        now,
      ),
    ).toBe("입금자명 김○○");
    expect(
      orderCardMeta(
        order({
          orderStatus: OrderStatus.PAYMENT_PENDING,
          paymentPendingDeadlineAt: "2026-11-06T05:41:30.000Z",
        }),
        now,
      ),
    ).toBe("입금 마감까지 2시간 41분");
    expect(
      orderCardMeta(
        order({ orderStatus: OrderStatus.CONFIRMED, reservationContactName: "박○○" }),
        now,
      ),
    ).toBe("예약자 박○○");
  });
});

describe("검색·연락", () => {
  it("ORD-로 시작하면 주문번호, 아니면 상품명", () => {
    expect(searchParamsFor(" ord-20261106-012 ")).toEqual({ orderNumber: "ORD-20261106-012" });
    expect(searchParamsFor("딸기")).toEqual({ productName: "딸기" });
    expect(searchParamsFor("  ")).toEqual({});
  });

  it("전화·문자 링크는 숫자만", () => {
    expect(telHref("010-1234-5678", "tel")).toBe("tel:01012345678");
    expect(telHref("010 1234 5678", "sms")).toBe("sms:01012345678");
  });
});
