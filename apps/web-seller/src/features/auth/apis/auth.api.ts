import {
  VerifyPhoneCodeRequestDto,
  GoogleRegisterRequestDto,
  KakaoRegisterRequestDto,
  PhoneVerificationPurpose,
  AUDIENCE,
  GoogleLoginRequestDto,
  KakaoLoginRequestDto,
  TokenResponseDto,
  MeResponseDto,
  FindAccountRequestDto,
  FindAccountResponseDto,
} from "@/apps/web-seller/features/auth/types/auth.dto";
import { sellerClient } from "@/apps/web-seller/common/config/axios.config";
import type { MessageResponseDto } from "@/apps/web-seller/common/types/api.dto";

/**
 * 인증 관련 API 함수들
 */
export const authApi = {
  me: async (): Promise<MeResponseDto> => {
    const response = await sellerClient.get("/auth/me");
    return response.data.data;
  },

  sendPhoneVerification: async (
    phone: string,
    purpose: PhoneVerificationPurpose,
  ): Promise<MessageResponseDto & { expiresAt: string }> => {
    const response = await sellerClient.post("/auth/send-verification-code", {
      phone,
      audience: AUDIENCE.SELLER,
      purpose,
    });
    return response.data.data;
  },

  verifyPhoneCode: async (
    data: Omit<VerifyPhoneCodeRequestDto, "audience">,
  ): Promise<MessageResponseDto> => {
    const response = await sellerClient.post("/auth/verify-phone-code", {
      ...data,
      audience: AUDIENCE.SELLER,
    });
    return response.data.data;
  },

  googleLogin: async (code: string): Promise<TokenResponseDto> => {
    const requestDto: GoogleLoginRequestDto = { code };
    const response = await sellerClient.post("/auth/google/login", requestDto);
    return response.data.data;
  },

  googleRegister: async (data: GoogleRegisterRequestDto): Promise<TokenResponseDto> => {
    const response = await sellerClient.post("/auth/google/register", data);
    return response.data.data;
  },

  kakaoLogin: async (code: string): Promise<TokenResponseDto> => {
    const requestDto: KakaoLoginRequestDto = { code };
    const response = await sellerClient.post("/auth/kakao/login", requestDto);
    return response.data.data;
  },

  /** 판매자 앱 심사용 로그인 (SC-62) — 6자리 코드 */
  reviewLogin: async (code: string): Promise<TokenResponseDto> => {
    const response = await sellerClient.post("/auth/review-login", { code });
    return response.data.data;
  },

  kakaoRegister: async (data: KakaoRegisterRequestDto): Promise<TokenResponseDto> => {
    const response = await sellerClient.post("/auth/kakao/register", data);
    return response.data.data;
  },

  findAccount: async (body: FindAccountRequestDto): Promise<FindAccountResponseDto> => {
    const response = await sellerClient.post("/auth/find-account", body);
    return response.data.data;
  },
};
