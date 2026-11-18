import { useState } from "react";
import { Button } from "@/apps/web-admin/common/components/buttons/Button";
import { Input } from "@/apps/web-admin/common/components/inputs/Input";
import getApiMessage from "@/apps/web-admin/common/utils/getApiMessage";
import { actAsApi } from "@/apps/web-admin/features/store-management/apis/act-as.api";
import { useStartActAs } from "@/apps/web-admin/features/store-management/hooks/mutations/useActAsMutation";

interface ActAsStartDialogProps {
  storeId: string;
  storeName: string;
  onClose: () => void;
}

/**
 * 이 가게로 들어가기(기획 I-41): 사유와 OTP 6자리를 받아 판매자 화면을 새 탭으로 연다.
 * 들어갈 때마다 OTP를 다시 받는다. 새 탭은 누르는 순간 먼저 열어 두고(응답을 기다린 뒤 열면 브라우저가 막음) 주소만 바꾼다.
 * 그래도 막히면 "판매자 화면 열기" 버튼으로 연다(코드는 60초). 열지 않고 닫으면 만든 세션을 바로 끝낸다.
 */
export function ActAsStartDialog({ storeId, storeName, onClose }: ActAsStartDialogProps) {
  const [reason, setReason] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [fallback, setFallback] = useState<{ sellerUrl: string; sessionId: string } | null>(null);
  const start = useStartActAs(storeId);

  const canSubmit = reason.trim().length >= 2 && /^\d{6}$/.test(totpCode) && !start.isPending;

  const close = () => {
    // 들어가는 중에는 닫지 않는다(세션은 만들어졌는데 탭이 안 열리는 일을 막음)
    if (start.isPending) return;
    onClose();
  };

  const closeFallback = () => {
    // 판매자 화면을 열지 않고 닫으면 세션이 60분 동안 "진행 중"으로 남지 않게 끝낸다
    if (fallback) void actAsApi.end(fallback.sessionId).catch(() => undefined);
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const tab = window.open("about:blank", "_blank");
    start.mutate(
      { reason: reason.trim(), totpCode },
      {
        onSuccess: ({ sellerUrl, sessionId }) => {
          if (tab && !tab.closed) {
            tab.opener = null;
            tab.location.href = sellerUrl;
            onClose();
          } else {
            setFallback({ sellerUrl, sessionId });
          }
        },
        onError: () => {
          tab?.close();
        },
      },
    );
  };

  const changeField = (apply: () => void) => {
    apply();
    // 칸을 고치면 지난 오류 문구를 지운다
    if (start.isError) start.reset();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        // 뒤의 스토어 상세 창까지 닫히지 않게
        e.stopPropagation();
        if (fallback) closeFallback();
        else close();
      }}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.stopPropagation();
        if (fallback) closeFallback();
        else close();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="act-as-start-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="act-as-start-title" className="text-lg font-semibold">
          이 가게로 들어가기
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{storeName}</p>
        {fallback ? (
          <div className="mt-5 flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              브라우저가 새 탭을 막았어요. 1분 안에 아래 버튼을 눌러 주세요.
            </p>
            <Button asChild className="h-11">
              <a
                href={fallback.sellerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
              >
                판매자 화면 열기
              </a>
            </Button>
            <Button type="button" variant="outline" onClick={closeFallback}>
              닫기
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
            <Input
              label="사유"
              aria-label="사유"
              value={reason}
              onChange={(e) => changeField(() => setReason(e.target.value))}
              maxLength={200}
              placeholder="예: 카톡 채널 요청 — 첫 상품 3개"
              autoFocus
            />
            <Input
              label="OTP"
              aria-label="OTP"
              value={totpCode}
              onChange={(e) =>
                changeField(() => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6)))
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6자리"
              error={start.isError ? getApiMessage.error(start.error) : undefined}
            />
            <div className="mt-1 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={close} disabled={start.isPending}>
                닫기
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {start.isPending ? "들어가는 중…" : "들어가기"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
