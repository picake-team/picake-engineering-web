"use client";

import { useState } from "react";
import Header from "@/apps/web-user/common/components/headers/Header";
import { Icon } from "@/apps/web-user/common/components/icons";
import { formatDateDot } from "@/apps/web-user/common/utils/date.util";
import { useNotices } from "@/apps/web-user/features/notice/hooks/queries/useNotices";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";

export default function NoticePage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: notices, isLoading } = useNotices();

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      <Header variant="back-title" title="공지사항" />
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-gray-400">불러오는 중…</p>
        </div>
      )}
      {!isLoading && (!notices || notices.length === 0) && (
        <EmptyState message="등록된 공지사항이 없어요." fill />
      )}
      {!isLoading && notices && notices.length > 0 && (
        <ul className="pt-4">
          {notices.map((notice) => (
            <li
              key={notice.id}
              className={expandedId === notice.id ? "" : "border-b border-gray-100"}
            >
              <button
                type="button"
                onClick={() => handleToggle(notice.id)}
                className="w-full flex items-center gap-[10px] py-4 px-5"
              >
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-gray-900">{notice.title}</p>
                  <p className="text-xs text-gray-400">{formatDateDot(notice.createdAt)}</p>
                </div>
                <Icon
                  name="arrow"
                  width={20}
                  height={20}
                  className={`text-gray-900 shrink-0 transition-transform ${expandedId === notice.id ? "rotate-0" : "rotate-180"}`}
                />
              </button>
              {expandedId === notice.id && (
                <div className="px-5">
                  <p className="px-3 py-4 text-sm text-gray-900 bg-gray-50 rounded-lg leading-[160%] whitespace-pre-line">
                    {notice.content}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
