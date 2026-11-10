"use client";

import { useState } from "react";
import Header from "@/apps/web-user/common/components/headers/Header";
import { Icon } from "@/apps/web-user/common/components/icons";
import { useQnas } from "@/apps/web-user/features/qna/hooks/queries/useQnas";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";

export default function QnaPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: sections, isLoading } = useQnas();

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      <Header variant="back-title" title="Q&A" />
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-gray-400">불러오는 중…</p>
        </div>
      )}
      {!isLoading && (!sections || sections.length === 0) && (
        <EmptyState message="등록된 Q&A가 없어요." fill />
      )}
      {!isLoading && sections && sections.length > 0 && (
        <div className="pt-4">
          {sections.map((section) => (
            <section key={section.category} className="pb-6">
              {section.category && (
                <p className="px-5 py-2 text-xs text-gray-500">{section.category}</p>
              )}
              <ul>
                {section.items.map((item) => (
                  <li
                    key={item.id}
                    className={expandedId === item.id ? "" : "border-b border-gray-100"}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      className="w-full flex items-center gap-[10px] py-4 px-5"
                    >
                      <p className="flex-1 text-left text-sm font-bold text-gray-900">
                        Q. {item.question}
                      </p>
                      <Icon
                        name="arrow"
                        width={20}
                        height={20}
                        className={`text-gray-900 shrink-0 transition-transform ${expandedId === item.id ? "rotate-0" : "rotate-180"}`}
                      />
                    </button>
                    {expandedId === item.id && (
                      <div className="px-5">
                        <p className="px-3 py-4 text-sm text-gray-900 bg-gray-50 rounded-lg leading-[160%] whitespace-pre-line">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
