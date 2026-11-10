"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { Icon } from "@/apps/web-user/common/components/icons";
import { useUploadFile } from "@/apps/web-user/features/upload/hooks/mutations/useUploadFile";
import { ProfileImagePickerBottomSheet } from "./ProfileImagePickerBottomSheet";

interface ProfileEditBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialNickname: string;
  initialProfileImageUrl?: string | null;
  isSubmitting?: boolean;
  onSubmit?: (data: { nickname: string; profileImageUrl: string | null }) => void;
}

export function ProfileEditBottomSheet({
  isOpen,
  onClose,
  initialNickname,
  initialProfileImageUrl,
  isSubmitting = false,
  onSubmit,
}: ProfileEditBottomSheetProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    initialProfileImageUrl || null,
  );
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadFile, isPending: isUploading } = useUploadFile();

  useLayoutEffect(() => {
    if (isOpen) {
      setNickname(initialNickname);
      setProfileImageUrl(initialProfileImageUrl || null);
    }
  }, [isOpen, initialNickname, initialProfileImageUrl]);

  const handleSelectFromAlbum = () => {
    setIsImagePickerOpen(false);
    fileInputRef.current?.click();
  };

  const handleResetToDefault = () => {
    setProfileImageUrl(null);
    setIsImagePickerOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    uploadFile(file, {
      onSuccess: (data) => {
        setProfileImageUrl(data.fileUrl);
      },
    });
  };

  const handleConfirm = () => {
    onSubmit?.({ nickname: nickname.trim(), profileImageUrl });
  };

  const isBusy = isUploading || isSubmitting;

  return (
    <>
      <BottomSheet
        isOpen={isOpen && !isImagePickerOpen}
        onClose={onClose}
        title="프로필 편집"
        footer={
          <div className="px-5 py-3">
            <Button
              onClick={handleConfirm}
              disabled={!nickname.trim() || isBusy}
              loading={isSubmitting}
            >
              {isSubmitting ? "변경 중…" : "변경 완료"}
            </Button>
          </div>
        }
      >
        <div className="px-5 pt-8 pb-5">
          {/* 프로필 이미지 */}
          <div className="flex justify-center">
            <div className="relative w-[140px] h-[140px]">
              <div className="w-[140px] h-[140px] rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="프로필" className="w-full h-full object-cover" />
                ) : (
                  <Icon name="mypage" width={140} height={140} className="text-gray-200" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsImagePickerOpen(true)}
                aria-label="프로필 이미지 변경"
                className="absolute bottom-0 -right-2.5 w-11 h-11 rounded-full border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] flex items-center justify-center"
              >
                <Icon name="pencle" width={24} height={24} className="text-gray-900" />
              </button>
            </div>
          </div>

          {/* 프로필 이름 */}
          <div className="mt-8">
            <label htmlFor="profile-nickname" className="block text-sm font-bold text-gray-900">
              프로필 이름
            </label>
            <div className="mt-2 flex items-center gap-2 h-[48px] px-3 border border-gray-100 rounded-md">
              <input
                id="profile-nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-500"
              />
              {nickname && (
                <button
                  type="button"
                  onClick={() => setNickname("")}
                  className="w-5 h-5 flex items-center justify-center"
                  aria-label="입력 지우기"
                >
                  <Icon name="closeCircle" width={20} height={20} className="text-gray-300" />
                </button>
              )}
            </div>
          </div>
        </div>
      </BottomSheet>

      <ProfileImagePickerBottomSheet
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelectFromAlbum={handleSelectFromAlbum}
        onResetToDefault={handleResetToDefault}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
