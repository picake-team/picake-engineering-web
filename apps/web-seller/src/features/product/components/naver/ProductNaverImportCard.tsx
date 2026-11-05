import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { Card, CardContent } from "@/apps/web-seller/common/components/cards/Card";
import { Checkbox } from "@/apps/web-seller/common/components/inputs/Checkbox";
import { NumberInput } from "@/apps/web-seller/common/components/inputs/NumberInput";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import {
  CakeSizeDisplayName,
  EnableStatus,
} from "@/apps/web-seller/features/product/types/product.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import type {
  NaverProductDetailResponseDto,
  NaverProductListResponseDto,
} from "@/apps/web-seller/features/product/types/product-naver.dto";
import {
  getErrorStatus,
  useImportNaverImages,
  useLinkNaverItem,
  useLoadNaverProductDetail,
  useLoadNaverProducts,
  useUnlinkNaverItem,
} from "@/apps/web-seller/features/product/hooks/mutations/useProductNaverMutation";
import {
  applyNaverImport,
  buildTextRows,
  compareOption,
  defaultSelection,
  getSelectionProblems,
  hasNaverOnlyGuide,
  type ImportMode,
  type NaverImportSelection,
  type OptionChoice,
  type TextRowKey,
} from "@/apps/web-seller/features/product/utils/naver-product.util";

/** 네이버에서 가져온 설명 (AI 초안 참고 자료로 넘긴다) */
export type NaverSourceText = { description: string | null; precautions: string | null };

interface Props {
  storeId: string;
  /** 수정 화면이면 상품 연결 정보 */
  product?: { id: string; naverBizItemId?: string | null; naverLinkedAt?: string | Date | null };
  form: ProductForm;
  /** 고른 값을 넣은 새 폼과, 등록 때 함께 연결할 네이버 상품 ID */
  onApply: (next: ProductForm, extra: { naverBizItemId?: string; source: NaverSourceText }) => void;
}

const SIZE_OPTIONS = Object.values(CakeSizeDisplayName);
const formatDateTime = (value: string | Date) =>
  new Date(value).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const won = (n: number | null | undefined) => (n == null ? "-" : `${n.toLocaleString()}원`);

/**
 * 네이버에서 상품 가져오기·다시 불러오기 (I-43)
 * - 등록: 연결한 네이버 매장의 상품을 골라 "제 상품이 맞아요"를 확인하면 고른 항목을 폼에 채운다. 등록할 때 네이버 상품도 함께 연결된다.
 * - 수정: 연결한 네이버 상품을 다시 불러와 지금 값과 비교하고, 고른 항목만 폼에 채운다(기본 미선택).
 * 불러오기만으로는 저장하지 않는다. 품절·사라진 상품도 자동으로 판매중지하지 않고 판매자가 고른다.
 */
