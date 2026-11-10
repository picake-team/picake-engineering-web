"use client";

import Link from "next/link";
import { Icon } from "@/apps/web-user/common/components/icons";

interface LinkListItemProps {
  href: string;
  label: string;
}

/**
 * 라벨 + 오른쪽 화살표로 이루어진 메뉴 row.
 * 마이페이지·설정 페이지의 리스트 항목에 공용으로 사용.
 */
export function LinkListItem({ href, label }: LinkListItemProps) {
  return (
    <Link
      href={href}
      className="press-bg flex items-center justify-between px-5 py-4 border-b border-gray-100"
    >
      <span className="text-sm font-bold text-gray-900">{label}</span>
      <Icon name="arrow" width={20} height={20} className="text-gray-900 rotate-90" />
    </Link>
  );
}
