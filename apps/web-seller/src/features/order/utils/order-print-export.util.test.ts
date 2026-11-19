import { describe, expect, it } from "vitest";
import {
  OrderStatus,
  type OrderItemResponseDto,
  type OrderResponseDto,
} from "@/apps/web-seller/features/order/types/order.dto";
import type { ManualOrderDto } from "@/apps/web-seller/features/manual-order/types/manual-order.dto";
import {
  buildPrintSheets,
  phoneTail,
  printOrdersPath,
} from "@/apps/web-seller/features/order/utils/order-print.util";
import {
  buildOrdersCsv,
  csvCell,
  EXPORT_COLUMNS,
  splitDateRange,
  exportFileName,
} from "@/apps/web-seller/features/order/utils/order-export.util";

function item(over: Partial<OrderItemResponseDto> = {}): OrderItemResponseDto {
  return {
    id: "item-1",
    quantity: 1,
    itemPrice: 40000,
    optionsPrice: 2000,
    sizeDisplayName: "1호",
    selectedOptions: [
      { optionId: "o1", name: "맛", type: "SINGLE_SELECT", choices: [{ label: "초코", price: 0 }] },
      { optionId: "o2", name: "레터링", type: "TEXT", text: "엄마 생신 축하해요" },
      { optionId: "o3", name: "참고 사진", type: "IMAGE", imageUrls: ["https://img/a.jpg"] },
    ],
    imageUrls: ["https://img/a.jpg", "https://img/b.jpg"],
    requestMessage: "글씨는 분홍색으로",
    letteringMessage: null,
    ...over,
  } as unknown as OrderItemResponseDto;
}

function order(over: Partial<OrderResponseDto> = {}): OrderResponseDto {
  return {
    id: "o-1",
    storeId: "s-1",
    productName: "딸기 생크림 케이크",
    productImages: [],
    orderNumber: "ORD-1",
    totalQuantity: 1,
    totalPrice: 42000,
    orderStatus: OrderStatus.CONFIRMED,
    reservationContactName: "유나",
    reservationPhone: "010-1234-2231",
    // 한국 시각 2026-11-20 14:00
    pickupDate: new Date("2026-11-20T05:00:00.000Z"),
    createdAt: new Date("2026-11-18T09:51:00.000Z"),
    orderItems: [item()],
    quote: null,
    ...over,
  } as unknown as OrderResponseDto;
}

function manual(over: Partial<ManualOrderDto> = {}): ManualOrderDto {
  return {
    id: "m-1",
    storeId: "s-1",
    pickupDate: "2026-11-20",
    pickupTime: "11:00",
    cakeName: "도시락 케이크",
    lettering: "생일 축하해",
    price: 25000,
    paid: false,
    customerName: "서아",
    source: "KAKAO",
    memo: null,
    photoUrls: [],
    createdAt: "2026-11-19T01:00:00.000Z",
    updatedAt: "2026-11-19T01:00:00.000Z",
    ...over,
  } as unknown as ManualOrderDto;
}

describe("주문서 인쇄", () => {
  it("주소에 날짜를 붙인다", () => {
    expect(printOrdersPath("s-1", "2026-11-20")).toBe("/stores/s-1/print/orders?date=2026-11-20");
  });

  it("휴대폰 번호는 뒷자리 4개만", () => {
    expect(phoneTail("010-1234-2231")).toBe("2231");
    expect(phoneTail("+82 10-1234-2231")).toBe("2231");
    expect(phoneTail("")).toBeNull();
    expect(phoneTail(null)).toBeNull();
  });

  it("그날 주문만 시각 순으로, 취소는 빼고, 직접 적은 주문도 섞는다", () => {
    const sheets = buildPrintSheets(
      "2026-11-20",
      [
        order(),
        order({ id: "o-2", orderStatus: OrderStatus.CANCEL_COMPLETED }),
        // 다른 날
        order({ id: "o-3", pickupDate: new Date("2026-11-21T05:00:00.000Z") as never }),
      ],
      [manual(), manual({ id: "m-2", pickupDate: "2026-11-21" })],
    );
    expect(sheets.map((s) => s.key)).toEqual(["manual-m-1", "order-o-1"]);
    const o = sheets[1];
    expect(o.time).toBe("14:00");
    expect(o.lines).toEqual(["1호 · 1개 · 맛 초코"]);
    expect(o.texts).toEqual([{ label: "레터링", text: "엄마 생신 축하해요" }]);
    expect(o.photos).toEqual(["https://img/a.jpg", "https://img/b.jpg"]);
    expect(o.request).toBe("글씨는 분홍색으로");
    expect(o.customer).toBe("유나 (2231)");
    expect(o.price).toBe("42,000원");
    const m = sheets[0];
    expect(m.tag).toContain("직접 적음");
    expect(m.texts).toEqual([{ label: "레터링", text: "생일 축하해" }]);
  });

  it("옛 주문의 레터링(letteringMessage)도 싣는다", () => {
    const [s] = buildPrintSheets(
      "2026-11-20",
      [order({ orderItems: [item({ selectedOptions: [], letteringMessage: "축하해" })] })],
      [],
    );
    expect(s.texts).toEqual([{ label: "레터링", text: "축하해" }]);
  });
});

describe("엑셀 내려받기", () => {
  it("칸 이름 줄과 픽업 순 줄, 휴대폰 번호는 넣지 않는다", () => {
    const csv = buildOrdersCsv([order()], [manual()]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(EXPORT_COLUMNS.join(","));
    expect(lines).toHaveLength(3);
    // 11:00 직접 적은 주문이 14:00 Picake 주문보다 앞
    expect(lines[1].startsWith("직접 적음(")).toBe(true);
    expect(lines[2]).toContain("ORD-1");
    expect(lines[2]).toContain("42000");
    expect(lines[2]).toContain("예약확정");
    // 예약확정은 아직 매출이 아니다(픽업 완료만) — 금액 42000 뒤 매출 0
    expect(lines[2]).toContain("42000,0,");
    expect(csv).not.toContain("1234");
    expect(csv).not.toContain("2231");
  });

  it("쉼표·따옴표·줄바꿈은 감싸고, 수식으로 읽히는 첫 글자는 막는다", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('말 "그대로"')).toBe('"말 ""그대로"""');
    expect(csvCell("한 줄\n두 줄")).toBe('"한 줄\n두 줄"');
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("+82")).toBe("'+82");
    expect(csvCell(42000)).toBe("42000");
    expect(csvCell(null)).toBe("");
  });

  it("파일 이름에 못 쓰는 글자는 뺀다", () => {
    expect(exportFileName('달콤/스토어:"1"', "2026-11-01", "2026-11-30")).toBe(
      "주문_달콤스토어1_2026-11-01_2026-11-30.csv",
    );
  });
});

describe("엑셀: 기간 나누기·같은 주문 한 번", () => {
  it("62일 넘는 기간은 62일 이하로 나눈다(양 끝 포함, 빈틈 없이)", () => {
    const parts = splitDateRange("2026-09-01", "2026-11-30", 62);
    expect(parts).toEqual([
      { start: "2026-09-01", end: "2026-11-01" },
      { start: "2026-11-02", end: "2026-11-30" },
    ]);
    expect(splitDateRange("2026-11-01", "2026-11-30", 62)).toEqual([
      { start: "2026-11-01", end: "2026-11-30" },
    ]);
  });

  it("쪽을 넘기다 같은 주문이 두 번 와도 한 줄만", () => {
    const csv = buildOrdersCsv([order(), order()], []);
    expect(csv.split("\r\n")).toHaveLength(2);
  });
});
