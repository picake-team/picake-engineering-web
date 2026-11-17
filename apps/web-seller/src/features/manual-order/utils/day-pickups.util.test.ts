import { describe, expect, it } from "vitest";
import {
  groupManualByDay,
  mergeDayPickups,
  pickupCountsByDay,
} from "@/apps/web-seller/features/manual-order/utils/day-pickups.util";
import type { ManualOrderDto } from "@/apps/web-seller/features/manual-order/types/manual-order.dto";
import type { OrderResponseDto } from "@/apps/web-seller/features/order/types/order.dto";

const order = (id: string, kstHm: string) =>
  ({ id, pickupDate: `2026-12-24T${kstHm}:00+09:00` }) as unknown as OrderResponseDto;
const manual = (id: string, pickupTime: string | null, pickupDate = "2026-12-24") =>
  ({ id, pickupDate, pickupTime }) as unknown as ManualOrderDto;

describe("mergeDayPickups(Picake 주문과 직접 적은 주문 섞기, 기획 I-42)", () => {
  it("시각 순, 같은 시각이면 Picake 먼저, 시각 없는 직접 적은 주문은 맨 뒤", () => {
    const merged = mergeDayPickups(
      [order("o15", "15:00"), order("o11", "11:00")],
      [manual("mNone", null), manual("m12", "12:00"), manual("m11", "11:00")],
    );
    expect(merged.map((p) => p.id)).toEqual(["o11", "m11", "m12", "o15", "mNone"]);
  });
});

describe("pickupCountsByDay", () => {
  it("날마다 Picake·직접 적은 주문 수", () => {
    const counts = pickupCountsByDay(
      { "2026-12-24": [order("a", "11:00"), order("b", "15:00")] },
      groupManualByDay([manual("x", "12:00"), manual("y", null, "2026-12-25")]),
    );
    expect(counts).toEqual({
      "2026-12-24": { picake: 2, manual: 1 },
      "2026-12-25": { picake: 0, manual: 1 },
    });
  });
});
