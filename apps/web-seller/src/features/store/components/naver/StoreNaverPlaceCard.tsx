import React, { useState } from "react";
import {
  FRAME_SUBMIT_BUTTON_CLASS,
  useInMobileFrame,
} from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { Button as AppButton } from "@/apps/web-seller/common/ui/Button";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { Checkbox } from "@/apps/web-seller/common/components/inputs/Checkbox";
import { Dialog } from "@/apps/web-seller/common/components/dialogs/Dialog";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
// 앱 안에서는 apps://로 바꿔 휴대폰 브라우저·네이버 지도 앱으로 연다(PC·휴대폰 브라우저는 그대로)
import { externalHref } from "@/apps/web-seller/common/utils/webview.bridge";
import type {
  NaverPlacePreviewResponseDto,
  StoreNaverPlaceDto,
} from "@/apps/web-seller/features/store/types/store.dto";
import type { StoreForm } from "@/apps/web-seller/features/store/types/store.ui";
import {
  useConnectNaverPlace,
  useDisconnectNaverPlace,
  usePreviewNaverPlace,
} from "@/apps/web-seller/features/store/hooks/mutations/useStoreMutation";
import {
  buildNaverImportRows,
  defaultSelectedKeys,
  formatNaverBusinessDay,
  pickNaverValues,
  type NaverImportFieldKey,
} from "@/apps/web-seller/features/store/utils/naver-place.util";

interface Props {
  /** 수정 화면이면 스토어 ID (등록 화면이면 없음) */
  storeId?: string;
  /** 수정 화면: 지금 연결된 네이버 매장 */
  connected?: StoreNaverPlaceDto | null;
  /** 지금 폼 값 (네이버 값과 비교) */
  form: StoreForm;
  /** 고른 네이버 값을 폼에 넣는다 (저장은 폼의 등록·수정 버튼으로) */
  onApply: (patch: Partial<StoreForm>) => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

/**
 * 네이버 플레이스에서 매장 정보 가져오기 (I-10)
 * 폼 위에는 한 줄 안내와 버튼 하나만 두고, 링크 입력 → 확인 → 채우기는 창에서 끝낸다.
 * - 등록: "내 매장이 맞아요, 채우기"를 누르면 고른 항목을 채우고, 등록할 때 함께 연결한다.
 * - 수정: 연결한 매장을 다시 불러와 바뀐 것만 보여 준다(기본 미선택). 연결 전이면 연결하고 채운다.
 * 채우기만으로는 저장하지 않는다. 주소는 주소 검색으로, 픽업 시간은 캘린더에서 정한다.
 */
export const StoreNaverPlaceCard: React.FC<Props> = ({ storeId, connected, form, onApply }) => {
  const inFrame = useInMobileFrame();
  const mode = storeId ? "edit" : "create";
  const submitLabel = mode === "edit" ? "수정하기" : "등록하기";
  const { addAlert } = useAlertStore();

  const previewMutation = usePreviewNaverPlace();
  const connectMutation = useConnectNaverPlace();
  const disconnectMutation = useDisconnectNaverPlace();

  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<NaverPlacePreviewResponseDto | null>(null);
  const [selected, setSelected] = useState<NaverImportFieldKey[]>([]);

  const isBusy =
    previewMutation.isPending || connectMutation.isPending || disconnectMutation.isPending;
  const rows = preview ? buildNaverImportRows(preview.storePrefill, form) : [];
  const changedRows = rows.filter((r) => r.status === "changed");
  const otherCount = rows.length - changedRows.length;
  const isConnectedToPreview = !!preview && connected?.placeId === preview.placeId;

  /** 실패하면 오류 알림은 mutation이 띄우고, 여기서는 false를 돌려준다 */
  const loadPreview = async (input: string) => {
    if (!input.trim()) return false;
    try {
      const result = await previewMutation.mutateAsync(input.trim());
      setPreview(result);
      setSelected(defaultSelectedKeys(buildNaverImportRows(result.storePrefill, form), mode));
      return true;
    } catch {
      return false;
    }
  };

  const openDialog = () => {
    setOpen(true);
    setPreview(null);
    setUrl("");
    setSelected([]);
    if (connected) {
      void loadPreview(connected.placeId).then((ok) => {
        if (!ok) setOpen(false);
      });
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    if (mode === "edit" && storeId && !isConnectedToPreview) {
      try {
        await connectMutation.mutateAsync({ storeId, placeId: preview.placeId });
      } catch {
        return;
      }
    }
    const patch: Partial<StoreForm> = pickNaverValues(rows, selected);
    const count = Object.keys(patch).length;
    if (mode === "create") patch.naverPlaceId = preview.placeId;
    onApply(patch);
    setOpen(false);
    addAlert({
      severity: "success",
      message:
        count > 0
          ? `${count}개 항목을 채웠어요. 확인하고 '${submitLabel}'를 눌러야 저장돼요.`
          : mode === "create"
            ? `'${submitLabel}'를 누르면 이 네이버 매장도 함께 연결돼요.`
            : "네이버 매장을 연결했어요.",
    });
  };

  const handleDisconnect = async () => {
    if (!storeId) return;
    try {
      await disconnectMutation.mutateAsync(storeId);
    } catch {
      return;
    }
    setOpen(false);
    addAlert({ severity: "info", message: "네이버 연결을 끊었어요. 스토어 정보는 그대로예요" });
  };

  const toggle = (key: NaverImportFieldKey, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, key] : prev.filter((k) => k !== key)));

