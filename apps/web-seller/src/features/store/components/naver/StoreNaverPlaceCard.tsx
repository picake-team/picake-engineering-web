import React, { useState } from "react";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { Card, CardContent } from "@/apps/web-seller/common/components/cards/Card";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { Checkbox } from "@/apps/web-seller/common/components/inputs/Checkbox";
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

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * 네이버 플레이스에서 매장 정보 가져오기 (I-10)
 * - 등록: 링크로 불러와 "내 매장이 맞아요"를 확인하면 고른 항목을 채우고, 등록할 때 함께 연결한다.
 * - 수정: 연결한 매장을 다시 불러와 지금 값과 비교하고, 고른 항목만 폼에 채운다.
 * 불러오기만으로는 아무것도 저장하지 않는다. 주소는 주소 검색으로, 픽업 시간은 캘린더에서 정한다.
 */
export const StoreNaverPlaceCard: React.FC<Props> = ({ storeId, connected, form, onApply }) => {
  const mode = storeId ? "edit" : "create";
  const submitLabel = mode === "edit" ? "수정하기" : "등록하기";

  const previewMutation = usePreviewNaverPlace();
  const connectMutation = useConnectNaverPlace();
  const disconnectMutation = useDisconnectNaverPlace();

  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<NaverPlacePreviewResponseDto | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [selected, setSelected] = useState<NaverImportFieldKey[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const rows = preview ? buildNaverImportRows(preview.storePrefill, form) : [];
  const isConnectedToPreview = !!preview && connected?.placeId === preview.placeId;
  const canApply = mode === "create" ? confirmed : isConnectedToPreview;
  const isBusy =
    previewMutation.isPending || connectMutation.isPending || disconnectMutation.isPending;

  const loadPreview = async (input: string) => {
    if (!input.trim()) return;
    const result = await previewMutation.mutateAsync(input.trim());
    setPreview(result);
    setConfirmed(false);
    setNotice(null);
    setSelected(defaultSelectedKeys(buildNaverImportRows(result.storePrefill, form), mode));
  };

  const handleConnect = async () => {
    if (!storeId || !preview) return;
    const result = await connectMutation.mutateAsync({ storeId, placeId: preview.placeId });
    setPreview(result);
    setUrl("");
  };

  const handleDisconnect = async () => {
    if (!storeId) return;
    await disconnectMutation.mutateAsync(storeId);
    setPreview(null);
    setSelected([]);
    setNotice(null);
  };

  const handleApply = () => {
    if (!preview || !canApply) return;
    const patch: Partial<StoreForm> = pickNaverValues(rows, selected);
    const count = Object.keys(patch).length;
    if (mode === "create") patch.naverPlaceId = preview.placeId;
    onApply(patch);
    setSelected([]);
    setNotice(
      mode === "create"
        ? `${count}개 항목을 채웠어요. 아래에서 확인하고 '${submitLabel}'를 누르면 이 네이버 매장도 함께 연결돼요.`
        : `${count}개 항목을 채웠어요. 아래에서 확인하고 '${submitLabel}'를 눌러야 저장돼요.`,
    );
  };

  const toggle = (key: NaverImportFieldKey, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, key] : prev.filter((k) => k !== key)));

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-1">네이버 플레이스에서 가져오기</h2>
        <p className="text-sm text-muted-foreground">
          네이버 지도에 있는 매장이면 링크로 이름·설명·연락처·인스타그램 ID를 가져올 수 있어요.
          가져온 값은 아래 칸에서 고칠 수 있고, &apos;{submitLabel}&apos;를 눌러야 저장돼요.
        </p>
        <div className="border-t my-4" />

        {mode === "edit" && connected ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm">
              연결된 네이버 매장 ·{" "}
              <a
                href={connected.placeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                네이버 지도에서 보기
              </a>{" "}
              <span className="text-muted-foreground">
                ({formatDateTime(connected.connectedAt)} 연결)
              </span>
            </p>
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => loadPreview(connected.placeId)}
              >
                네이버에서 다시 불러오기
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isBusy}
                onClick={handleDisconnect}
              >
                연결 끊기
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <Input
                placeholder="https://naver.me/… 또는 네이버 지도 매장 링크"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  // 바깥 스토어 폼이 제출되지 않게 막고 불러오기만 한다
                  if (e.key === "Enter") {
                    e.preventDefault();
                    loadPreview(url);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isBusy || !url.trim()}
                onClick={() => loadPreview(url)}
              >
                {previewMutation.isPending ? "불러오는 중…" : "불러오기"}
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              네이버 지도 앱에서 매장을 열고 공유 → 링크 복사로 받은 주소를 붙여 넣으세요.
            </p>
          </div>
        )}

        {preview && (
          <div className="mt-4 space-y-4">
            <div className="rounded-md border p-3 space-y-1">
              <p className="font-medium">{preview.storePrefill.name}</p>
              <p className="text-sm text-muted-foreground">
                {[
                  preview.category,
                  preview.storePrefill.roadAddress || preview.storePrefill.address,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(preview.fetchedAt)}에 네이버에서 불러왔어요 ·{" "}
                <a
                  href={preview.placeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-4 hover:underline"
                >
                  네이버 지도에서 확인
                </a>
              </p>
              {!isConnectedToPreview && (
                <div className="pt-2 space-y-2">
                  <Checkbox
                    checked={confirmed}
                    onChange={setConfirmed}
                    label={<span className="text-sm">이 매장이 제 매장이 맞아요</span>}
                  />
                  {mode === "edit" && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={!confirmed || isBusy}
                      onClick={handleConnect}
                    >
                      이 매장 연결하기
                    </Button>
                  )}
                </div>
              )}
            </div>

            {preview.warnings.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs font-medium text-amber-900">확인이 필요해요</p>
                <ul className="mt-1 list-disc pl-4 space-y-0.5">
                  {preview.warnings.map((warning) => (
                    <li key={warning} className="text-xs text-amber-800">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="divide-y rounded-md border">
              {rows.map((row) => (
                <div key={row.key} className="flex gap-3 p-3">
                  <Checkbox
                    checked={selected.includes(row.key)}
                    onChange={(checked) => toggle(row.key, checked)}
                    disabled={!canApply || row.status !== "changed"}
                    className="items-start pt-0.5"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {row.label}
                      {row.status === "same" && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          지금 값과 같음
                        </span>
                      )}
                      {row.status === "missing" && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          네이버에 없음 (지금 값 유지)
                        </span>
                      )}
                    </p>
                    {row.naverValue && (
                      <p className="max-h-24 overflow-y-auto whitespace-pre-line break-words text-sm">
                        <span className="text-muted-foreground">네이버 · </span>
                        {row.naverValue}
                      </p>
                    )}
                    {row.invalidReason && (
                      <p className="text-xs text-amber-800">
                        그대로는 저장할 수 없어요: {row.invalidReason} 채운 뒤 아래 칸에서 고쳐
                        주세요.
                      </p>
                    )}
                    {row.status === "changed" && row.currentValue && (
                      <p className="max-h-24 overflow-y-auto whitespace-pre-line break-words text-sm text-muted-foreground">
                        지금 · {row.currentValue}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {(preview.storePrefill.roadAddress || preview.storePrefill.address) && (
              <p className="text-sm text-muted-foreground">
                네이버 주소: {preview.storePrefill.roadAddress || preview.storePrefill.address}.
                주소는 아래 &apos;스토어 위치&apos;에서 주소 검색으로 확정해 주세요.
              </p>
            )}

            {(preview.businessHours.days.length > 0 || preview.businessHours.freeText) && (
              <details className="rounded-md border p-3">
                <summary className="cursor-pointer text-sm font-medium">
                  네이버 영업시간 (참고)
                </summary>
                <ul className="mt-2 space-y-0.5">
                  {preview.businessHours.days.map((day) => (
                    <li key={day.day} className="text-sm">
                      {formatNaverBusinessDay(day)}
                    </li>
                  ))}
                </ul>
                {preview.businessHours.freeText && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {preview.businessHours.freeText}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  영업시간은 자동으로 넣지 않아요. 손님이 고르는 픽업 가능 시간은 &apos;스토어
                  캘린더&apos;에서 정해요.
                </p>
              </details>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                disabled={!canApply || selected.length === 0}
                onClick={handleApply}
              >
                선택한 항목 채우기
              </Button>
              {mode === "edit" && !isConnectedToPreview && (
                <p className="text-xs text-muted-foreground">
                  먼저 이 매장을 연결하면 항목을 고를 수 있어요.
                </p>
              )}
            </div>
            {notice && <p className="text-sm text-emerald-700">{notice}</p>}
          </div>
        )}

        {mode === "create" && form.naverPlaceId && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md bg-muted px-3 py-2">
            <p className="text-sm">등록할 때 이 네이버 매장도 함께 연결돼요.</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={() => onApply({ naverPlaceId: undefined })}
            >
              연결하지 않기
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
