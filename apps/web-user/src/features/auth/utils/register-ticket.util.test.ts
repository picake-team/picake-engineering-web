import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearAllRegisterTickets,
  clearRegisterTicket,
  hasAllKakaoConsumerTerms,
  isRegisterTicketExpired,
  formatPhoneForDisplay,
  readRegisterTicket,
  readRegisterTicketHints,
  readRegisterTicketSavedAt,
  saveRegisterTicket,
} from "@/apps/web-user/features/auth/utils/register-ticket.util";

/** 서버 가입표와 같은 모양(서명 부분은 화면이 보지 않음) */
function fakeTicket(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `eyJhbGciOiJIUzI1NiJ9.${body}.sig`;
}

describe("가입표 읽기(카카오 한 번에 가입 화면용)", () => {
  it("카카오가 준 번호·한글 이름·약관 태그를 읽는다", () => {
    const hints = readRegisterTicketHints(
      fakeTicket({
        type: "register",
        phone: "01012345678",
        name: "홍길동",
        terms: ["picake_c_tos"],
      }),
    );
    expect(hints).toEqual({ phone: "01012345678", name: "홍길동", terms: ["picake_c_tos"] });
  });

  it("모양이 어긋난 번호·깨진 가입표는 없는 것으로(문자 인증으로)", () => {
    expect(readRegisterTicketHints(fakeTicket({ phone: "+1 555" })).phone).toBeUndefined();
    expect(readRegisterTicketHints("not-a-ticket")).toEqual({});
  });

  it("손님 필수 약관 4개(만 14세 이상 포함)가 다 있어야 약관을 다시 받지 않는다", () => {
    expect(
      hasAllKakaoConsumerTerms([
        "user_age_check",
        "picake_c_tos",
        "picake_c_privacy",
        "picake_c_third_party",
      ]),
    ).toBe(true);
    // 카카오에서 만 14세 이상을 받지 못했으면(콘솔에 약관이 없던 때 등) 가입 화면에서 약관을 받는다(법무 LG-02)
    expect(
      hasAllKakaoConsumerTerms(["picake_c_tos", "picake_c_privacy", "picake_c_third_party"]),
    ).toBe(false);
    expect(hasAllKakaoConsumerTerms(["picake_c_tos", "picake_c_privacy"])).toBe(false);
    expect(hasAllKakaoConsumerTerms(undefined)).toBe(false);
  });

  it("번호는 가리지 않고 전체를 하이픈으로 나눠 보인다", () => {
    expect(formatPhoneForDisplay("01012345678")).toBe("010-1234-5678");
    expect(formatPhoneForDisplay("0161234567")).toBe("016-123-4567");
  });
});

describe("가입표 넘기기(주소 대신 이 탭에)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("저장되면 탭에서 읽고, 지우면 주소 값으로", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        setItem: (k: string, v: string) => store.set(k, v),
        getItem: (k: string) => store.get(k) ?? null,
        removeItem: (k: string) => store.delete(k),
      },
    });
    expect(saveRegisterTicket("kakao", "T1")).toBe(true);
    expect(readRegisterTicket("kakao", "FROM-URL")).toBe("T1");
    clearRegisterTicket("kakao");
    expect(readRegisterTicket("kakao", "FROM-URL")).toBe("FROM-URL");
    expect(readRegisterTicket("kakao", null)).toBeNull();
  });

  it("저장소를 못 쓰는 브라우저면 false — 콜백이 주소로 넘긴다", () => {
    vi.stubGlobal("window", {
      sessionStorage: {
        setItem: () => {
          throw new Error("QuotaExceeded");
        },
        getItem: () => {
          throw new Error("denied");
        },
        removeItem: () => undefined,
      },
    });
    expect(saveRegisterTicket("google", "T2")).toBe(false);
    expect(readRegisterTicket("google", "FROM-URL")).toBe("FROM-URL");
  });
});

describe("가입표 30분 지남(화면을 열 때)", () => {
  const now = Date.UTC(2026, 10, 16, 12, 0, 0);
  it("만료 시각이 지났으면 지난 것으로(30초 여유)", () => {
    expect(isRegisterTicketExpired(fakeTicket({ exp: now / 1000 - 60 }), now)).toBe(true);
    expect(isRegisterTicketExpired(fakeTicket({ exp: now / 1000 - 10 }), now)).toBe(false);
    expect(isRegisterTicketExpired(fakeTicket({ exp: now / 1000 + 600 }), now)).toBe(false);
  });
  it("읽을 수 없으면 서버에 맡긴다(지난 것으로 보지 않음)", () => {
    expect(isRegisterTicketExpired("broken", now)).toBe(false);
    expect(isRegisterTicketExpired(fakeTicket({}), now)).toBe(false);
  });
  it("이 기기가 받은 시각을 알면 받은 뒤 지난 시간으로 센다 — 기기 시계가 40분 빨라도 막지 않음", () => {
    const serverNow = now / 1000;
    const ticket = fakeTicket({ iat: serverNow, exp: serverNow + 1800 });
    const fastClock = now + 40 * 60 * 1000;
    // 받은 직후(기기 시계로 받은 시각 = 지금): 서버 기준으로는 막 만든 가입표
    expect(isRegisterTicketExpired(ticket, fastClock, fastClock)).toBe(false);
    // 받은 지 31분: 지난 것으로
    expect(isRegisterTicketExpired(ticket, fastClock + 31 * 60 * 1000, fastClock)).toBe(true);
    // 받은 시각을 모르면 예전처럼 만료 시각과 비교(시계가 빠르면 지난 것으로 봄)
    expect(isRegisterTicketExpired(ticket, fastClock)).toBe(true);
  });
});

describe("가입표 받은 시각·로그인하면 지우기", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("저장한 가입표와 같을 때만 받은 시각을 주고, 로그인하면 모든 가입표를 지운다", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        setItem: (k: string, v: string) => store.set(k, v),
        getItem: (k: string) => store.get(k) ?? null,
        removeItem: (k: string) => store.delete(k),
      },
    });
    saveRegisterTicket("kakao", "K1");
    saveRegisterTicket("google", "G1");
    expect(readRegisterTicketSavedAt("kakao", "K1")).toEqual(expect.any(Number));
    // 주소로 넘어온 다른 가입표면 받은 시각을 모른다
    expect(readRegisterTicketSavedAt("kakao", "OTHER")).toBeNull();
    clearAllRegisterTickets();
    expect(store.size).toBe(0);
  });
});