export const ProductNaverImportCard: React.FC<Props> = ({ storeId, product, form, onApply }) => {
  const mode: ImportMode = product ? "refresh" : "create";
  const submitLabel = product ? "수정하기" : "등록하기";
  const linkedItemId = product?.naverBizItemId ?? null;

  const { data: store } = useStoreDetail(storeId);
  const storeConnected = !!store?.naverPlace;

  const listMutation = useLoadNaverProducts();
  const detailMutation = useLoadNaverProductDetail();
  const imagesMutation = useImportNaverImages();
  const linkMutation = useLinkNaverItem();
  const unlinkMutation = useUnlinkNaverItem();

  const [list, setList] = useState<NaverProductListResponseDto | null>(null);
  const [detail, setDetail] = useState<NaverProductDetailResponseDto | null>(null);
  const [missing, setMissing] = useState(false);
  const [selection, setSelection] = useState<NaverImportSelection | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingLinkKey, setPendingLinkKey] = useState<string | null>(null);

  const isBusy =
    listMutation.isPending ||
    detailMutation.isPending ||
    imagesMutation.isPending ||
    linkMutation.isPending ||
    unlinkMutation.isPending;

  const textRows = useMemo(() => (detail ? buildTextRows(detail, form) : []), [detail, form]);
  const problems = detail && selection ? getSelectionProblems(detail, selection) : [];
  const selectedCount = selection
    ? selection.textKeys.length + selection.imageIndexes.length + selection.optionIds.length
    : 0;
  const needsConfirm = mode === "create";
  const canApply =
    !!detail && (!needsConfirm || confirmed) && selectedCount > 0 && problems.length === 0;

  const loadList = async () => {
    const result = await listMutation.mutateAsync(storeId);
    setList(result);
    setDetail(null);
    setSelection(null);
    setNotice(null);
  };

  const loadDetail = async (itemKey: string, loadMode: ImportMode) => {
    setMissing(false);
    setNotice(null);
    try {
      const result = await detailMutation.mutateAsync({ storeId, itemKey });
      setDetail(result);
      setSelection(defaultSelection(result, form, loadMode));
      setConfirmed(false);
    } catch (error) {
      if (getErrorStatus(error) === 404) {
        setDetail(null);
        setMissing(true);
      }
    }
  };

  const handleLink = async (itemKey: string) => {
    if (!product) return;
    await linkMutation.mutateAsync({ productId: product.id, bizItemId: itemKey });
    setPendingLinkKey(null);
    setList(null);
    await loadDetail(itemKey, "refresh");
  };

  const handleUnlink = async () => {
    if (!product) return;
    await unlinkMutation.mutateAsync(product.id);
    setDetail(null);
    setSelection(null);
    setMissing(false);
  };

  const stopSelling = () => {
    onApply(
      { ...form, salesStatus: EnableStatus.DISABLE },
      { source: { description: null, precautions: null } },
    );
    setNotice(`판매 상태를 '판매중지'로 바꿨어요. '${submitLabel}'를 눌러야 저장돼요.`);
  };

  const handleApply = async () => {
    if (!detail || !selection || !canApply) return;
    let uploaded: string[] = [];
    let failedImages = 0;
    if (selection.imageIndexes.length > 0) {
      const result = await imagesMutation.mutateAsync({
        storeId,
        itemKey: detail.itemKey,
        indexes: selection.imageIndexes,
      });
      uploaded = result.urls;
      failedImages = result.failedIndexes.length;
    }
    const next = applyNaverImport(form, detail, selection, mode, uploaded);
    onApply(next, {
      naverBizItemId: mode === "create" && detail.source === "BOOKING" ? detail.itemKey : undefined,
      source: { description: detail.description, precautions: detail.precautions },
    });
    setSelection({ ...selection, textKeys: [], imageIndexes: [], optionIds: [] });
    setNotice(
      `${selectedCount}개 항목을 채웠어요.${failedImages ? ` 사진 ${failedImages}장은 가져오지 못했어요.` : ""} 아래에서 확인하고 '${submitLabel}'를 눌러야 저장돼요.` +
        (mode === "create" && detail.source === "BOOKING"
          ? " 등록할 때 이 네이버 상품도 함께 연결돼요."
          : ""),
    );
  };

  const toggleText = (key: TextRowKey, checked: boolean) =>
    setSelection((s) =>
      s
        ? { ...s, textKeys: checked ? [...s.textKeys, key] : s.textKeys.filter((k) => k !== key) }
        : s,
    );
  const toggleImage = (index: number, checked: boolean) =>
    setSelection((s) =>
      s
        ? {
            ...s,
            imageIndexes: checked
              ? [...s.imageIndexes, index]
              : s.imageIndexes.filter((i) => i !== index),
          }
        : s,
    );
  const toggleOption = (optionId: string, checked: boolean) =>
    setSelection((s) =>
      s
        ? {
            ...s,
            optionIds: checked
              ? [...s.optionIds, optionId]
              : s.optionIds.filter((i) => i !== optionId),
          }
        : s,
    );
  const updateChoice = (optionId: string, patch: Partial<OptionChoice>) =>
    setSelection((s) =>
      s
        ? {
            ...s,
            optionChoices: s.optionChoices.map((c) =>
              c.optionId === optionId ? { ...c, ...patch } : c,
            ),
          }
        : s,
    );

  const showProblemBox = (detail?.soldOutOptionNames.length ?? 0) > 0 || detail?.isClosed;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-1">
          {mode === "create" ? "네이버에서 상품 가져오기" : "네이버 상품"}
        </h2>
        <p className="text-sm text-muted-foreground">
          네이버 예약에 올린 상품이면 이름·설명·사진·사이즈별 가격을 가져올 수 있어요. 가져온 값은
          아래 칸에서 고칠 수 있고, &apos;{submitLabel}&apos;를 눌러야 저장돼요.
        </p>
        <div className="border-t my-4" />

        {!storeConnected ? (
          <div className="rounded-md bg-muted px-3 py-2 text-sm">
            스토어에 네이버 매장을 먼저 연결해 주세요.{" "}
            <Link
              to={ROUTES.STORE_DETAIL_EDIT(storeId)}
              className="text-primary underline-offset-4 hover:underline"
            >
              스토어 수정에서 연결하기
            </Link>
          </div>
        ) : mode === "refresh" && linkedItemId ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm">
              네이버 상품과 연결됨
              {product?.naverLinkedAt && (
                <span className="text-muted-foreground">
                  {" "}
                  ({formatDateTime(product.naverLinkedAt)} 연결)
                </span>
              )}
            </p>
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => loadDetail(linkedItemId, "refresh")}
              >
                {detailMutation.isPending ? "불러오는 중…" : "네이버에서 다시 불러오기"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isBusy}
                onClick={handleUnlink}
              >
                연결 끊기
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" disabled={isBusy} onClick={loadList}>
              {listMutation.isPending
                ? "불러오는 중…"
                : mode === "create"
                  ? "네이버 상품 목록 불러오기"
                  : "네이버 상품과 연결하기"}
            </Button>
            {mode === "refresh" && (
              <p className="text-xs text-muted-foreground">
                연결하면 네이버에서 바뀐 가격·설명을 다시 불러와 비교할 수 있어요.
              </p>
            )}
          </div>
        )}

        {/* 상품 목록 */}
        {list && !detail && (
          <div className="mt-4 space-y-2">
            {list.warnings.map((w) => (
              <p key={w} className="text-xs text-amber-800">
                {w}
              </p>
            ))}
            {list.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">네이버에 가져올 상품이 없어요.</p>
            ) : (
              <ul className="divide-y rounded-md border">
                {list.items.map((item) => {
                  const linkedElsewhere =
                    !!item.linkedProduct && item.linkedProduct.id !== product?.id;
                  const linkOnly = mode === "refresh";
                  const disabled = linkedElsewhere || (linkOnly && item.source !== "BOOKING");
                  return (
                    <li key={item.itemKey} className="flex items-center gap-3 p-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="h-14 w-14 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 shrink-0 rounded bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[item.priceText, item.summary].filter(Boolean).join(" · ")}
                        </p>
                        {linkedElsewhere && (
                          <p className="text-xs text-amber-800">
                            이미 &apos;{item.linkedProduct!.name}&apos; 상품으로 가져왔어요
                          </p>
                        )}
                        {item.isClosed && (
                          <p className="text-xs text-amber-800">네이버에서 예약을 받지 않는 상품</p>
                        )}
                      </div>
                      {linkOnly ? (
                        pendingLinkKey === item.itemKey ? (
                          <div className="flex flex-col items-end gap-1">
                            <Checkbox
                              checked={confirmed}
                              onChange={setConfirmed}
                              label={<span className="text-xs">이 상품이 맞아요</span>}
                            />
                            <Button
                              type="button"
                              size="sm"
                              disabled={!confirmed || isBusy}
                              onClick={() => handleLink(item.itemKey)}
                            >
                              연결하기
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={disabled || isBusy}
                            onClick={() => {
                              setPendingLinkKey(item.itemKey);
                              setConfirmed(false);
                            }}
                          >
                            고르기
                          </Button>
                        )
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={disabled || isBusy}
                          onClick={() => loadDetail(item.itemKey, "create")}
                        >
                          가져오기
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* 네이버에서 사라진 상품 */}
        {missing && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 space-y-2">
            <p className="text-sm text-amber-900">
              네이버에서 이 상품을 찾지 못했어요. 네이버에서 지웠거나 숨긴 상품일 수 있어요. Picake
              상품은 그대로 두었어요.
            </p>
            <div className="flex gap-2">
              {form.salesStatus === EnableStatus.ENABLE && (
                <Button type="button" size="sm" variant="outline" onClick={stopSelling}>
                  판매중지로 바꾸기
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isBusy}
                onClick={handleUnlink}
              >
                연결 끊기
              </Button>
            </div>
          </div>
        )}

        {/* 상품 상세 */}
        {detail && selection && (
          <div className="mt-4 space-y-4">
            <div className="rounded-md border p-3 space-y-1">
              <p className="font-medium">{detail.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(detail.fetchedAt)}에 네이버
                {detail.source === "BOOKING" ? " 예약" : " 메뉴"}에서 불러왔어요
              </p>
              {needsConfirm && (
                <div className="pt-2">
                  <Checkbox
                    checked={confirmed}
                    onChange={setConfirmed}
                    label={
                      <span className="text-sm">
                        네이버에 올린 제 상품이 맞아요 (사진도 제가 올린 사진이에요)
                      </span>
                    }
                  />
                </div>
              )}
              {mode === "create" && list && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDetail(null);
                    setSelection(null);
                  }}
                >
                  다른 상품 고르기
                </Button>
              )}
            </div>

            {showProblemBox && mode === "refresh" && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 space-y-2">
                {detail.isClosed && (
                  <p className="text-sm text-amber-900">네이버에서 예약을 받지 않는 상품이에요.</p>
                )}
                {detail.soldOutOptionNames.length > 0 && (
                  <p className="text-sm text-amber-900">
                    네이버에서 품절: {detail.soldOutOptionNames.join(", ")}. Picake에서는 자동으로
                    바꾸지 않았어요.
                  </p>
                )}
                {form.salesStatus === EnableStatus.ENABLE && (
                  <Button type="button" size="sm" variant="outline" onClick={stopSelling}>
                    판매중지로 바꾸기
                  </Button>
                )}
              </div>
            )}

            {detail.warnings.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs font-medium text-amber-900">확인이 필요해요</p>
                <ul className="mt-1 list-disc pl-4 space-y-0.5">
                  {detail.warnings.map((w) => (
                    <li key={w} className="text-xs text-amber-800">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 이름·설명 */}
            <div className="divide-y rounded-md border">
              {textRows.map((row) => (
                <div key={row.key} className="flex gap-3 p-3">
                  <Checkbox
                    checked={selection.textKeys.includes(row.key)}
                    onChange={(checked) => toggleText(row.key, checked)}
                    disabled={row.status !== "changed"}
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
                      <p className="max-h-28 overflow-y-auto whitespace-pre-line break-words text-sm">
                        <span className="text-muted-foreground">네이버 · </span>
                        {row.naverValue}
                      </p>
                    )}
                    {row.key !== "name" && hasNaverOnlyGuide(row.naverValue) && (
                      <p className="text-xs text-amber-800">
                        네이버 예약에만 맞는 안내(톡톡·네이버 리뷰·예약 확정 절차 등)가 있어요. 채운
                        뒤 고치거나, 상세정보 탭의 AI 초안을 써 보세요.
                      </p>
                    )}
                    {row.status === "changed" && row.currentValue && (
                      <p className="max-h-20 overflow-y-auto whitespace-pre-line break-words text-sm text-muted-foreground">
                        지금 · {row.currentValue}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 사진 */}
            {detail.imageUrls.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  사진{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    (고른 사진을 Picake에 올려 상품 사진 뒤에 붙여요)
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {detail.imageUrls.map((url, index) => (
                    <label
                      key={url}
                      className="relative block h-20 w-20 cursor-pointer overflow-hidden rounded border"
                    >
                      <img
                        src={url}
                        alt={`네이버 사진 ${index + 1}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute left-1 top-1 rounded bg-white/90">
                        <Checkbox
                          checked={selection.imageIndexes.includes(index)}
                          onChange={(checked) => toggleImage(index, checked)}
                        />
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 옵션 */}
            {detail.options.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  옵션{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    (가장 싼 사이즈 가격이 판매가가 되고, 다른 사이즈는 차액이 추가금으로 들어가요)
                  </span>
                </p>
                <div className="divide-y rounded-md border">
                  {detail.options.map((option) => {
                    const choice = selection.optionChoices.find(
                      (c) => c.optionId === option.optionId,
                    );
                    const checked = selection.optionIds.includes(option.optionId);
                    const compare = mode === "refresh" ? compareOption(option, choice, form) : null;
                    // 포장주문처럼 여러 상품을 묶은 경우 옵션 하나를 상품 하나로 가져온다
                    const canImportAsProduct =
                      mode === "create" &&
                      detail.source === "BOOKING" &&
                      !detail.itemKey.includes("-o") &&
                      (option.price ?? 0) > 0;
                    return (
                      <div key={option.optionId} className="flex flex-wrap items-start gap-3 p-3">
                        <Checkbox
                          checked={checked}
                          onChange={(c) => toggleOption(option.optionId, c)}
                          disabled={choice?.use === "SKIP"}
                          className="pt-0.5"
                        />
                        {option.imageUrl && (
                          <img
                            src={option.imageUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-10 w-10 shrink-0 rounded object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">{option.name}</span>{" "}
                            <span className="text-muted-foreground">{won(option.price)}</span>
                            {option.isSoldOut && (
                              <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-900">
                                네이버 품절
                              </span>
                            )}
                          </p>
                          {option.desc && (
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {option.desc}
                            </p>
                          )}
                          {choice?.use === "EXTRA" && (
                            <p className="text-xs text-muted-foreground">
                              추가 옵션 &apos;{option.groupName}&apos; 그룹
                              {option.groupRequired ? " (필수, 하나 고르기)" : " (선택)"}에 넣어요
                            </p>
                          )}
                          {choice?.use === "BASE" && (
                            <p className="text-xs text-muted-foreground">
                              이 가격을 판매가로 넣어요
                            </p>
                          )}
                          {compare && (
                            <p className="text-xs text-muted-foreground">
                              {compare.status === "new"
                                ? "지금 상품에 없음 (더해져요)"
                                : compare.status === "same"
                                  ? `지금 가격과 같음 (${won(compare.current)})`
                                  : `지금 ${won(compare.current)} → 네이버 ${won(option.price)}`}
                            </p>
                          )}
                          {option.invalidReason && (
                            <p className="text-xs text-amber-800">{option.invalidReason}</p>
                          )}
                          {canImportAsProduct &&
                            (option.linkedProduct ? (
                              <p className="text-xs text-muted-foreground">
                                이미 &apos;{option.linkedProduct.name}&apos; 상품으로 가져왔어요
                              </p>
                            ) : (
                              <button
                                type="button"
                                className="text-xs text-primary underline-offset-4 hover:underline disabled:opacity-50"
                                disabled={isBusy}
                                onClick={() =>
                                  loadDetail(`${detail.itemKey}-o${option.optionId}`, "create")
                                }
                              >
                                이 옵션만 상품으로 가져오기
                              </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            aria-label={`${option.name} 넣을 곳`}
                            className="h-8 rounded border bg-background px-2 text-sm"
                            value={choice?.use ?? "SKIP"}
                            onChange={(e) =>
                              updateChoice(option.optionId, {
                                use: e.target.value as OptionChoice["use"],
                              })
                            }
                          >
                            <option value="SIZE">사이즈</option>
                            <option value="FLAVOR">맛</option>
                            <option value="BASE">기본 가격(판매가)</option>
                            <option value="EXTRA">추가 옵션</option>
                            <option value="SKIP">넣지 않음</option>
                          </select>
                          {choice?.use === "SIZE" && (
                            <>
                              <select
                                aria-label={`${option.name} 사이즈`}
                                className="h-8 rounded border bg-background px-2 text-sm"
                                value={choice.sizeDisplayName ?? ""}
                                onChange={(e) =>
                                  updateChoice(option.optionId, {
                                    sizeDisplayName: (e.target.value ||
                                      null) as CakeSizeDisplayName | null,
                                  })
                                }
                              >
                                <option value="">사이즈 선택</option>
                                {SIZE_OPTIONS.map((size) => (
                                  <option key={size} value={size}>
                                    {size}
                                  </option>
                                ))}
                              </select>
                              <div className="flex w-24 items-center gap-1">
                                <NumberInput
                                  aria-label={`${option.name} 지름`}
                                  value={choice.lengthCm ?? undefined}
                                  onChange={(v) =>
                                    updateChoice(option.optionId, { lengthCm: v ?? null })
                                  }
                                  placeholder="지름"
                                  className="h-8"
                                />
                                <span className="text-xs text-muted-foreground">cm</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {problems.length > 0 && (
              <ul className="list-disc pl-4 space-y-0.5">
                {problems.map((p) => (
                  <li key={p} className="text-xs text-destructive">
                    {p}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" disabled={!canApply || isBusy} onClick={handleApply}>
                {imagesMutation.isPending ? "사진 올리는 중…" : "선택한 항목 채우기"}
              </Button>
              {needsConfirm && !confirmed && (
                <p className="text-xs text-muted-foreground">
                  먼저 내 상품이 맞는지 확인해 주세요.
                </p>
              )}
            </div>
          </div>
        )}

        {notice && <p className="mt-3 text-sm text-emerald-700">{notice}</p>}
      </CardContent>
    </Card>
  );
};
