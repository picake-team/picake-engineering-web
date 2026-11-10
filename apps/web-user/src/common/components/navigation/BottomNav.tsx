"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { scrollAppToTop } from "@/apps/web-user/common/hooks/useScrollRestoration";
import { Icon, type IconName } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";

// activeIcon: 해당 탭에 진입했을 때 노출할 채워진(fill) 아이콘. 없으면 icon을 그대로 사용
const NAV_ITEMS: {
  icon: IconName;
  activeIcon?: IconName;
  label: string;
  path: string;
  ready: boolean;
}[] = [
  { icon: "home", label: "홈", path: PATHS.HOME, ready: true },
  { icon: "map", activeIcon: "mapFilled", label: "지도", path: PATHS.MAP, ready: true },
  { icon: "favorite", activeIcon: "favoriteFilled", label: "저장", path: PATHS.SAVED, ready: true },
  {
    icon: "mypageNav",
    activeIcon: "mypageNavFilled",
    label: "MY",
    path: PATHS.MYPAGE,
    ready: true,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <>
      <ul
        aria-label="아래 탭"
        className="fixed bottom-0 left-0 right-0 bg-white flex items-center h-[60px] border-t border-gray-100 max-w-[638px] mx-auto z-40"
      >
        {NAV_ITEMS.map(({ icon, activeIcon, label, path, ready }) => {
          const isActive = pathname === path;
          return (
            <li key={label} className="w-[25%]">
              {ready ? (
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
                  <Icon name={isActive ? (activeIcon ?? icon) : icon} width={24} height={24} />
                  {label}
                </Link>
              ) : (
                <button
                  onClick={() => setShowComingSoon(true)}
                  className="w-full flex flex-col items-center justify-center text-2xs font-bold text-gray-400"
                >
                  <Icon name={icon} width={24} height={24} />
                  {label}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {showComingSoon && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setShowComingSoon(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl px-8 pt-8 pb-12 flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mb-2" />
            <span className="text-6xl">🚧</span>
            <div className="flex flex-col items-center gap-2">
              <p className="text-xl font-bold text-gray-900">준비 중이에요</p>
              <p className="text-sm text-gray-400 text-center">더 나은 서비스로 곧 찾아올게요!</p>
            </div>
            <button
              onClick={() => setShowComingSoon(false)}
              className="w-full mt-2 py-4 bg-primary text-white font-bold rounded-2xl"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
