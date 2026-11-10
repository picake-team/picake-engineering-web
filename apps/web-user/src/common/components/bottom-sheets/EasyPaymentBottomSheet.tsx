"use client";

import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Modal } from "@/apps/web-user/common/components/modals/Modal";
import { Toast } from "@/apps/web-user/common/components/toast/Toast";
import { BottomSheetOptionList } from "./BottomSheetOptionList";
import { APP_ONLY_MODAL } from "@/apps/web-user/common/constants/messages.constant";
import {
  isWebViewEnvironment,
  toExternalAppSchemeUrl,
} from "@/apps/web-user/common/utils/webview.bridge";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** 스키마 실행 후 이탈이 없으면 미설치로 판단하는 대기 시간 */
const APP_LAUNCH_TIMEOUT_MS = 1500;

interface EasyPaymentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** 입금하려는 예약 고유 식별자 (애널리틱스용) */
  reservationId: string;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  amount: number;
}

export function EasyPaymentBottomSheet({
  isOpen,
  onClose,
  reservationId,
  bankAccountNumber,
  bankName,
  amount,
}: EasyPaymentBottomSheetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotInstalledToastOpen, setIsNotInstalledToastOpen] = useState(false);

  // 실행 감지 중인 리스너/타이머 정리 함수
  const cleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanupRef.current?.(), []);

  // 간편 입금하기 바텀시트 노출
  useEffect(() => {
    if (isOpen) {
      trackEvent("view_easy_payment_option", { reservation_id: reservationId });
    }
  }, [isOpen, reservationId]);

  /**
   * 외부 앱 스키마 실행 후 앱 전환 여부로 설치 상태를 판단한다.
   * 앱이 열리면 페이지가 백그라운드로 내려가고, 미설치면 화면에 그대로 남는다.
   */
  const handleDeepLink = (url: string) => {
    if (!isMobileDevice()) {
      setIsModalOpen(true);
      return;
    }

    cleanupRef.current?.();

    let hasLeftPage = false;
    const markLeftOnHidden = () => {
      if (document.hidden) hasLeftPage = true;
    };
    const markLeft = () => {
      hasLeftPage = true;
    };

    document.addEventListener("visibilitychange", markLeftOnHidden);
    window.addEventListener("pagehide", markLeft);
    window.addEventListener("blur", markLeft);

    const timer = window.setTimeout(() => {
      cleanup();
      // 앱으로 전환됐다면 시트를 닫고, 그대로 남아 있으면 미설치로 안내
      if (hasLeftPage || document.hidden) {
        onClose();
        return;
      }
      // 시트는 닫지 않는다 — 다른 결제 수단을 바로 고를 수 있어야 함
      setIsNotInstalledToastOpen(true);
    }, APP_LAUNCH_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", markLeftOnHidden);
      window.removeEventListener("pagehide", markLeft);
      window.removeEventListener("blur", markLeft);
      cleanupRef.current = null;
    };
    cleanupRef.current = cleanup;

    // 웹뷰에서는 Flutter가 가로채 외부 앱을 실행하도록 커스텀 스키마로 감싼다
    window.location.href = isWebViewEnvironment() ? toExternalAppSchemeUrl(url) : url;
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="간편 입금하기"
        footerShadow={false}
        footer={
          <div className="px-5 py-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full h-[52px] rounded-xl border border-gray-100 text-base font-bold text-gray-900"
            >
              취소
            </button>
          </div>
        }
      >
        <div className="pt-5 px-5">
          <div className="flex flex-col gap-0.5 px-3.5 py-2.5 bg-gray-50 rounded-lg">
            <p className="text-xs font-bold text-gray-700">간편 입금이란?</p>
            <p className="text-xs text-gray-700">
              계좌정보를 자동으로 인식해 바로 이체할 수 있는 서비스입니다.
            </p>
          </div>
        </div>
        <BottomSheetOptionList
          items={[
            {
              icon: { type: "image", src: "/images/contents/toss.png", alt: "토스" },
              label: "토스",
              onClick: () => {
                trackEvent("engage_easy_payment_option", {
                  reservation_id: reservationId,
                  payment_method: "toss",
                });
                handleDeepLink(
                  `supertoss://send?bank=${bankName}&accountNo=${bankAccountNumber}&amount=${amount}`,
                );
              },
            },
            {
              icon: { type: "image", src: "/images/contents/kakao.png", alt: "카카오페이" },
              label: "카카오페이",
              onClick: () => {
                trackEvent("engage_easy_payment_option", {
                  reservation_id: reservationId,
                  payment_method: "kakao",
                });
                handleDeepLink("kakaotalk://kakaopay/money/to");
              },
            },
          ]}
        />
      </BottomSheet>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={APP_ONLY_MODAL.title}
        description={APP_ONLY_MODAL.description}
        confirmText="취소"
        confirmVariant="outline"
        cancelText="앱 다운로드"
        cancelVariant="primary"
        onConfirm={() => setIsModalOpen(false)}
        onCancel={() => {
          window.open("https://pickcake.app/download", "_blank");
          setIsModalOpen(false);
        }}
      />

      {isNotInstalledToastOpen && (
        <Toast
          message="앱이 설치되어 있지 않아요."
          iconName="alertCircle"
          iconClassName="text-red-400"
          onClose={() => setIsNotInstalledToastOpen(false)}
        />
      )}
    </>
  );
}
