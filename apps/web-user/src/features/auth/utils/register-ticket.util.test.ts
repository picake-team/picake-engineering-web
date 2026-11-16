import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearRegisterTicket,
  hasAllKakaoConsumerTerms,
  maskPhoneForDisplay,
  readRegisterTicket,
  readRegisterTicketHints,
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

  it("손님 필수 약관 3개가 다 있어야 약관을 다시 받지 않는다", () => {
    expect(
      hasAllKakaoConsumerTerms(["picake_c_tos", "picake_c_privacy", "picake_c_third_party"]),
    ).toBe(true);
    expect(hasAllKakaoConsumerTerms(["picake_c_tos", "picake_c_privacy"])).toBe(false);
    expect(hasAllKakaoConsumerTerms(undefined)).toBe(false);
  });

  it("번호는 가운데를 가린다", () => {
    expect(maskPhoneForDisplay("01012345678")).toBe("010-****-5678");
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
