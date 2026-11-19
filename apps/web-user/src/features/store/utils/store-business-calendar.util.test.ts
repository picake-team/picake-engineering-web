import { describe, expect, it } from "vitest";

import type { StoreBusinessCalendar } from "@/apps/web-user/features/store/types/store.type";
import { getNextStoreOpenLabel } from "./store-business-calendar.util";

/** 서울 시각으로 만든 순간 */
const kst = (s: string) => new Date(`${s}+09:00`);

// 2026-11-19는 목요일
const calendar = (over: Partial<StoreBusinessCalendar> = {}): StoreBusinessCalendar => ({
  weeklyClosedWeekdays: [1], // 월요일 휴무
  standardOpenTime: "11:00",
  standardCloseTime: "20:00",
  dayOverrides: [],
  ...over,
});

describe("getNextStoreOpenLabel (기획 I-01 문의 창·채팅방 영업시간 밖 줄)", () => {
  it("영업 중이면 null", () => {
    expect(getNextStoreOpenLabel(calendar(), kst("2026-11-19T14:00:00"))).toBeNull();
  });

  it("오늘 열기 전이면 오늘 여는 시각", () => {
    expect(getNextStoreOpenLabel(calendar(), kst("2026-11-19T09:30:00"))).toBe(
      "오늘 오전 11시부터",
    );
  });

  it("닫은 뒤면 내일 여는 시각", () => {
    expect(getNextStoreOpenLabel(calendar(), kst("2026-11-19T21:00:00"))).toBe(
      "내일 오전 11시부터",
    );
  });

  it("휴무일을 건너뛰고 그 다음 여는 날(날짜·요일)", () => {
    // 일요일 밤 → 월요일 휴무 → 화요일
    expect(getNextStoreOpenLabel(calendar(), kst("2026-11-22T21:00:00"))).toBe(
      "11월 24일(화) 오전 11시부터",
    );
  });

  it("날짜별 예외(임시 휴무·다른 시간)를 따른다", () => {
    const c = calendar({
      dayOverrides: [
        { date: "2026-11-20", isOpen: false },
        { date: "2026-11-21", isOpen: true, openTime: "13:30", closeTime: "18:00" },
      ],
    });
    expect(getNextStoreOpenLabel(c, kst("2026-11-19T21:00:00"))).toBe(
      "11월 21일(토) 오후 1시 30분부터",
    );
  });

  it("하루 전체 영업 가게는 시각 없이", () => {
    const c = calendar({ standardOpenTime: "00:00", standardCloseTime: "00:00" });
    expect(getNextStoreOpenLabel(c, kst("2026-11-23T10:00:00"))).toBe("내일부터");
  });

  it("2주 안에 여는 날이 없으면 빈 글자", () => {
    const c = calendar({ weeklyClosedWeekdays: [0, 1, 2, 3, 4, 5, 6] });
    expect(getNextStoreOpenLabel(c, kst("2026-11-19T10:00:00"))).toBe("");
  });
});
