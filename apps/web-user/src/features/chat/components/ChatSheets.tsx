"use client";

import { useState } from "react";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { cn } from "@/apps/web-user/common/lib/utils";
import {
  CHAT_NO_REPLAY,
  CHAT_REPORT_REASONS,
  CHAT_RULES_LINES,
} from "@/apps/web-user/features/chat/constants/chat.constant";
import type { ChatReportReason } from "@/apps/web-user/features/chat/types/chat.type";

/** 처음 보낼 때 한 번: 채팅 이용 규칙(애플 1.2 약관 동의). 동의하면 그 글이 바로 간다 */
export function ChatRulesSheet({
  isOpen,
  onClose,
  onAgree,
  busy,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
  busy?: boolean;
}) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="채팅 이용 규칙"
      footer={
        <div className="px-5 py-4">
          <Button onClick={onAgree} disabled={busy}>
            동의하고 보내기
          </Button>
        </div>
      }
    >
      <ul className="flex flex-col gap-[10px] px-5 pb-2 text-sm text-gray-700">
        {CHAT_RULES_LINES.map((line) => (
          <li key={line} className="flex gap-[6px]">
            <span aria-hidden="true">·</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}

/** 방 ⋯ 메뉴: 가게 보기, 이 채팅 알림 끄기·켜기, 신고하기, 차단하기·풀기 */
export function ChatMenuSheet({
  isOpen,
  onClose,
  muted,
  blocked,
  onOpenStore,
  onToggleMute,
  onReport,
  onToggleBlock,
}: {
  isOpen: boolean;
  onClose: () => void;
  muted: boolean;
  blocked: boolean;
  onOpenStore?: () => void;
  onToggleMute: () => void;
  onReport: () => void;
  onToggleBlock: () => void;
}) {
  const row = "w-full px-5 py-[14px] text-left text-base text-gray-900 press-bg";
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="채팅"
      footer={
        <div className="px-5 py-4">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      }
    >
      <div className="flex flex-col">
        {onOpenStore && (
          <button type="button" className={row} onClick={onOpenStore}>
            가게 보기
          </button>
        )}
        <button type="button" className={row} onClick={onToggleMute}>
          {muted ? "이 채팅 알림 켜기" : "이 채팅 알림 끄기"}
        </button>
        <button type="button" className={row} onClick={onReport}>
          신고하기
        </button>
        <button
          type="button"
          className={cn(row, !blocked && "text-red-500")}
          onClick={onToggleBlock}
        >
          {blocked ? "차단 풀기" : "차단하기"}
        </button>
      </div>
    </BottomSheet>
  );
}

/** 신고(사유 5개 + 자세히). 신고하면 운영자가 24시간 안에 확인 */
export function ChatReportSheet({
  isOpen,
  onClose,
  onSubmit,
  busy,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: ChatReportReason, detail: string) => void;
  busy?: boolean;
}) {
  const [reason, setReason] = useState<ChatReportReason | null>(null);
  const [detail, setDetail] = useState("");
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="어떤 점이 불편했나요?"
      footer={
        <div className="flex flex-col gap-[8px] px-5 py-4">
          <Button disabled={!reason || busy} onClick={() => reason && onSubmit(reason, detail)}>
            신고하기
          </Button>
          <p className="text-center text-xs text-gray-500">
            신고하면 Picake가 24시간 안에 확인해요
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-[8px] px-5 pb-2">
        {CHAT_REPORT_REASONS.map((r) => (
          <button
            key={r.value}
            type="button"
            aria-pressed={reason === r.value}
            onClick={() => setReason(r.value)}
            className={cn(
              "flex h-[44px] items-center rounded-full border px-[16px] text-sm",
              reason === r.value
                ? "border-primary-100 bg-primary-50 font-bold text-primary"
                : "border-gray-100 bg-white text-gray-700",
            )}
          >
            {r.label}
          </button>
        ))}
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value.slice(0, 500))}
          placeholder="자세히 적어 주세요(선택)"
          rows={3}
          className={cn(
            CHAT_NO_REPLAY,
            "mt-[4px] w-full resize-none rounded-xl border border-gray-100 px-[14px] py-[12px] text-sm outline-none focus:border-gray-300",
          )}
        />
      </div>
    </BottomSheet>
  );
}
