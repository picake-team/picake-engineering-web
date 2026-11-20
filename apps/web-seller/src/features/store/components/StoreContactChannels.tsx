/**
 * 스토어 정보 "손님 연락 채널" (기획 I-01·P-95, 운영자 2026-11-20 시안 B).
 * 채널마다 한 줄: 회색 아이콘 · 이름과 적은 값 · "손님에게 보이기" 스위치.
 * 값이 있는 채널(카카오톡·인스타그램·전화)은 줄을 누르면 아래 창에서 적는다. 칸이 비면 스위치를 켤 수 없다.
 * 전화번호는 꼭 적는다(판매자 정보로도 쓰는 번호, 기획 P-46). 비면 줄에 고칠 곳 문구를 보인다.
 */
import React, { useEffect, useRef, useState } from "react";
import { Switch } from "@/apps/web-seller/common/ui/Toggle";
import { Icon, type IconName } from "@/apps/web-seller/common/ui/icons";
import { RowIconBox } from "@/apps/web-seller/common/ui/List";
import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { Dialog } from "@/apps/web-seller/common/components/dialogs/Dialog";
import { FRAME_SUBMIT_BUTTON_CLASS } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import type { StoreForm } from "@/apps/web-seller/features/store/types/store.ui";
import { validateStorePhoneNumber } from "@/apps/web-seller/features/store/utils/validator.util";

type ValueKey = "kakaoChannelId" | "instagramId" | "phoneNumber";
type VisibleKey =
  | "chatInquiryVisible"
  | "kakaoChannelVisible"
  | "instagramVisible"
  | "phoneVisible";

interface Channel {
  key: string;
  title: string;
  icon: IconName;
  visibleKey: VisibleKey;
  /** 적는 값(없으면 Picake 채팅처럼 스위치만) */
  value?: { key: ValueKey; label: string; placeholder: string; tel?: boolean; required?: boolean };
  help?: React.ReactNode;
}

const KAKAO_HELP = (
  <details className="mt-1 text-xs text-muted-foreground">
    <summary className="cursor-pointer">ID는 어디서 찾나요?</summary>
    <p className="mt-1">
      카카오비즈니스 파트너센터 → 전체메뉴 → 링크 공유 → 채널 URL의 마지막 부분이에요. 예:{" "}
      <span className="font-mono">pf.kakao.com/_xeaCon</span>이면{" "}
      <span className="font-mono">_xeaCon</span>
    </p>
  </details>
);

/** 손님 문의 창(손님 앱 StoreInquiryBottomSheet)과 같은 순서 */
const CHANNELS: Channel[] = [
  { key: "chat", title: "Picake 채팅", icon: "chat", visibleKey: "chatInquiryVisible" },
  {
    key: "kakao",
    title: "카카오톡 채널",
    icon: "kakao",
    visibleKey: "kakaoChannelVisible",
    value: { key: "kakaoChannelId", label: "카카오톡 채널 ID", placeholder: "예: _xeaCon" },
    help: KAKAO_HELP,
  },
  {
    key: "instagram",
    title: "인스타그램",
    icon: "instagram",
    visibleKey: "instagramVisible",
    value: { key: "instagramId", label: "인스타그램 ID", placeholder: "예: picake_official" },
  },
  {
    key: "phone",
    title: "전화",
    icon: "phone",
    visibleKey: "phoneVisible",
    value: {
      key: "phoneNumber",
      label: "전화번호",
      placeholder: "예: 02-1234-5678",
      tel: true,
      required: true,
    },
  },
];

interface Props {
  form: StoreForm;
  patch: (p: Partial<StoreForm>) => void;
  /** 저장을 누른 뒤 전화번호 고칠 곳 문구 */
  phoneError?: string;
  /** 운영자 대신 입력 중에는 "손님에게 보이기"를 사장님만 바꾼다(P-93) */
  locked: boolean;
}

