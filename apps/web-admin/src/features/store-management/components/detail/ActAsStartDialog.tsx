import { useState } from "react";
import { Button } from "@/apps/web-admin/common/components/buttons/Button";
import { Input } from "@/apps/web-admin/common/components/inputs/Input";
import getApiMessage from "@/apps/web-admin/common/utils/getApiMessage";
import { useStartActAs } from "@/apps/web-admin/features/store-management/hooks/mutations/useActAsMutation";

interface ActAsStartDialogProps {
  storeId: string;
  storeName: string;
  onClose: () => void;
}

/**
 * 이 가게로 들어가기(기획 I-41): 사유와 OTP 6자리를 받아 판매자 화면을 새 탭으로 연다.
 * 들어갈 때마다 OTP를 다시 받는다. 브라우저가 새 탭을 막으면 "판매자 화면 열기" 버튼으로 연다(코드는 60초).
 */
export function ActAsStartDialog({ storeId, storeName, onClose }: ActAsStartDialogProps) {
  const [reason, setReason] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [sellerUrl, setSellerUrl] = useState<string | null>(null);
  const start = useStartActAs(storeId);

  const canSubmit = reason.trim().length >= 2 && /^\d{6}$/.test(totpCode) && !start.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    start.mutate(
      { reason: reason.trim(), totpCode },
      {
        onSuccess: ({ sellerUrl: url }) => {
          const tab = window.open(url, "_blank");
          if (tab) {
            tab.opener = null;
            onClose();
          } else {
            setSellerUrl(url);
          }
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        // 뒤의 스토어 상세 창까지 닫히지 않게
        e.stopPropagation();
        onClose();
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
        {sellerUrl ? (
          <div className="mt-5 flex flex-col gap-2">
            <Button asChild className="h-11">
              <a href={sellerUrl} target="_blank" rel="noopener noreferrer" onClick={onClose}>
                판매자 화면 열기
              </a>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
            <Input
              label="사유"
              aria-label="사유"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              placeholder="예: 카톡 채널 요청 — 첫 상품 3개"
              autoFocus
            />
            <Input
              label="OTP"
              aria-label="OTP"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6자리"
              error={start.isError ? getApiMessage.error(start.error) : undefined}
            />
            <div className="mt-1 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
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
