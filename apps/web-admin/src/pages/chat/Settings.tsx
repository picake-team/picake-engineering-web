import React, { useEffect, useState } from "react";
import { BaseButton as Button } from "@/apps/web-admin/common/components/buttons/BaseButton";
import { Card } from "@/apps/web-admin/common/components/cards/Card";
import { ContentLoading } from "@/apps/web-admin/common/components/loading/ContentLoading";
import {
  LIST_CARD,
  LIST_SCREEN_HEADING,
  LIST_SECTION_GAP,
} from "@/apps/web-admin/common/constants/list-typography.constant";
import {
  formatKst,
  isoToKstInput,
  kstInputToIso,
  useChatOpenConfig,
  useSetChatOpen,
} from "@/apps/web-admin/features/chat-management/chat-management";

/**
 * 채팅 > 여는 시각(기획 I-11). 처리방침·약관 개정 시행 시각에 맞춰 연다.
 * 그 전에는 손님·사장님 화면에 채팅 버튼·탭 숫자가 보이지 않고 서버도 막는다.
 * 입력은 한국 시각, 서버에는 UTC로 저장한다.
 */
export const ChatSettingsPage: React.FC = () => {
  const { data, isLoading } = useChatOpenConfig();
  const save = useSetChatOpen();
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(isoToKstInput(data?.chatOpensAt ?? null));
  }, [data?.chatOpensAt]);

  const iso = kstInputToIso(value);

  return (
    <div className={LIST_SECTION_GAP}>
      <div>
        <h1 className={LIST_SCREEN_HEADING}>채팅 여는 시각</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          개인정보처리방침·약관 개정이 시행되는 시각에 맞춰 여세요. 그 전에는 채팅이 보이지 않아요.
        </p>
      </div>

      <Card className={LIST_CARD}>
        {isLoading ? (
          <ContentLoading variant="section" message="불러오는 중…" className="py-12" />
        ) : (
          <div className="flex flex-col gap-4 px-5 py-5">
            <div className="text-sm">
              지금:{" "}
              <span className="font-semibold">
                {data?.open
                  ? "열림"
                  : data?.chatOpensAt
                    ? `닫힘 · ${formatKst(data.chatOpensAt)}에 열려요`
                    : "닫힘(여는 시각 없음)"}
              </span>
            </div>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-muted-foreground">여는 시각(한국 시각)</span>
              <input
                type="datetime-local"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-10 w-64 rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button disabled={!iso || save.isPending} onClick={() => iso && save.mutate(iso)}>
                저장
              </Button>
              <Button
                variant="outline"
                disabled={!data?.chatOpensAt || save.isPending}
                onClick={() => save.mutate(null)}
              >
                채팅 닫기
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              닫으면 손님·사장님 화면에서 채팅이 바로 사라져요(대화는 지워지지 않아요).
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
