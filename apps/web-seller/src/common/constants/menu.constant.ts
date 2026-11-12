import React from "react";
import {
  Home,
  Package,
  Store,
  FileText,
  ShoppingCart,
  Bell,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { ROUTES } from "./paths.constant";

export interface MenuChildItem {
  text: string;
  path: string;
}

export interface MenuItem {
  text: string;
  icon?: React.ReactElement;
  path?: string; // for leaf or parent default
  children?: MenuChildItem[];
}

export function getMenuItems(storeId: string | null): MenuItem[] {
  if (!storeId) {
    // 스토어 선택 전에는 홈만 노출 (루트)
    return [
      {
        text: "홈",
        icon: React.createElement(Home, { className: "w-5 h-5" }),
        path: ROUTES.ROOT,
      },
    ];
  }

  return [
    {
      text: "홈",
      icon: React.createElement(Home, { className: "w-5 h-5" }),
      path: ROUTES.STORE_DETAIL_HOME(storeId),
    },
    {
      text: "스토어",
      icon: React.createElement(Store, { className: "w-5 h-5" }),
      children: [
        { text: "스토어 수정", path: ROUTES.STORE_DETAIL_EDIT(storeId) },
        { text: "스토어 캘린더", path: ROUTES.STORE_DETAIL_CALENDAR(storeId) },
      ],
    },
    {
      text: "피드",
      icon: React.createElement(FileText, { className: "w-5 h-5" }),
      children: [
        { text: "피드 목록", path: ROUTES.STORE_DETAIL_FEED_LIST(storeId) },
        { text: "피드 등록", path: ROUTES.STORE_DETAIL_FEED_CREATE(storeId) },
      ],
    },
    {
      text: "상품",
      icon: React.createElement(Package, { className: "w-5 h-5" }),
      children: [
        { text: "상품 목록", path: ROUTES.STORE_DETAIL_PRODUCTS_LIST(storeId) },
        { text: "상품 등록", path: ROUTES.STORE_DETAIL_PRODUCTS_CREATE(storeId) },
      ],
    },
    {
      text: "주문",
      icon: React.createElement(ShoppingCart, { className: "w-5 h-5" }),
      children: [{ text: "주문 목록", path: ROUTES.STORE_DETAIL_ORDERS_LIST(storeId) }],
    },
    {
      text: "통계",
      icon: React.createElement(BarChart3, { className: "w-5 h-5" }),
      children: [{ text: "주문 통계", path: ROUTES.STORE_DETAIL_STATISTICS_ORDERS(storeId) }],
    },
    {
      text: "알림",
      icon: React.createElement(Bell, { className: "w-5 h-5" }),
      children: [
        { text: "알림 목록", path: ROUTES.STORE_DETAIL_NOTIFICATIONS_LIST(storeId) },
        { text: "알림 설정", path: ROUTES.STORE_DETAIL_NOTIFICATIONS_SETTINGS(storeId) },
      ],
    },
    {
      // 채팅(기획 I-11). 휴대폰과 같은 화면을 가운데에 띄운다
      text: "채팅",
      icon: React.createElement(MessageSquare, { className: "w-5 h-5" }),
      path: ROUTES.STORE_DETAIL_CHATS(storeId),
    },
  ];
}
