import { createElement, Fragment } from "react";

export const APP_ONLY_MODAL = {
  title: "픽케이크 앱이 필요해요",
  description: createElement(
    Fragment,
    null,
    "해당 서비스는 앱 다운로드가 필요합니다.",
    createElement("br"),
    "더욱 편리한 이용을 위해 다운로드해주세요.",
  ),
} as const;

export const PAYMENT_COMPLETE_MODAL = {
  title: "입금 완료",
  description: createElement(
    Fragment,
    null,
    "판매자에게 확인 알림이 전달되며,",
    createElement("br"),
    createElement("span", { className: "text-primary font-bold" }, "입금 확인 후 예약이 확정"),
    "돼요.",
  ),
} as const;
