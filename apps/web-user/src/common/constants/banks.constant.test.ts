import { describe, expect, it } from "vitest";
import { BANK_LIST } from "@/apps/web-user/common/constants/banks.constant";

/**
 * 서버 StoreBankName(prisma schema)과 같은 값. 다르면 환불 계좌 입력이 400으로 막힌다
 * (11-15 검토: iM·SC제일·SBI·새마을·우체국·신협 6곳이 다른 이름이라 손님이 환불 계좌를 못 넣었음)
 */
const SERVER_BANK_NAMES = [
  "KB_KOOKMIN",
  "SHINHAN",
  "WOORI",
  "HANA",
  "NH_NONGHYUP",
  "IBK",
  "KDB",
  "SUHYUP",
  "KAKAO_BANK",
  "TOSS_BANK",
  "K_BANK",
  "KYONGNAM",
  "BUSAN",
  "IM_BANK_DAEGU",
  "GWANGJU",
  "JEONBUK",
  "JEJU",
  "SC_JEIL",
  "CITI",
  "SAVINGS_BANK",
  "SAEMAEUL",
  "POST_OFFICE",
  "SINHYEOP",
];

describe("환불 은행 값", () => {
  it("손님 화면의 은행 값은 모두 서버가 받는 값이다", () => {
    for (const b of BANK_LIST) expect(SERVER_BANK_NAMES, b.label).toContain(b.value);
  });
});
