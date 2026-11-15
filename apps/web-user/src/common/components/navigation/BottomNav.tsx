"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { scrollAppToTop } from "@/apps/web-user/common/hooks/useScrollRestoration";
import { Icon, type IconName } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { useChatUnread } from "@/apps/web-user/features/chat/hooks/useChat";

// activeIcon: 해당 탭에 진입했을 때 노출할 채워진(fill) 아이콘. 없으면 icon을 그대로 사용
const NAV_ITEMS: {
  icon: IconName;
  activeIcon?: IconName;
  label: string;
  path: string;
}[] = [
  { icon: "home", label: "홈", path: PATHS.HOME },
  { icon: "map", activeIcon: "mapFilled", label: "지도", path: PATHS.MAP },
  { icon: "favorite", activeIcon: "favoriteFilled", label: "저장", path: PATHS.SAVED },
  {
    icon: "mypageNav",
    activeIcon: "mypageNavFilled",
    label: "MY",
    path: PATHS.MYPAGE,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  // 안 읽은 채팅이 있으면 MY 탭에 점(기획 I-11)
  const { data: chatUnread } = useChatUnread();
  const myDot = (chatUnread?.unreadThreads ?? 0) > 0;

  return (
    <>
      <ul
        aria-label="아래 탭"
        className="fixed bottom-0 left-0 right-0 bg-white flex items-center h-[60px] border-t border-gray-100 max-w-[638px] mx-auto z-40"
      >
        {NAV_ITEMS.map(({ icon, activeIcon, label, path }) => {
          const isActive = pathname === path;
          return (
            <li key={label} className="w-[25%]">
              <Link
                href={path}
                aria-current={isActive ? "page" : undefined}
                onClick={(e) => {
                  if (!isActive) return;
                  // 보고 있는 탭을 다시 누르면 맨 위로(아이폰 맨 위 시간 누르기 대신)
                  e.preventDefault();
                  scrollAppToTop();
                }}
                className={`flex flex-col items-center justify-center text-2xs font-bold ${isActive ? "text-primary" : "text-gray-400"}`}
              >
                <span className="relative">
                  <Icon name={isActive ? (activeIcon ?? icon) : icon} width={24} height={24} />
                  {path === PATHS.MYPAGE && myDot && (
                    <span
                      className="absolute -right-[3px] -top-[1px] h-[6px] w-[6px] rounded-full bg-primary"
                      aria-label="안 읽은 채팅"
                    />
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
