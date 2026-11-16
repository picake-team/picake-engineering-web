import { describe, expect, it } from "vitest";
import {
  hasAllKakaoSellerTerms,
  readRegisterTicketHints,
} from "@/apps/web-seller/features/auth/utils/register-ticket-hints.util";

function fakeTicket(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `eyJhbGciOiJIUzI1NiJ9.${body}.sig`;
}

describe("가입표 읽기(사장님 카카오 한 번에 가입)", () => {
  it("카카오가 준 번호·한글 이름·약관 태그를 읽는다", () => {
    expect(
      readRegisterTicketHints(
        fakeTicket({
          phone: "01077778888",
          name: "김사장",
          terms: ["picake_s_tos", "picake_s_privacy"],
        }),
      ),
    ).toEqual({
      phone: "01077778888",
      name: "김사장",
      terms: ["picake_s_tos", "picake_s_privacy"],
    });
  });

  it("깨진 가입표·어긋난 번호는 없는 것으로", () => {
    expect(readRegisterTicketHints("broken")).toEqual({});
    expect(readRegisterTicketHints(fakeTicket({ phone: "02-123" })).phone).toBeUndefined();
  });

  it("사장님 필수 약관 2개가 다 있어야 하고, 손님 약관은 치지 않는다", () => {
    expect(hasAllKakaoSellerTerms(["picake_s_tos", "picake_s_privacy"])).toBe(true);
    expect(hasAllKakaoSellerTerms(["picake_s_tos", "picake_c_privacy"])).toBe(false);
  });
});
