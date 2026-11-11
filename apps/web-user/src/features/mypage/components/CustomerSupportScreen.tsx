"use client";

import Image from "next/image";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { Icon } from "@/apps/web-user/common/components/icons";
import {
  isWebViewEnvironment,
  toExternalAppSchemeUrl,
} from "@/apps/web-user/common/utils/webview.bridge";

const SUPPORT_EMAIL = "picakeee@gmail.com";
/** 카카오톡 채널 "픽케이크" 1:1 채팅(채팅 켜져 있음, 2026-11-11 확인). 판매자 앱 문의하기와 같은 곳 */
export const SUPPORT_KAKAO_CHAT_URL = "https://pf.kakao.com/_MgxdPX/chat";

/** 바깥 링크: 앱이면 앱이 가로채 카카오톡·메일 앱으로, 브라우저면 새 창 */
function openExternal(url: string) {
  if (isWebViewEnvironment()) {
    window.location.href = toExternalAppSchemeUrl(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * 마이페이지 > 고객센터.
 * 문의는 카카오톡 채널 채팅 하나로 받는다(2026-11-11, 운영자 휴대폰에 바로 알림). 카카오톡을 안 쓰는 손님을 위해 이메일만 함께 둔다.
 * 로그인 없이도 접근 가능해야 함 — App Store 심사(가이드라인 1.5)의 Support URL이 이 화면을 가리킴.
 */
export function CustomerSupportScreen() {
  return (
    <div className="pt-5 pb-10">
      <div className="px-5 flex flex-col gap-3">
        <p className="text-sm text-gray-700">
          궁금한 점은 카카오톡 &apos;픽케이크&apos; 채널 채팅으로 물어봐 주세요.
        </p>
        <Button onClick={() => openExternal(SUPPORT_KAKAO_CHAT_URL)}>
          <span className="flex items-center justify-center gap-2">
            <Image
              src="/images/contents/talk_kakao.png"
              alt=""
              width={20}
              height={20}
              className="w-5 h-5 rounded-full object-cover"
            />
            카카오톡으로 문의하기
          </span>
        </Button>
      </div>
      <button
        type="button"
        onClick={() => openExternal(`mailto:${SUPPORT_EMAIL}`)}
        className="press-bg mt-6 w-full flex items-center justify-between gap-3 px-5 py-4 border-y border-gray-100 text-left"
      >
        <span className="flex-1">
          <span className="block text-sm font-bold text-gray-900">이메일로 문의하기</span>
          <span className="block text-xs text-gray-500 mt-0.5">{SUPPORT_EMAIL}</span>
        </span>
        <Icon name="arrow" width={20} height={20} className="text-gray-900 rotate-90" />
      </button>
    </div>
  );
}
