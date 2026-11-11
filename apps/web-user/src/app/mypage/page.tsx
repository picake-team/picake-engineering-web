"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { BottomNav } from "@/apps/web-user/common/components/navigation/BottomNav";
import { LinkListItem } from "@/apps/web-user/common/components/lists/LinkListItem";
import { useMypageProfile } from "@/apps/web-user/features/mypage/hooks/queries/useMypageProfile";
import { useAuthStore, useAuthHasHydrated } from "@/apps/web-user/common/store/auth.store";
import { UpcomingOrderCard } from "../../features/order/components/UpcomingOrderCard";
import { useMyOrders } from "@/apps/web-user/features/order/hooks/queries/useMyOrders";
import { OrderStatus } from "@/apps/web-user/features/order/types/order.type";
import { ProfileEditBottomSheet } from "@/apps/web-user/features/mypage/components/ProfileEditBottomSheet";
import { useUpdateMypageProfile } from "@/apps/web-user/features/mypage/hooks/mutations/useUpdateMypageProfile";
import { Toast } from "@/apps/web-user/common/components/toast/Toast";
import { useLoginSheetStore } from "@/apps/web-user/common/store/login-sheet.store";
import { useScrollRestoration } from "@/apps/web-user/common/hooks/useScrollRestoration";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { useChatStatus, useChatUnread } from "@/apps/web-user/features/chat/hooks/useChat";

