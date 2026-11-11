"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import {
  useOpenExternal,
  type ExternalFallback,
} from "@/apps/web-user/common/hooks/useOpenExternal";

const SUPPORT_EMAIL = "picakeee@gmail.com";
const KAKAO_CHANNEL_NAME = "픽케이크";
/** 카카오톡 채널 "픽케이크" 1:1 채팅(채팅 켜져 있음, 2026-11-11 확인). 판매자 앱 문의하기와 같은 곳 */
export const SUPPORT_KAKAO_CHAT_URL = "https://pf.kakao.com/_MgxdPX/chat";
const INSTAGRAM_HANDLE = "picake_app";

function MailIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="text-gray-900"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4 7l8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface SupportRowProps {
  icon: ReactNode;
  label: string;
  value: string;
  /** 누르면 바로 여는 곳(카카오톡 채팅·메일 앱·인스타그램) */
  href: string;
  /** 열리지 않을 때 복사할 값과 안내 */
  fallback: ExternalFallback;
  onOpen: (href: string, fallback: ExternalFallback) => void;
}

/** 라벨/값 정보 행. 누르면 그 채널로 바로 간다(2026-11-11) */
function SupportRow({ icon, label, value, href, fallback, onOpen }: SupportRowProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(href, fallback)}
      className="press-bg w-full flex items-center gap-3 px-5 py-4 border-b border-gray-100 text-left"
    >
      <div className="w-6 h-6 shrink-0 flex items-center justify-center">{icon}</div>
      <div className="flex-1 text-left">
        <p className="text-sm font-bold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{value}</p>
      </div>
    </button>
  );
}

/**
 * 마이페이지 > 고객센터. 줄을 누르면 그 채널로 바로 간다(카카오톡은 채널 1:1 채팅).
 * 전화 문의는 뺐다(2026-11-11 운영자, 1인 운영이라 카카오톡 채팅으로 받음). 전화번호는 약관의 사업자 정보에 남는다.
 * 로그인 없이도 접근 가능해야 함 — App Store 심사(가이드라인 1.5)의 Support URL이 이 화면을 가리킴.
 */
export function CustomerSupportScreen() {
  const { open, toast } = useOpenExternal();
  return (
    <div className="pt-4 pb-10">
      <SupportRow
        icon={<MailIcon />}
        label="이메일"
        value={SUPPORT_EMAIL}
        href={`mailto:${SUPPORT_EMAIL}`}
        fallback={{ copyText: SUPPORT_EMAIL, message: "이메일 주소를 복사했어요" }}
        onOpen={open}
      />
      <SupportRow
        icon={
          <Image
            src="/images/contents/talk_kakao.png"
            alt="카카오톡 채널"
            width={24}
            height={24}
            className="w-6 h-6 rounded-full object-cover"
          />
        }
        label="카카오톡 채널"
        value={KAKAO_CHANNEL_NAME}
        href={SUPPORT_KAKAO_CHAT_URL}
        fallback={{
          copyText: KAKAO_CHANNEL_NAME,
          message: "카카오톡에서 '픽케이크' 채널을 찾아 주세요",
        }}
        onOpen={open}
      />
      <SupportRow
        icon={
          <Image
            src="/images/contents/talk_insta.png"
            alt="인스타그램"
            width={24}
            height={24}
            className="w-6 h-6 rounded-full object-cover"
          />
        }
        label="인스타그램"
        value={`@${INSTAGRAM_HANDLE}`}
        href={`https://instagram.com/${INSTAGRAM_HANDLE}`}
        fallback={{ copyText: INSTAGRAM_HANDLE, message: "인스타그램 아이디를 복사했어요" }}
        onOpen={open}
      />
      {toast}
    </div>
  );
}
