"use client";

import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";

interface ProfileImagePickerBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFromAlbum: () => void;
  onResetToDefault: () => void;
}

export function ProfileImagePickerBottomSheet({
  isOpen,
  onClose,
  onSelectFromAlbum,
  onResetToDefault,
}: ProfileImagePickerBottomSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="프로필 편집"
      zIndexClassName="z-sheet-over"
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
      <div className="flex flex-col px-5 py-3">
        <button
          type="button"
          onClick={onSelectFromAlbum}
          className="flex items-center w-full py-4 text-sm text-gray-900 text-left"
        >
          앨범에서 선택
        </button>
        <button
          type="button"
          onClick={onResetToDefault}
          className="flex items-center w-full py-4 text-sm text-gray-900 text-left"
        >
          기본 프로필로 변경
        </button>
      </div>
    </BottomSheet>
  );
}