  // ---------- 폼 위 한 줄 ----------
  const pendingConnect = mode === "create" && !!form.naverPlaceId;
  const bar = (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 px-4 py-3">
      <p
        className={`min-w-0 flex-1 ${inFrame ? "text-sub text-ink-600" : "text-sm text-muted-foreground"}`}
      >
        {pendingConnect ? (
          `네이버 매장 정보를 채웠어요. '${submitLabel}'를 누르면 함께 연결돼요.`
        ) : connected ? (
          <>
            네이버 매장과 연결돼 있어요 ({formatDate(connected.connectedAt)}) ·{" "}
            <a
              href={externalHref(connected.placeUrl)}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              네이버 지도에서 보기
            </a>
          </>
        ) : (
          "네이버 지도에 매장이 있으면 링크 하나로 이름·설명·연락처를 채울 수 있어요."
        )}
      </p>
      {pendingConnect ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onApply({ naverPlaceId: undefined })}
        >
          연결하지 않기
        </Button>
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={openDialog}>
          {connected ? "네이버에서 다시 불러오기" : "네이버에서 가져오기"}
        </Button>
      )}
    </div>
  );

  // ---------- 창 ----------
  const applyLabel =
    mode === "create"
      ? "내 매장이 맞아요, 채우기"
      : isConnectedToPreview
        ? "고른 것 바꾸기"
        : selected.length > 0
          ? "내 매장이 맞아요, 연결하고 채우기"
          : "내 매장이 맞아요, 연결하기";

  const secondaryAction = isConnectedToPreview
    ? { label: "연결 끊기", onClick: handleDisconnect }
    : !connected
      ? { label: "다른 링크 넣기", onClick: () => setPreview(null) }
      : null;
  const applyDisabled = isBusy || (isConnectedToPreview && selected.length === 0);

  const footer = !preview ? null : inFrame ? (
    // 휴대폰 틀 안: 주 버튼 이름이 길어("연결하고 채우기") 가득 찬 48 한 줄, 약한 행동은 아래 회색 글자
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        className={cn(FRAME_SUBMIT_BUTTON_CLASS, "w-full")}
        disabled={applyDisabled}
        onClick={handleApply}
      >
        {connectMutation.isPending ? "연결하는 중…" : applyLabel}
      </Button>
      {secondaryAction ? (
        <AppButton
          variant="quiet"
          className="self-center"
          onClick={secondaryAction.onClick}
          disabled={isBusy}
        >
          {secondaryAction.label}
        </AppButton>
      ) : null}
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-2">
      {isConnectedToPreview ? (
        <Button type="button" variant="ghost" onClick={handleDisconnect} disabled={isBusy}>
          연결 끊기
        </Button>
      ) : (
        !connected && (
          <Button type="button" variant="ghost" onClick={() => setPreview(null)} disabled={isBusy}>
            다른 링크 넣기
          </Button>
        )
      )}
      <Button
        type="button"
        className="ml-auto"
        disabled={isBusy || (isConnectedToPreview && selected.length === 0)}
        onClick={handleApply}
      >
        {connectMutation.isPending ? "연결하는 중…" : applyLabel}
      </Button>
    </div>
  );

  const address = preview ? preview.storePrefill.roadAddress || preview.storePrefill.address : null;

  return (
    <>
      {bar}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={connected ? "네이버에서 다시 불러오기" : "네이버 매장 정보 가져오기"}
        description={
          connected
            ? "네이버에서 바뀐 것만 보여 줘요. 고른 것만 바뀌고, 저장해야 반영돼요."
            : "채운 뒤에도 고칠 수 있고, 저장해야 반영돼요."
        }
        footer={footer}
      >
        {!preview ? (
          connected ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              네이버에서 불러오는 중…
            </p>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="naver-place-url">
                네이버 지도 매장 링크
              </label>
              <div className="flex gap-2">
                <Input
                  id="naver-place-url"
                  autoFocus
                  placeholder="https://naver.me/…"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    // 바깥 스토어 폼이 제출되지 않게 막고 불러오기만 한다
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void loadPreview(url);
                    }
                  }}
                />
                <Button
                  type="button"
                  disabled={isBusy || !url.trim()}
                  onClick={() => loadPreview(url)}
                >
                  {previewMutation.isPending ? "불러오는 중…" : "불러오기"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                네이버 지도 앱에서 내 매장을 열고 공유 → 링크 복사로 받은 주소를 붙여 넣으세요.
              </p>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div>
              <p className="font-medium">{preview.storePrefill.name}</p>
              <p className="text-sm text-muted-foreground">
                {[preview.category, address].filter(Boolean).join(" · ")}
              </p>
              <a
                href={externalHref(preview.placeUrl)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary underline-offset-4 hover:underline"
              >
                네이버 지도에서 확인
              </a>
            </div>

            {changedRows.length > 0 ? (
              <div className="divide-y rounded-lg border">
                {changedRows.map((row) => (
                  <div key={row.key} className="flex gap-3 p-3">
                    <Checkbox
                      checked={selected.includes(row.key)}
                      onChange={(checked) => toggle(row.key, checked)}
                      className="items-start pt-0.5"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm font-medium">{row.label}</p>
                      <p className="line-clamp-3 whitespace-pre-line break-words text-sm text-muted-foreground">
                        {row.naverValue}
                      </p>
                      {row.currentValue && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          지금 · {row.currentValue}
                        </p>
                      )}
                      {row.invalidReason && (
                        <p className="text-xs text-amber-800">
                          {row.invalidReason} 채운 뒤 고쳐 주세요.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">지금 값과 같아서 바꿀 게 없어요.</p>
            )}
            {changedRows.length > 0 && otherCount > 0 && (
              <p className="text-xs text-muted-foreground">
                같거나 네이버에 없는 {otherCount}개 항목은 그대로 둬요.
              </p>
            )}

            {(address || preview.warnings.length > 0) && (
              <ul className="list-disc space-y-0.5 pl-4">
                {address && (
                  <li className="text-xs text-muted-foreground">
                    주소는 아래 &apos;스토어 주소&apos;에서 주소 검색으로 정해 주세요.
                  </li>
                )}
                {preview.warnings.map((w) => (
                  <li key={w} className="text-xs text-amber-800">
                    {w}
                  </li>
                ))}
              </ul>
            )}

            {(preview.businessHours.days.length > 0 || preview.businessHours.freeText) && (
              <details className={inFrame ? "group font-app text-sub text-ink-900" : "text-sm"}>
                <summary
                  className={
                    inFrame
                      ? // 휴대폰 틀 안: 펼치기는 줄 이름 + 오른쪽 ⌄(▶ 글자 쓰지 않음)
                        "flex min-h-11 cursor-pointer list-none items-center gap-2 text-ink-700 [&::-webkit-details-marker]:hidden"
                      : "cursor-pointer text-muted-foreground"
                  }
                >
                  <span className={inFrame ? "flex-1" : undefined}>
                    네이버 영업시간 보기 (픽업 시간은 캘린더에서 정해요)
                  </span>
                  {inFrame ? (
                    <span className="shrink-0 text-ink-400 transition-transform group-open:rotate-180">
                      <Icon name="chevronDown" size={18} strokeWidth={2} />
                    </span>
                  ) : null}
                </summary>
                <ul className="mt-2 space-y-0.5">
                  {preview.businessHours.days.map((day) => (
                    <li key={day.day}>{formatNaverBusinessDay(day)}</li>
                  ))}
                </ul>
                {preview.businessHours.freeText && (
                  <p className="mt-1 text-muted-foreground">{preview.businessHours.freeText}</p>
                )}
              </details>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
};
