import { describe, expect, it } from "vitest";
import { isServerAuthMessage } from "@/apps/web-user/features/auth/constants/auth.constant";
import { resolvePhoneVerificationFailReason } from "@/apps/web-user/features/auth/utils/phone-verification-error.util";
import {
  parseDuplicateAccountPayload,
  resolveLoginProviderFromDuplicateMessage,
} from "@/apps/web-user/features/auth/utils/register-duplicate-account.util";

/** 서버가 보내는 글(옛 합니다체와 backend #65 해요체)을 모두 알아봐야 소셜 가입이 깨지지 않는다 */
const axios409 = (message: string) => ({
  response: { status: 409, data: { data: { message, name: "홍길동", phone: "010-****-1234" } } },
});

describe("서버 오류 글 맞춰 보기", () => {
  it("휴대폰 인증 필요: 옛 글·새 글 모두", () => {
    expect(isServerAuthMessage("휴대폰 인증이 필요합니다.", "PHONE_VERIFICATION_REQUIRED")).toBe(
      true,
    );
    expect(isServerAuthMessage("휴대폰 인증이 필요해요.", "PHONE_VERIFICATION_REQUIRED")).toBe(
      true,
    );
    expect(isServerAuthMessage("다른 오류", "PHONE_VERIFICATION_REQUIRED")).toBe(false);
    expect(isServerAuthMessage(undefined, "PHONE_VERIFICATION_REQUIRED")).toBe(false);
  });

  it("이미 가입한 계정: 옛 글·새 글로 로그인 수단을 알아냄", () => {
    expect(
      resolveLoginProviderFromDuplicateMessage(
        "해당 휴대폰 번호로 이미 등록된 카카오 계정이 있습니다.",
      ),
    ).toBe("kakao");
    expect(
      resolveLoginProviderFromDuplicateMessage(
        "해당 휴대폰 번호로 이미 등록된 구글 계정이 있어요.",
      ),
    ).toBe("google");
    expect(
      resolveLoginProviderFromDuplicateMessage(
        "해당 휴대폰 번호로 이미 등록된 애플 계정이 있어요.",
      ),
    ).toBe("apple");
    expect(resolveLoginProviderFromDuplicateMessage("다른 오류")).toBeNull();
  });

  it("409 응답을 기존 계정 안내로 바꿈", () => {
    const payload = parseDuplicateAccountPayload(
      axios409("해당 휴대폰 번호로 이미 등록된 카카오 계정이 있습니다."),
    );
    expect(payload?.provider).toBe("kakao");
    expect(parseDuplicateAccountPayload(axios409("다른 오류"))).toBeNull();
  });

  it("인증번호 만료: 옛 글·새 글 모두 expired_code", () => {
    const err = (message: string) => ({ response: { data: { data: { message } } } });
    expect(resolvePhoneVerificationFailReason(err("인증번호가 만료되었습니다."))).toBe(
      "expired_code",
    );
    expect(resolvePhoneVerificationFailReason(err("인증번호가 만료됐어요."))).toBe("expired_code");
    expect(resolvePhoneVerificationFailReason(err("인증번호가 올바르지 않습니다."))).toBe(
      "invalid_code",
    );
  });
});
