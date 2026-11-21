/**
 * 판매자 앱 기능(사진 저장·바깥 링크)에 결과 안내를 붙인 것. 앱 약속은 webview.bridge, 안내 띠는 useAlertStore.
 */
import type React from "react";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import { copyWithToast } from "@/apps/web-seller/common/utils/clipboard.util";
import {
  canSaveImageToDevice,
  isSellerAppWebView,
  openExternal,
  saveImageToDevice,
} from "@/apps/web-seller/common/utils/webview.bridge";

const SAVE_IMAGE_NOTICE = {
  saved: { severity: "success", message: "사진을 저장했어요", autoHideDuration: 2500 },
  denied: { severity: "warning", message: "사진첩 접근 권한이 필요해요. 설정에서 허용해 주세요" },
  failed: { severity: "error", message: "사진 저장에 실패했어요" },
} as const;

/** 휴대폰 사진첩에 저장하고 결과를 안내 띠로(앱은 안내를 띄우지 않는다) */
function saveToPhone(src: string): boolean {
  void saveImageToDevice(src).then((result) =>
    useAlertStore.getState().addAlert(SAVE_IMAGE_NOTICE[result]),
  );
  return true;
}

/**
 * 사진 확대 보기 "사진 저장"(ImageLightbox `onSave`). 앱이면 휴대폰 사진첩에 저장,
 * 앱이 아니거나 사진 저장이 없는 앱 버전이면 undefined(브라우저 다운로드).
 */
export function phoneImageSaver(): ((src: string) => boolean) | undefined {
  return canSaveImageToDevice() ? saveToPhone : undefined;
}

/** 앱이 휴대폰 브라우저·그 앱으로 연다. 열 수 없으면 주소를 복사해 안내한다 */
export async function openOutsideApp(url: string): Promise<void> {
  if (await openExternal(url)) return;
  await copyWithToast(url, "주소를 복사했어요. 브라우저에 붙여 넣어 열어 주세요");
}

/**
 * 바깥 링크 `<a>`에 펼쳐 넣는다(`<a {...externalLinkProps(url)} target="_blank">`). 주소는 그대로 href에 두고,
 * 앱 안에서는 누르면 앱이 휴대폰 브라우저·그 앱으로 연다(앱 안에서 열면 돌아올 길이 없어서).
 */
export function externalLinkProps(url: string): {
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
} {
  if (!isSellerAppWebView()) return { href: url };
  return {
    href: url,
    onClick: (e) => {
      e.preventDefault();
      void openOutsideApp(url);
    },
  };
}
