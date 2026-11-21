"use client";

import { NO_REPLAY } from "@/apps/web-user/common/constants/replay.constant";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/apps/web-user/common/components/modals/Modal";
import { useMypageProfile } from "@/apps/web-user/features/mypage/hooks/queries/useMypageProfile";
import { useUpdateMypageProfile } from "@/apps/web-user/features/mypage/hooks/mutations/useUpdateMypageProfile";
import { PhoneEditBottomSheet } from "@/apps/web-user/features/mypage/components/PhoneEditBottomSheet";
import { NameEditBottomSheet } from "@/apps/web-user/features/mypage/components/NameEditBottomSheet";
import { WithdrawBottomSheet } from "@/apps/web-user/features/mypage/components/WithdrawBottomSheet";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";

function getLoginProviderLabel(
  user: { kakaoId: string; googleId: string; appleId: string; naverId?: string } | undefined,
): string {
  if (!user) return "-";
  if (user.kakaoId) return "카카오톡";
  if (user.googleId) return "구글";
  if (user.appleId) return "Apple";
  if (user.naverId) return "네이버";
  return "-";
}

interface InfoRowProps {
  label: string;
  children: React.ReactNode;
  /** 우측 컨테이너의 tailwind gap 클래스 (기본 "gap-2") */
  gap?: string;
}

function InfoRow({ label, children, gap = "gap-2.5" }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <span className="text-sm font-bold text-gray-900">{label}</span>
      <div className={`flex items-center ${gap} text-sm text-gray-700`}>{children}</div>
    </div>
  );
}

export default function SettingAccountPage() {
  const router = useRouter();
  const { data: user } = useMypageProfile();
  const { handleLogoutByEnvironment } = useAuthStore();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateMypageProfile();

  const [isPhoneEditOpen, setIsPhoneEditOpen] = useState(false);
  const [isNameEditOpen, setIsNameEditOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // 앱에서는 기기 알림 연결을 먼저 지워야 로그아웃한 휴대폰에 알림이 안 간다. 앱·서버가 답하지 않아도
  // 3초 뒤에는 로그아웃된다(auth.store handleLogoutByEnvironment)
  const handleLogout = () => {
    void handleLogoutByEnvironment();
    router.push(PATHS.HOME);
  };

  return (
    <div className="flex flex-col pt-4 min-h-[calc(100vh-52px)]">
      <div>
        <InfoRow label="로그인 수단" gap="gap-1">
          <span className="px-1 py-0.5 bg-gray-50 text-2xs font-bold rounded-sm text-gray-500">
            소셜
          </span>
          <span>{getLoginProviderLabel(user)}</span>
        </InfoRow>

        <InfoRow label="핸드폰 번호">
          <span className={NO_REPLAY}>{user?.phone ?? "-"}</span>
          <button
            type="button"
            onClick={() => setIsPhoneEditOpen(true)}
            className="px-3.5 h-8 text-xs font-bold text-gray-900 border border-gray-100 rounded-md"
          >
            수정
          </button>
        </InfoRow>

        <InfoRow label="이름">
          <span className={NO_REPLAY}>{user?.name ?? "-"}</span>
          <button
            type="button"
            onClick={() => setIsNameEditOpen(true)}
            className="px-3.5 h-8 text-xs font-bold text-gray-900 border border-gray-100 rounded-md"
          >
            수정
          </button>
        </InfoRow>
      </div>

      {/* 하단 로그아웃 / 회원탈퇴 */}
      <div className="mt-auto pb-10 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => setIsLogoutModalOpen(true)}
          className="px-5 h-[40px] text-sm font-bold text-gray-900 border border-gray-100 rounded-lg"
        >
          로그아웃
        </button>
        <button
          type="button"
          onClick={() => setIsWithdrawOpen(true)}
          className="h-[26px] text-sm text-gray-500 font-bold underline underline-offset-2"
        >
          회원탈퇴
        </button>
      </div>

      <PhoneEditBottomSheet isOpen={isPhoneEditOpen} onClose={() => setIsPhoneEditOpen(false)} />

      <NameEditBottomSheet
        isOpen={isNameEditOpen}
        onClose={() => setIsNameEditOpen(false)}
        isSubmitting={isUpdatingProfile}
        onSubmit={(name) => {
          updateProfile(
            { name },
            {
              onSuccess: () => setIsNameEditOpen(false),
            },
          );
        }}
      />

      <WithdrawBottomSheet isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="로그아웃"
        description="정말 로그아웃 하시겠어요?"
        confirmText="취소"
        confirmVariant="outline"
        onConfirm={() => {}}
        cancelText="로그아웃"
        cancelVariant="primary"
        onCancel={() => {
          setIsLogoutModalOpen(false);
          handleLogout();
        }}
      />
    </div>
  );
}
