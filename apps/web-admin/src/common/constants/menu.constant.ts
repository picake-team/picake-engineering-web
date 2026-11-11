import React from "react";
import { BarChart3, Home, MessageSquare, ShoppingBag, Store, ShieldCheck } from "lucide-react";
import { ROUTES } from "./paths.constant";

export interface MenuChildItem {
  text: string;
  path: string;
}

export interface MenuItem {
  text: string;
  icon?: React.ReactElement;
  path?: string;
  children?: MenuChildItem[];
}

export function getMenuItems(): MenuItem[] {
  return [
    {
      text: "홈",
      icon: React.createElement(Home, { className: "w-5 h-5" }),
      path: ROUTES.ROOT,
    },
    {
      text: "통계",
      icon: React.createElement(BarChart3, { className: "w-5 h-5" }),
      children: [
        { text: "회원 통계", path: ROUTES.STATISTICS.USERS },
        { text: "주문·매출 통계", path: ROUTES.STATISTICS.ORDERS },
        { text: "스토어 통계", path: ROUTES.STATISTICS.STORES },
        { text: "입점 통계", path: ROUTES.STATISTICS.STORE_ENTRY_REQUESTS },
      ],
    },
    {
      text: "구매자",
      icon: React.createElement(ShoppingBag, { className: "w-5 h-5" }),
      children: [
        { text: "회원 관리", path: ROUTES.CONSUMER.MEMBERS },
        { text: "견적 요청", path: ROUTES.CONSUMER.QUOTE_REQUESTS },
        { text: "환불 누락 관리", path: ROUTES.CONSUMER.REFUND_CANDIDATES },
        { text: "홈 배너 관리", path: ROUTES.CONSUMER.HOME_BANNERS },
        { text: "공지사항 관리", path: ROUTES.CONSUMER.NOTICES },
        { text: "Q&A 관리", path: ROUTES.CONSUMER.QNAS },
        { text: "약관 관리", path: ROUTES.CONSUMER.TERMS },
      ],
    },
    {
      text: "판매자",
      icon: React.createElement(Store, { className: "w-5 h-5" }),
      children: [
        { text: "회원 관리", path: ROUTES.SELLER.MEMBERS },
        { text: "스토어 관리", path: ROUTES.SELLER.STORES },
        { text: "세그먼트 관리", path: ROUTES.SELLER.SEGMENTS },
        { text: "약관 관리", path: ROUTES.SELLER.TERMS },
      ],
    },
    {
      // 채팅(기획 I-11): 신고는 24시간 안 처리, 여는 시각은 처리방침·약관 시행에 맞춤
      text: "채팅",
      icon: React.createElement(MessageSquare, { className: "w-5 h-5" }),
      children: [
        { text: "신고 처리", path: ROUTES.CHAT.REPORTS },
        { text: "여는 시각", path: ROUTES.CHAT.SETTINGS },
      ],
    },
    {
      text: "관리자",
      icon: React.createElement(ShieldCheck, { className: "w-5 h-5" }),
      children: [
        { text: "가입 신청 내역", path: ROUTES.ADMIN_MANAGEMENT.REQUESTS },
        { text: "계정 관리", path: ROUTES.ADMIN_MANAGEMENT.ACCOUNTS },
        { text: "가입 설정", path: ROUTES.ADMIN_MANAGEMENT.SETTINGS },
      ],
    },
  ];
}
