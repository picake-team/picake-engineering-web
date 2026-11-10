"use client";

import { useAlertStore } from "@/apps/web-user/common/store/alert.store";
import { Modal } from "@/apps/web-user/common/components/modals/Modal";

/**
 * 공용 안내 창(오류·로그인 필요 등). 앱의 다른 확인 창(Modal)과 같은 모양: 검은 제목 + 회색 설명 + 주황 "확인".
 * 제목이 "오류"뿐이면 따로 두지 않고 안내 글을 제목 자리에 굵게 보인다(빨간 "오류" 한 단어 대신 무슨 일인지).
 */
export function Alert() {
  const { alert, hideAlert } = useAlertStore();

  if (!alert.isOpen) return null;

  const handleClose = () => {
    const { onClose } = alert;
    hideAlert();
    onClose?.();
  };

  const genericTitle = !alert.title || alert.title === "오류" || alert.title === "알림";
  return (
    <Modal
      isOpen
      onClose={handleClose}
      title={genericTitle ? alert.message : alert.title}
      description={genericTitle ? undefined : alert.message}
      confirmText="확인"
      confirmVariant="primary"
      hideCancel
      zIndexClassName="z-top"
    />
  );
}