function getLoginInfo(user: {
  googleId: string;
  googleEmail: string;
  kakaoId: string;
  kakaoEmail: string;
  appleId: string;
  appleEmail: string;
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
  return user.phone;
}

const QUICK_LINKS = [
  { icon: "reservation", label: "내 예약", href: PATHS.MY_ORDERS },
  // 채팅(기획 I-11). 채팅이 열렸을 때만 보인다(아래에서 거름). 안 읽은 방 수는 "내 예약"과 같은 숫자 배지
  { icon: "chat", label: "채팅", href: PATHS.CHAT.LIST },
  { icon: "review", label: "내 후기", href: PATHS.MY_REVIEWS },
  { icon: "saved", label: "저장", href: PATHS.MY_SAVED },
  { icon: "recent", label: "최근 본", href: PATHS.RECENT },
  // 견적 요청(기획 I-46 SC-13 4). 아직 보지 않은 견적 수는 견적 기능(1단계 ②)과 함께 띄운다
  { icon: "list", label: "내 견적", href: PATHS.MY_QUOTES },
] as const;

const TERMS_MENU = [
  { label: "서비스 이용약관", href: PATHS.TERMS.TERMS_OF_SERVICE },
  { label: "위치정보 이용약관", href: PATHS.TERMS.LOCATION_TERMS },
  { label: "개인정보 처리방침", href: PATHS.TERMS.PRIVACY_POLICY },
  { label: "개인정보 제3자 제공 동의", href: PATHS.TERMS.THIRD_PARTY_CONSENT },
] as const;

export default function MypagePage() {
  // 마이페이지 메인 화면 노출
  useEffect(() => {
    trackEvent("view_mypage");
  }, []);

  const { isAuthenticated } = useAuthStore();
  const hasHydrated = useAuthHasHydrated();
  // 메뉴 클릭 후 뒤로가기 시 클릭했던 스크롤 위치로 복원 (레이아웃이 정해지는 hydration 이후 활성화)
  useScrollRestoration("/mypage", hasHydrated);
  const { data: user } = useMypageProfile();
  const openLoginSheet = useLoginSheetStore((s) => s.openLoginSheet);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [showProfileUpdatedToast, setShowProfileUpdatedToast] = useState(false);
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateMypageProfile();
  const { data: ordersData } = useMyOrders({ type: "UPCOMING" });
  const { data: chatStatus } = useChatStatus();
  const { data: chatUnread } = useChatUnread();
  const quickLinks = QUICK_LINKS.filter((l) => l.icon !== "chat" || !!chatStatus?.open);
  const chatUnreadCount = chatUnread?.unreadThreads ?? 0;
  const upcomingCount =
    ordersData?.pages
      .flatMap((p) => p.data)
      .filter(
        (o) =>
          o.orderStatus === OrderStatus.RESERVATION_REQUESTED ||
          o.orderStatus === OrderStatus.PAYMENT_PENDING ||
          o.orderStatus === OrderStatus.PAYMENT_COMPLETED ||
          o.orderStatus === OrderStatus.CONFIRMED ||
          o.orderStatus === OrderStatus.PICKUP_PENDING,
      ).length ?? 0;

  return (
    <div className="pb-[60px]">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white px-5 flex justify-between items-center h-[56px]">
        <h1 className="text-xl font-bold text-gray-900">My</h1>
        <div className="flex items-center gap-4">
          <Link href={PATHS.SEARCH} className="flex items-center justify-center">
            <Icon name="search" width={24} height={24} className="text-gray-900" />
          </Link>
          {hasHydrated && isAuthenticated && (
            <>
              <Link href={PATHS.ALARM} className="flex items-center justify-center">
                <Icon name="alarm" width={24} height={24} className="text-gray-900" />
              </Link>
              <Link href={PATHS.SETTING} className="flex items-center justify-center">
                <Icon name="setting" width={24} height={24} className="text-gray-900" />
              </Link>
            </>
          )}
        </div>
      </header>

      {!hasHydrated ? (
        <div className="px-5 py-5 flex items-center gap-3 mb-3">
          <div className="w-[44px] h-[44px] rounded-full bg-gray-100 animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      ) : isAuthenticated ? (
        <>
          {/* 프로필 */}
          <div className="px-5 py-5 flex items-center gap-3 mb-3">
            {/* 프로필 이미지 */}
            <div className="w-[44px] h-[44px] rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="프로필"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icon name="mypage" width={44} height={44} className="text-gray-200" />
              )}
            </div>

            {/* 유저 정보 */}
            <div className="flex-1">
              <div className="flex flex-col gap-[2px]">
                <p className="text-base font-bold text-gray-900">{user?.nickname}</p>
                <div className="text-2sm text-gray-500">{user ? getLoginInfo(user) : "-"}</div>
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

          <UpcomingOrderCard />

          <ul className="flex py-[10px] mx-5 mb-8 border border-gray-100 rounded-lg">
            {quickLinks.map(({ icon, label, href }, index) => (
              <li
                key={icon}
                className={`relative flex-1 flex justify-center ${index < quickLinks.length - 1 ? "after:content-[''] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-5 after:w-px after:bg-gray-50" : ""}`}
              >
                <Link
                  href={href}
                  className="relative flex flex-col items-center gap-2 py-3 text-gray-900 font-bold text-sm"
                >
                  <div className="relative">
                    <Icon name={icon} width={20} height={20} className="text-gray-900" />
                    {icon === "reservation" && upcomingCount > 0 && (
                      <span className="absolute -top-[6px] -right-[8px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold px-1">
                        {upcomingCount}
                      </span>
                    )}
                    {icon === "chat" && chatUnreadCount > 0 && (
                      <span className="absolute -top-[6px] -right-[8px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold px-1">
                        {chatUnreadCount}
                      </span>
                    )}
                  </div>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-6 mb-8">
          <p className="text-sm text-gray-700">더욱 편리한 이용을 위해</p>
          <button
            type="button"
            onClick={() => openLoginSheet("mypage")}
            className="py-[10px] px-5 text-sm font-bold text-white bg-primary rounded-lg"
          >
            로그인 / 회원가입
          </button>
        </div>
      )}

      {/* 고객 서비스 */}
      <section>
        <p className="px-5 py-2 text-xs text-gray-500">고객 서비스</p>
        {[
          { label: "공지사항", href: PATHS.NOTICE },
          { label: "Q&A", href: PATHS.QNA },
          { label: "고객센터", href: PATHS.SUPPORT },
        ].map(({ label, href }) => (
          <LinkListItem key={label} href={href} label={label} />
        ))}
      </section>

      {/* 기타 */}
      <section className="mt-8 pb-[60px]">
        <p className="px-5 py-2 text-xs text-gray-500">기타</p>
        {TERMS_MENU.map(({ label, href }) => (
          <LinkListItem key={href} href={href} label={label} />
        ))}
        <LinkListItem href={PATHS.VERSION} label="버전정보" />
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

      <BottomNav />
    </div>
  );
}
