"use client";

import Link from "next/link";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";

interface MainPageHeaderProps {
  /** 좌측 타이틀 */
  title: string;
  /** 검색 아이콘 노출 (기본 true) */
  showSearch?: boolean;
  /** 알림 아이콘 노출 (기본 true) */
  showAlarm?: boolean;
  /** 설정 아이콘 노출 (기본 false) */
  showSetting?: boolean;
  /** 설정 아이콘 클릭 핸들러 */
  onSettingClick?: () => void;
}

/**
 * 홈 / 지도 / 저장 / MY 같은 최상위 메인 페이지의 sticky 헤더.
 * 좌측 타이틀 + 우측 액션 아이콘(검색·알림·설정).
 *
 * 뒤로가기가 필요한 서브 페이지는 `<Header variant="back-title" />` 사용.
 */
export function MainPageHeader({
  title,
  showSearch = true,
  showAlarm = true,
  showSetting = false,
  onSettingClick,
}: MainPageHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white px-5 flex justify-between items-center h-[56px]">
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <div className="flex items-center gap-4">
        {showSearch && (
          <Link href={PATHS.SEARCH} aria-label="검색" className="flex items-center justify-center">
            <Icon name="search" width={24} height={24} className="text-gray-900" />
          </Link>
        )}
        {showAlarm && (
          <Link href={PATHS.ALARM} aria-label="알림" className="flex items-center justify-center">
            <Icon name="alarm" width={24} height={24} className="text-gray-900" />
          </Link>
        )}
        {showSetting && (
          <button
            type="button"
            onClick={onSettingClick}
            aria-label="설정"
            className="flex items-center justify-center"
          >
            <Icon name="setting" width={24} height={24} className="text-gray-900" />
          </button>
        )}
      </div>
    </header>
  );
}
