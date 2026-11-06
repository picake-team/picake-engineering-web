import { describe, expect, it } from "vitest";
import { businessHoursSummary } from "@/apps/web-seller/features/store/utils/store-mobile.util";

describe("businessHoursSummary", () => {
  it("쉬는 요일과 영업시간 한 줄", () => {
    expect(
      businessHoursSummary({
        businessCalendar: {
          weeklyClosedWeekdays: [1, 0],
          standardOpenTime: "10:00",
          standardCloseTime: "19:00",
          dayOverrides: [],
        },
      }),
    ).toBe("쉬는 요일 일요일·월요일 · 10:00~19:00");
  });

  it("쉬는 요일이 없고 하루 종일이면", () => {
    expect(
      businessHoursSummary({
        businessCalendar: {
          weeklyClosedWeekdays: [],
          standardOpenTime: "00:00",
          standardCloseTime: "00:00",
          dayOverrides: [],
        },
      }),
    ).toBe("쉬는 요일 없음 · 하루 종일");
  });

  it("영업 캘린더가 없으면 비움", () => {
    expect(businessHoursSummary({ businessCalendar: undefined })).toBeUndefined();
  });
});
