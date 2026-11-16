import { consumerClient } from "@/apps/web-user/common/config/axios.config";
import {
  AppleLoginRequestDto,
  AppleRegisterRequestDto,
  AUDIENCE,
  GoogleLoginRequestDto,
  GoogleRegisterRequestDto,
  KakaoLoginRequestDto,
  KakaoRegisterRequestDto,
  MessageResponseDto,
  NaverLoginRequestDto,
  NaverRegisterRequestDto,
  PhoneVerificationPurpose,
  ReviewLoginRequestDto,
  TokenResponseDto,
  VerifyPhoneCodeRequestDto,
} from "@/apps/web-user/features/auth/types/auth.dto";

export const authApi = {
  googleLogin: async (code: string): Promise<TokenResponseDto> => {
    const requestDto: GoogleLoginRequestDto = { code };
    const response = await consumerClient.post("/auth/google/login", requestDto);
    return response.data.data;
  },

  googleRegister: async (data: GoogleRegisterRequestDto): Promise<TokenResponseDto> => {
    const response = await consumerClient.post("/auth/google/register", data);
    return response.data.data;
  },

  kakaoLogin: async (code: string): Promise<TokenResponseDto> => {
    const requestDto: KakaoLoginRequestDto = { code };
    const response = await consumerClient.post("/auth/kakao/login", requestDto);
    return response.data.data;
  },

  kakaoRegister: async (data: KakaoRegisterRequestDto): Promise<TokenResponseDto> => {
    const response = await consumerClient.post("/auth/kakao/register", data);
    return response.data.data;
  },

  naverLogin: async (code: string, state: string): Promise<TokenResponseDto> => {
    const requestDto: NaverLoginRequestDto = { code, state };
    const response = await consumerClient.post("/auth/naver/login", requestDto);
    return response.data.data;
  },

  naverRegister: async (data: NaverRegisterRequestDto): Promise<TokenResponseDto> => {
    const response = await consumerClient.post("/auth/naver/register", data);
    return response.data.data;
  },

  appleLogin: async (code: string): Promise<TokenResponseDto> => {
    const requestDto: AppleLoginRequestDto = { code };
    const response = await consumerClient.post("/auth/apple/login", requestDto);
    return response.data.data;
  },

  appleRegister: async (data: AppleRegisterRequestDto): Promise<TokenResponseDto> => {
    const response = await consumerClient.post("/auth/apple/register", data);
    return response.data.data;
  },

  /** 앱스토어/플레이스토어 심사용 로그인 — 서버에 설정된 코드와 일치해야 함 */
  reviewLogin: async (code: string): Promise<TokenResponseDto> => {
    const requestDto: ReviewLoginRequestDto = { code };
    const response = await consumerClient.post("/auth/review-login", requestDto);
    return response.data.data;
  },

  sendPhoneVerification: async (
    phone: string,
    purpose: PhoneVerificationPurpose,
  ): Promise<MessageResponseDto & { expiresAt: string }> => {
    const response = await consumerClient.post("/auth/send-verification-code", {
      phone,
      audience: AUDIENCE.CONSUMER,
      purpose,
    });
    return response.data.data;
  },

  verifyPhoneCode: async (
    data: Omit<VerifyPhoneCodeRequestDto, "audience">,
  ): Promise<MessageResponseDto> => {
    const response = await consumerClient.post("/auth/verify-phone-code", {
      ...data,
      audience: AUDIENCE.CONSUMER,
    });
    return response.data.data;
  },
};
