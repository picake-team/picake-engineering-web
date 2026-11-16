"use client";

import { NO_REPLAY } from "@/apps/web-user/common/constants/replay.constant";
import { useState } from "react";
import { Icon } from "@/apps/web-user/common/components/icons";
import { LinkListItem } from "@/apps/web-user/common/components/lists/LinkListItem";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { useMypageProfile } from "@/apps/web-user/features/mypage/hooks/queries/useMypageProfile";
import { ProfileEditBottomSheet } from "@/apps/web-user/features/mypage/components/ProfileEditBottomSheet";
import { useUpdateMypageProfile } from "@/apps/web-user/features/mypage/hooks/mutations/useUpdateMypageProfile";
import { Toast } from "@/apps/web-user/common/components/toast/Toast";

function getLoginInfo(user: {
  googleId: string;
  googleEmail: string;
  kakaoId: string;
  kakaoEmail: string;
  appleId: string;
  appleEmail: string;
  naverId?: string;
  phone: string;
}) {
  if (user.kakaoId && user.kakaoEmail) {
    return (
      <div className="flex items-center gap-[6px]">
        <span className="px-1 py-0.5 bg-gray-50 text-2xs font-bold rounded-sm">카카오</span>
        {user.kakaoEmail}
      </div>
    );
  }
  if (user.googleId && user.googleEmail) {
    return (
      <div className="flex items-center gap-[6px]">
        <span className="px-1 py-0.5 bg-gray-50 text-2xs font-bold rounded-sm">구글</span>
        {user.googleEmail}
      </div>
    );
  }
  if (user.appleId && user.appleEmail) {
    return (
      <div className="flex items-center gap-[6px]">
        <span className="px-1 py-0.5 bg-gray-50 text-2xs font-bold rounded-sm">Apple</span>
        {user.appleEmail}
      </div>
    );
  }
  if (user.naverId) {
    // 네이버는 이메일을 받지 않아 가입한 번호를 보인다
    return (
      <div className="flex items-center gap-[6px]">
        <span className="px-1 py-0.5 bg-gray-50 text-2xs font-bold rounded-sm">네이버</span>
        {user.phone}
      </div>
    );
  }
  return user.phone;
}

const SETTING_MENU = [
  { label: "내 계정 정보", href: PATHS.SETTING_ACCOUNT },
  { label: "알림 설정", href: PATHS.SETTING_NOTIFICATION },
] as const;

export default function SettingPage() {
  const { data: user } = useMypageProfile();
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [showProfileUpdatedToast, setShowProfileUpdatedToast] = useState(false);
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateMypageProfile();

  return (
    <div className="mt-3 pb-[60px]">
      {/* 프로필 */}
      <div className="px-5 py-5 flex items-center gap-3 mb-3">
        <div className="w-[44px] h-[44px] rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt="프로필" className="w-full h-full object-cover" />
          ) : (
            <Icon name="mypage" width={44} height={44} className="text-gray-200" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-col gap-[2px]">
            <p className="text-base font-bold text-gray-900">{user?.nickname}</p>
            {/* 이메일·휴대폰 번호는 화면 녹화(PostHog)에 남기지 않는다(11-16 검토) */}
            <div className={`text-2sm text-gray-500 ${NO_REPLAY}`}>
              {user ? getLoginInfo(user) : "-"}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsProfileEditOpen(true)}
          className="flex items-center justify-center h-[32px] w-[83px] text-xs font-bold text-gray-900 border border-gray-100 rounded-md"
        >
          프로필 수정
        </button>
      </div>

      {/* 메뉴 */}
      <section>
        {SETTING_MENU.map(({ label, href }) => (
          <LinkListItem key={label} href={href} label={label} />
        ))}
      </section>

      <ProfileEditBottomSheet
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
        initialNickname={user?.nickname ?? ""}
        initialProfileImageUrl={user?.profileImageUrl}
        isSubmitting={isUpdatingProfile}
        onSubmit={({ nickname, profileImageUrl }) => {
          updateProfile(
            { nickname, profileImageUrl },
            {
              onSuccess: () => {
                setIsProfileEditOpen(false);
                setShowProfileUpdatedToast(true);
              },
            },
          );
        }}
      />

      {showProfileUpdatedToast && (
        <Toast
          message="수정완료"
          iconName="checkCircle"
          iconClassName="text-green-400"
          variant="column"
          position="center"
          duration={1000}
          onClose={() => setShowProfileUpdatedToast(false)}
        />
      )}
    </div>
  );
}