export function StoreContactChannels({ form, patch, phoneError, locked }: Props) {
  const [editing, setEditing] = useState<Channel | null>(null);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 창이 열리면 칸에 초점(autoFocus는 창이 열릴 때 본체로 초점을 옮겨 소용없다). 이 효과는 창(자식) 효과 뒤에 돌아서
  // 창은 누른 줄을 "열기 전 초점"으로 기억하고, 닫으면 그 줄로 돌아간다
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const text = (c: Channel) => (c.value ? (form[c.value.key] ?? "").trim() : "");
  const hasValue = (c: Channel) => !c.value || !!text(c);
  const errorOf = (c: Channel) => (c.value?.key === "phoneNumber" ? phoneError : undefined);
  // 저장을 눌러 고칠 곳이 생긴 뒤에는 창 안에서도 적는 대로 다시 검사해 보인다
  const sheetError =
    editing?.value?.key === "phoneNumber" && phoneError ? validateStorePhoneNumber(draft) : null;

  const open = (c: Channel) => {
    setDraft(c.value ? (form[c.value.key] ?? "") : "");
    setEditing(c);
  };
  const apply = () => {
    if (editing?.value) patch({ [editing.value.key]: draft } as Partial<StoreForm>);
    setEditing(null);
  };

  return (
    <div className="font-app">
      {CHANNELS.map((c) => {
        const error = errorOf(c);
        const label = (
          <>
            <RowIconBox>
              <Icon name={c.icon} size={18} strokeWidth={1.9} className="text-ink-600" />
            </RowIconBox>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-body font-semibold text-ink-900">
                {c.title}
                {c.value?.required && <span className="text-destructive"> *</span>}
              </span>
              {c.value && (
                <span
                  className={cn(
                    "text-sub",
                    // 적은 값은 한 줄로 자르고, 고칠 곳·안내 글은 잘리지 않게 줄을 바꾼다(320 폭)
                    error
                      ? "break-keep text-destructive"
                      : hasValue(c)
                        ? "truncate text-ink-600"
                        : "break-keep text-ink-500",
                  )}
                >
                  {error ?? (hasValue(c) ? text(c) : `${c.value.label}를 적어 주세요`)}
                </span>
              )}
            </span>
          </>
        );
        return (
          <div
            key={c.key}
            className="flex min-h-14 items-center gap-3 border-b border-ink-100 last:border-b-0"
          >
            {c.value ? (
              <button
                type="button"
                onClick={() => open(c)}
                className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left active:bg-ink-50"
              >
                {label}
                <span className="shrink-0 text-ink-400">
                  <Icon name="chevronRight" size={18} strokeWidth={2} />
                </span>
              </button>
            ) : (
              <span className="flex min-w-0 flex-1 items-center gap-3 py-2">{label}</span>
            )}
            <Switch
              label={`${c.title} 손님에게 보이기`}
              // 값이 없으면 보일 것이 없어 켤 수 없다(P-95)
              checked={hasValue(c) && form[c.visibleKey] !== false}
              disabled={locked || !hasValue(c)}
              onChange={(on) => patch({ [c.visibleKey]: on } as Partial<StoreForm>)}
            />
          </div>
        );
      })}

      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.value?.label ?? ""}
        footer={
          <Button type="button" className={cn(FRAME_SUBMIT_BUTTON_CLASS, "w-full")} onClick={apply}>
            확인
          </Button>
        }
      >
        {editing?.value && (
          <div>
            <Input
              ref={inputRef}
              aria-label={editing.value.label}
              aria-invalid={sheetError ? true : undefined}
              placeholder={editing.value.placeholder}
              inputMode={editing.value.tel ? "tel" : undefined}
              autoComplete={editing.value.tel ? "tel" : undefined}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className={sheetError ? "border-destructive" : undefined}
              onKeyDown={(e) => {
                // 바깥 스토어 폼이 제출되지 않게 막고 창만 닫는다
                if (e.key === "Enter") {
                  e.preventDefault();
                  apply();
                }
              }}
            />
            {sheetError && <p className="mt-1 text-sm text-destructive">{sheetError}</p>}
            {editing.help}
          </div>
        )}
      </Dialog>
    </div>
  );
}
