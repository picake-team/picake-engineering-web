"use client";

import { Modal } from "@/apps/web-user/common/components/modals/Modal";
import { useUserCurrentLocationStore } from "@/apps/web-user/common/store/user-current-location.store";
import {
  isWebViewEnvironment,
  requestOpenAppSettings,
} from "@/apps/web-user/common/utils/webview.bridge";

/**
 * 위치 권한 거부 시 설정 유도 모달 (전역 1회 마운트)
 */
export function LocationPermissionModal() {
  const isOpen = useUserCurrentLocationStore((s) => s.isLocationPermissionModalOpen);
  const closeLocationPermissionModal = useUserCurrentLocationStore(
    (s) => s.closeLocationPermissionModal,
  );

  const handleClose = () => {
    closeLocationPermissionModal();
  };

  const handleOpenSettings = () => {
    if (isWebViewEnvironment()) {
      requestOpenAppSettings();
    }
    closeLocationPermissionModal();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="위치 권한을 확인할 수 없어요"
      description="설정에서 위치 권한을 허용해 주세요."
      confirmText="취소"
      confirmVariant="outline"
      cancelText="설정"
      cancelVariant="primary"
      onConfirm={handleClose}
      onCancel={handleOpenSettings}
      // RegionSelectSheet(z-sheet-top) 등 상위 오버레이 위에 표시
      zIndexClassName="z-permission"
    />
  );
}
