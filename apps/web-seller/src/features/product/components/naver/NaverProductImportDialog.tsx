import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { Checkbox } from "@/apps/web-seller/common/components/inputs/Checkbox";
import { NumberInput } from "@/apps/web-seller/common/components/inputs/NumberInput";
import { Dialog } from "@/apps/web-seller/common/components/dialogs/Dialog";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import {
  CakeSizeDisplayName,
  EnableStatus,
} from "@/apps/web-seller/features/product/types/product.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import type {
  NaverProductDetailResponseDto,
  NaverProductListResponseDto,
  NaverProductOptionDto,
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
  NAVER_IMAGE_IMPORT_MAX,
  type ImportMode,
  type NaverImportSelection,
  type OptionChoice,
  type TextRowKey,
} from "@/apps/web-seller/features/product/utils/naver-product.util";
import {
  FRAME_SUBMIT_BUTTON_CLASS,
  useInMobileFrame,
} from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { Button as AppButton } from "@/apps/web-seller/common/ui/Button";
import { Icon } from "@/apps/web-seller/common/ui/icons";

/** 네이버에서 가져온 설명 (AI 초안 참고 자료로 넘긴다) */
export type NaverSourceText = { description: string | null; precautions: string | null };

interface Props {
  open: boolean;
  onClose: () => void;
  storeId: string;
  /** 수정 화면이면 상품 연결 정보 */
  product?: { id: string; naverBizItemId?: string | null };
  form: ProductForm;
  onApply: (next: ProductForm, extra: { naverBizItemId?: string; source: NaverSourceText }) => void;
}

type View = "list" | "detail" | "missing";
type Use = OptionChoice["use"];

const SIZE_NAMES = Object.values(CakeSizeDisplayName);
const won = (n: number | null | undefined) => (n == null ? "-" : `${n.toLocaleString()}원`);
const plus = (n: number) => (n > 0 ? `+${n.toLocaleString()}` : "+0");
const selectClass = "h-8 rounded-md border bg-background px-2 text-sm";

/** 옵션 묶음: 사장님은 옵션 하나하나가 아니라 이 단위로 고른다 */
const GROUPS: { key: string; title: string; uses: Use[] }[] = [
  { key: "price", title: "가격·사이즈", uses: ["SIZE", "BASE"] },
  { key: "extra", title: "추가 옵션 (맛 포함)", uses: ["EXTRA"] },
];

/**
 * 네이버에서 상품 가져오기·다시 불러오기 (I-43)
 * 등록: 상품 고르기 → 가져올 것 확인(묶음 단위 체크) → "내 상품이 맞아요, 채우기"
 * 수정: 바뀐 것만 보여 주고(기본 미선택) 고른 것만 바꾼다. 연결 안 된 상품은 먼저 연결한다.
 * 채우기만으로는 저장하지 않는다(폼의 저장 버튼으로 저장).
 */
export function NaverProductImportDialog({
  open,
  onClose,
  storeId,
  product,
  form,
  onApply,
}: Props) {
  const mode: ImportMode = product ? "refresh" : "create";
  const linkedKey = product?.naverBizItemId ?? null;
  const { addAlert } = useAlertStore();

  const listMutation = useLoadNaverProducts();
  const detailMutation = useLoadNaverProductDetail();
  const imagesMutation = useImportNaverImages();
  const linkMutation = useLinkNaverItem();
  const unlinkMutation = useUnlinkNaverItem();

  const inFrame = useInMobileFrame();
  const [view, setView] = useState<View>("list");
  const [list, setList] = useState<NaverProductListResponseDto | null>(null);
  const [detail, setDetail] = useState<NaverProductDetailResponseDto | null>(null);
  const [selection, setSelection] = useState<NaverImportSelection | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [pickKey, setPickKey] = useState<string | null>(null);

  const busy =
    listMutation.isPending ||
    detailMutation.isPending ||
    imagesMutation.isPending ||
    linkMutation.isPending ||
    unlinkMutation.isPending;

  const loadList = async () => {
    setView("list");
    setDetail(null);
    setPickKey(null);
    try {
      setList(await listMutation.mutateAsync(storeId));
    } catch {
      onClose();
    }
  };

  const loadDetail = async (itemKey: string, loadMode: ImportMode) => {
    try {
      const result = await detailMutation.mutateAsync({ storeId, itemKey });
      setDetail(result);
      setSelection(defaultSelection(result, form, loadMode));
      setAdvanced(false);
      setView("detail");
    } catch (error) {
      if (getErrorStatus(error) === 404) setView("missing");
      // 연결된 상품을 바로 비교하려다 실패하면(목록도 없으면) 창을 닫는다
      else if (!list) onClose();
    }
  };

  // 열 때: 연결된 상품은 바로 비교, 아니면 목록
  useEffect(() => {
    if (!open) return;
    if (mode === "refresh" && linkedKey) void loadDetail(linkedKey, "refresh");
    else void loadList();
  }, [open]);

  const textRows = useMemo(
    () => (detail ? buildTextRows(detail, form).filter((r) => r.status === "changed") : []),
    [detail, form],
  );
  const problems = detail && selection ? getSelectionProblems(detail, selection) : [];
  const selectedCount = selection
    ? selection.textKeys.length + selection.imageIndexes.length + selection.optionIds.length
    : 0;
  const preview = useMemo(
    () => (detail && selection ? applyNaverImport(form, detail, selection, mode, []) : null),
    [detail, selection, form, mode],
  );

  const choiceOf = (o: NaverProductOptionDto) =>
    selection?.optionChoices.find((c) => c.optionId === o.optionId);
  const useOf = (o: NaverProductOptionDto): Use => choiceOf(o)?.use ?? o.role;
  const groupOptions = (uses: Use[]) =>
    (detail?.options ?? []).filter((o) => uses.includes(useOf(o)));
  const groupSelectable = (uses: Use[]) =>
    groupOptions(uses).filter((o) => !o.invalidReason && (o.price ?? 0) >= 0);
  const groupChecked = (uses: Use[]) => {
    const ids = groupSelectable(uses).map((o) => o.optionId);
    return ids.length > 0 && ids.every((id) => selection?.optionIds.includes(id));
  };
  const toggleGroup = (uses: Use[], checked: boolean) => {
    const ids = groupSelectable(uses).map((o) => o.optionId);
    setSelection((s) =>
      s
        ? {
            ...s,
            optionIds: checked
              ? [...new Set([...s.optionIds, ...ids])]
              : s.optionIds.filter((id) => !ids.includes(id)),
          }
        : s,
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
  const toggleOption = (id: string, checked: boolean) =>
    setSelection((s) =>
      s
        ? { ...s, optionIds: checked ? [...s.optionIds, id] : s.optionIds.filter((x) => x !== id) }
        : s,
    );
  const updateChoice = (id: string, patch: Partial<OptionChoice>) =>
    setSelection((s) =>
      s
        ? {
            ...s,
            optionChoices: s.optionChoices.map((c) => (c.optionId === id ? { ...c, ...patch } : c)),
          }
        : s,
    );

  const apply = async () => {
    if (!detail || !selection || problems.length > 0 || selectedCount === 0) return;
    let uploaded: string[] = [];
    let failed = 0;
    if (selection.imageIndexes.length > 0) {
      try {
        const r = await imagesMutation.mutateAsync({
          storeId,
          itemKey: detail.itemKey,
          indexes: selection.imageIndexes,
        });
        uploaded = r.urls;
        failed = r.failedIndexes.length;
      } catch {
        return;
      }
    }
    onApply(applyNaverImport(form, detail, selection, mode, uploaded), {
      naverBizItemId: mode === "create" && detail.source === "BOOKING" ? detail.itemKey : undefined,
      source: { description: detail.description, precautions: detail.precautions },
    });
    addAlert({
      severity: "success",
      message: `네이버 내용을 채웠어요${failed ? ` (사진 ${failed}장은 못 가져왔어요)` : ""}. 확인하고 ${
        mode === "create" ? "등록" : "저장"
      }해 주세요.`,
    });
    onClose();
  };

  const stopSelling = () => {
    onApply(
      { ...form, salesStatus: EnableStatus.DISABLE },
      { source: { description: null, precautions: null } },
    );
    addAlert({
      severity: "info",
      message: "판매 상태를 '판매중지'로 바꿨어요. 저장해야 반영돼요.",
    });
    onClose();
  };

  const link = async () => {
    if (!product || !pickKey) return;
    try {
      await linkMutation.mutateAsync({ productId: product.id, bizItemId: pickKey });
    } catch {
      return;
    }
    await loadDetail(pickKey, "refresh");
  };

  const unlink = async () => {
    if (!product) return;
    try {
      await unlinkMutation.mutateAsync(product.id);
    } catch {
      return;
    }
    addAlert({ severity: "info", message: "네이버 연결을 끊었어요. 상품 내용은 그대로예요." });
    onClose();
  };

  // ---------- 화면 ----------
  const title =
    mode === "create"
      ? "네이버에서 상품 가져오기"
      : linkedKey
        ? "네이버에서 다시 불러오기"
        : "네이버 상품과 연결";

  let body: React.ReactNode = null;
  let footer: React.ReactNode = null;

  if (view === "list") {
    const linkOnly = mode === "refresh";
    body = !list ? (
      <p className="py-8 text-center text-sm text-muted-foreground">
        네이버에서 상품을 불러오는 중…
      </p>
    ) : list.items.length === 0 ? (
      <p className="py-8 text-center text-sm text-muted-foreground">
        네이버에 가져올 상품이 없어요.
      </p>
    ) : (
      <div className="space-y-2">
        {list.warnings.map((w) => (
          <p key={w} className="text-xs text-amber-800">
            {w}
          </p>
        ))}
        <ul className="divide-y rounded-lg border">
          {list.items.map((item) => {
            const taken = !!item.linkedProduct && item.linkedProduct.id !== product?.id;
            const disabled = taken || (linkOnly && item.source !== "BOOKING");
            const picked = pickKey === item.itemKey;
            return (
              <li key={item.itemKey}>
                <button
                  type="button"
                  disabled={disabled || busy}
                  onClick={() =>
                    linkOnly ? setPickKey(item.itemKey) : loadDetail(item.itemKey, "create")
                  }
                  className={`flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 ${
                    picked
                      ? // 휴대폰 틀 안: 고른 줄은 회색 바탕 + 오른쪽 주황 체크
                        inFrame
                        ? "bg-ink-50"
                        : "bg-primary/5 ring-1 ring-inset ring-primary"
                      : ""
                  }`}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {taken
                        ? `이미 '${item.linkedProduct!.name}'(으)로 가져왔어요`
                        : [item.priceText, item.summary].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {picked && inFrame ? (
                    <span className="shrink-0 text-brand">
                      <Icon name="check" size={18} strokeWidth={2.4} />
                    </span>
                  ) : null}
                  {!linkOnly && !disabled && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
    footer = linkOnly ? (
      <div className="flex items-center justify-end gap-2">
        <p className="mr-auto text-xs text-muted-foreground">
          연결하면 네이버에서 바뀐 가격·설명을 불러와 비교할 수 있어요.
        </p>
        <Button type="button" disabled={!pickKey || busy} onClick={link}>
          이 상품과 연결
        </Button>
      </div>
    ) : null;
  }

  if (view === "missing") {
    body = (
      <div className="space-y-2 py-4">
        <p className="text-sm">
          네이버에서 이 상품을 찾지 못했어요. 네이버에서 지웠거나 숨긴 상품일 수 있어요.
        </p>
        <p className="text-sm text-muted-foreground">
          Picake 상품은 그대로 두었어요. 계속 팔지 정해 주세요.
        </p>
      </div>
    );
    footer = (
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={unlink} disabled={busy}>
          네이버 연결 끊기
        </Button>
        {form.salesStatus === EnableStatus.ENABLE && (
          <Button type="button" variant="outline" onClick={stopSelling}>
            판매중지로 바꾸기
          </Button>
        )}
      </div>
    );
  }

  if (view === "detail" && detail && selection) {
    const menuLike = detail.menuLike && mode === "create" && !detail.itemKey.includes("-o");
    const soldOutOrClosed = detail.soldOutOptionNames.length > 0 || detail.isClosed;

    const groupLines = (uses: Use[]) => {
      const options = groupOptions(uses);
      if (options.length === 0) return [];
      if (mode === "refresh") {
        return options
          .map((o) => ({ o, c: compareOption(o, choiceOf(o), form) }))
          .filter(({ c }) => c && c.status !== "same")
          .map(({ o, c }) =>
            c!.status === "new"
              ? `${o.name} ${won(o.price)} (새로 더해요)`
              : `${o.name}: 지금 ${won(c!.current)} → ${won(o.price)}`,
          );
      }
      if (uses.includes("SIZE") && preview) {
        const picked = options.filter((o) => selection.optionIds.includes(o.optionId));
        const base = picked.find((o) => useOf(o) === "BASE");
        if (base) return [`판매가 ${won(base.price)}`];
        const names = new Set(picked.map((o) => choiceOf(o)?.sizeDisplayName).filter(Boolean));
        const sizes = preview.cakeSizeOptions.filter((s) => names.has(s.displayName));
        if (sizes.length) {
          return [
            `판매가 ${won(preview.salePrice)}`,
            sizes
              .map(
                (s) => `${s.displayName}${s.lengthCm ? `(${s.lengthCm}cm)` : ""} ${plus(s.price)}`,
              )
              .join(" · "),
          ];
        }
        // 고르지 않았을 때는 네이버 가격을 그대로 보여 준다
        return [options.map((o) => `${o.name} ${won(o.price)}`).join(" · ")];
      }
      if (uses.includes("EXTRA")) {
        const byGroup = new Map<string, string[]>();
        for (const o of options) {
          const key = `${o.groupName}${o.groupRequired ? " (필수)" : ""}`;
          byGroup.set(key, [...(byGroup.get(key) ?? []), `${o.name} ${plus(o.price ?? 0)}`]);
        }
        return [...byGroup.entries()].map(([g, items]) => `${g}: ${items.join(", ")}`);
      }
      return [options.map((o) => `${o.name}${o.price ? ` ${plus(o.price)}` : ""}`).join(", ")];
    };

    body = (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {detail.imageUrls[0] ? (
            <img
              src={detail.imageUrls[0]}
              alt=""
              referrerPolicy="no-referrer"
              className="h-14 w-14 rounded object-cover"
            />
          ) : (
            <div className="h-14 w-14 rounded bg-muted" />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{detail.name}</p>
            <p className="text-xs text-muted-foreground">
              네이버 {detail.source === "BOOKING" ? "예약" : "메뉴"} ·{" "}
              {new Date(detail.fetchedAt).toLocaleString("ko-KR", {
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              기준
            </p>
          </div>
        </div>

        {mode === "refresh" && soldOutOrClosed && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="flex-1 text-sm text-amber-900">
              {detail.isClosed ? "네이버에서 예약을 받지 않는 상품이에요. " : ""}
              {detail.soldOutOptionNames.length
                ? `네이버 품절: ${detail.soldOutOptionNames.join(", ")}`
                : ""}
            </p>
            {form.salesStatus === EnableStatus.ENABLE && (
              <Button type="button" size="sm" variant="outline" onClick={stopSelling}>
                판매중지로 바꾸기
              </Button>
            )}
          </div>
        )}

        {menuLike ? (
          <div className="space-y-2">
            <p className="text-sm">
              이 네이버 상품은 여러 상품을 묶은 주문서예요. 가져올 상품을 하나 고르세요.
            </p>
            <ul className="divide-y rounded-lg border">
              {detail.options
                .filter((o) => (o.price ?? 0) > 0)
                .map((o) => (
                  <li key={o.optionId}>
                    <button
                      type="button"
                      disabled={!!o.linkedProduct || busy}
                      onClick={() => loadDetail(`${detail.itemKey}-o${o.optionId}`, "create")}
                      className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50 disabled:opacity-50"
                    >
                      {o.imageUrl ? (
                        <img
                          src={o.imageUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {o.name}
                        {o.linkedProduct && (
                          <span className="ml-2 text-xs text-muted-foreground">이미 가져옴</span>
                        )}
                      </span>
                      <span className="text-sm text-muted-foreground">{won(o.price)}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ) : (
          <>
            <div className="divide-y rounded-lg border">
              {textRows.map((row) => (
                <div key={row.key} className="flex gap-3 p-3">
                  <Checkbox
                    checked={selection.textKeys.includes(row.key)}
                    onChange={(c) => toggleText(row.key, c)}
                    className="items-start pt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {row.key === "name"
                        ? "상품명"
                        : row.key === "description"
                          ? "상세 설명"
                          : "예약 안내 (상세 설명 끝에 붙여요)"}
                    </p>
                    <p className="line-clamp-2 whitespace-pre-line text-sm text-muted-foreground">
                      {row.naverValue}
                    </p>
                    {row.key !== "name" && hasNaverOnlyGuide(row.naverValue) && (
                      <p className="mt-0.5 text-xs text-amber-800">
                        네이버 전용 안내(톡톡·리뷰 등)가 섞여 있어요. 채운 뒤 고치거나 AI로 다시
                        쓰세요.
                      </p>
                    )}
                    {mode === "refresh" && row.currentValue && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        지금 · {row.currentValue}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {detail.imageUrls.length > 0 && (
                <div className="flex gap-3 p-3">
                  <Checkbox
                    checked={selection.imageIndexes.length > 0}
                    onChange={(c) =>
                      setSelection((s) =>
                        s
                          ? {
                              ...s,
                              imageIndexes: c
                                ? detail.imageUrls.map((_, i) => i).slice(0, NAVER_IMAGE_IMPORT_MAX)
                                : [],
                            }
                          : s,
                      )
                    }
                    className="items-start pt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      사진{" "}
                      <span className="font-normal text-muted-foreground">
                        {selection.imageIndexes.length}/{NAVER_IMAGE_IMPORT_MAX}장 선택
                      </span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {detail.imageUrls.map((url, i) => {
                        const on = selection.imageIndexes.includes(i);
                        return (
                          <button
                            key={url}
                            type="button"
                            aria-pressed={on}
                            aria-label={`사진 ${i + 1} ${on ? "빼기" : "넣기"}`}
                            onClick={() => toggleImage(i, !on)}
                            className={`h-14 w-14 overflow-hidden rounded border-2 ${on ? "border-primary" : "border-transparent opacity-40"}`}
                          >
                            <img
                              src={url}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {GROUPS.map((g) => {
                const lines = groupLines(g.uses).filter(Boolean);
                if (groupOptions(g.uses).length === 0 || lines.length === 0) return null;
                return (
                  <div key={g.key} className="flex gap-3 p-3">
                    <Checkbox
                      checked={groupChecked(g.uses)}
                      onChange={(c) => toggleGroup(g.uses, c)}
                      disabled={groupSelectable(g.uses).length === 0}
                      className="items-start pt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{g.title}</p>
                      {lines.map((l) => (
                        <p key={l} className="text-sm text-muted-foreground">
                          {l}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {mode === "refresh" &&
              textRows.length === 0 &&
              GROUPS.every((g) => groupLines(g.uses).filter(Boolean).length === 0) && (
                <p className="text-sm text-muted-foreground">
                  지금 상품과 네이버 내용이 같아요. 바꿀 게 없어요.
                </p>
              )}

            {detail.warnings.length > 0 && (
              <details
                className={
                  inFrame
                    ? // 휴대폰 틀 안: 앱 주의 안내(흰 바탕 + 주황 테두리) + 오른쪽 ⌄ 펼치기
                      "group rounded-card border-[1.5px] border-brand bg-white px-4 py-3 font-app"
                    : "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
                }
              >
                <summary
                  className={
                    inFrame
                      ? "flex min-h-6 cursor-pointer list-none items-center gap-2 text-sub font-semibold text-ink-900 [&::-webkit-details-marker]:hidden"
                      : "cursor-pointer text-sm text-amber-900"
                  }
                >
                  {inFrame ? (
                    <span className="shrink-0 text-brand">
                      <Icon name="warning" size={18} strokeWidth={2} />
                    </span>
                  ) : null}
                  <span className={inFrame ? "flex-1" : undefined}>
                    확인할 것 {detail.warnings.length}개
                  </span>
                  {inFrame ? (
                    <span className="shrink-0 text-ink-400 transition-transform group-open:rotate-180">
                      <Icon name="chevronDown" size={18} strokeWidth={2} />
                    </span>
                  ) : null}
                </summary>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {detail.warnings.map((w) => (
                    <li key={w} className="text-xs text-amber-800">
                      {w}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {detail.options.length > 0 && (
              <div>
                {inFrame ? (
                  // 휴대폰 틀 안: 앱 펼치기 줄(이름 + 오른쪽 ⌄), "알림이 안 와요"와 같은 모양
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center gap-3 text-left font-app"
                    onClick={() => setAdvanced((v) => !v)}
                    aria-expanded={advanced}
                  >
                    <span className="flex-1 text-body font-semibold text-ink-900">
                      옵션 하나씩 정하기 ({detail.options.length}개)
                    </span>
                    <span
                      className={`shrink-0 text-ink-400 transition-transform ${advanced ? "rotate-180" : ""}`}
                    >
                      <Icon name="chevronDown" size={18} strokeWidth={2} />
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setAdvanced((v) => !v)}
                    aria-expanded={advanced}
                  >
                    {advanced ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    옵션 하나씩 정하기 ({detail.options.length}개)
                  </button>
                )}
                {advanced && (
                  <ul className="mt-2 divide-y rounded-lg border">
                    {detail.options.map((o) => {
                      const c = choiceOf(o);
                      const use = useOf(o);
                      return (
                        <li key={o.optionId} className="flex flex-wrap items-center gap-2 p-2">
                          <Checkbox
                            checked={selection.optionIds.includes(o.optionId)}
                            onChange={(v) => toggleOption(o.optionId, v)}
                            disabled={use === "SKIP"}
                          />
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {o.name} <span className="text-muted-foreground">{won(o.price)}</span>
                            {o.isSoldOut && (
                              <span className="ml-1 text-xs text-amber-800">품절</span>
                            )}
                          </span>
                          <select
                            aria-label={`${o.name} 넣을 곳`}
                            className={selectClass}
                            value={use}
                            onChange={(e) =>
                              updateChoice(o.optionId, { use: e.target.value as Use })
                            }
                          >
                            <option value="SIZE">사이즈</option>
                            <option value="BASE">판매가</option>
                            <option value="EXTRA">추가 옵션</option>
                            <option value="SKIP">넣지 않음</option>
                          </select>
                          {use === "SIZE" && (
                            <>
                              <select
                                aria-label={`${o.name} 사이즈`}
                                className={selectClass}
                                value={c?.sizeDisplayName ?? ""}
                                onChange={(e) =>
                                  updateChoice(o.optionId, {
                                    sizeDisplayName: (e.target.value ||
                                      null) as CakeSizeDisplayName | null,
                                  })
                                }
                              >
                                <option value="">사이즈</option>
                                {SIZE_NAMES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                              <div className="flex w-20 items-center gap-1">
                                <NumberInput
                                  aria-label={`${o.name} 지름`}
                                  value={c?.lengthCm ?? undefined}
                                  onChange={(v) =>
                                    updateChoice(o.optionId, { lengthCm: v ?? null })
                                  }
                                  placeholder="지름"
                                  className="h-8"
                                />
                                <span className="text-xs text-muted-foreground">cm</span>
                              </div>
                            </>
                          )}
                          {o.invalidReason && (
                            <p className="w-full pl-6 text-xs text-amber-800">{o.invalidReason}</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {problems.length > 0 && (
              <ul className="list-disc space-y-0.5 pl-4">
                {problems.map((p) => (
                  <li key={p} className="text-xs text-destructive">
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    );

    footer = inFrame ? (
      // 휴대폰 틀 안: 긴 주 버튼이 잘리지 않게 위아래로. 주 버튼(가득 찬 48)이 위, 약한 행동은 회색 글자
      <div className="flex flex-col gap-1">
        {!menuLike && (
          <Button
            type="button"
            className={FRAME_SUBMIT_BUTTON_CLASS + " w-full"}
            disabled={busy || selectedCount === 0 || problems.length > 0}
            onClick={apply}
          >
            {imagesMutation.isPending
              ? "사진 가져오는 중…"
              : mode === "create"
                ? "내 상품이 맞아요, 채우기"
                : "고른 것 바꾸기"}
          </Button>
        )}
        <AppButton
          variant="quiet"
          className="self-center"
          onClick={mode === "create" ? loadList : unlink}
          disabled={busy}
        >
          {mode === "create" ? "다른 상품 고르기" : "연결 끊기"}
        </AppButton>
      </div>
    ) : (
      <div className="flex flex-wrap items-center gap-2">
        {mode === "create" ? (
          <Button type="button" variant="ghost" onClick={loadList} disabled={busy}>
            다른 상품 고르기
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={unlink} disabled={busy}>
            연결 끊기
          </Button>
        )}
        {!menuLike && (
          <Button
            type="button"
            className="ml-auto"
            disabled={busy || selectedCount === 0 || problems.length > 0}
            onClick={apply}
          >
            {imagesMutation.isPending
              ? "사진 가져오는 중…"
              : mode === "create"
                ? "내 상품이 맞아요, 채우기"
                : "고른 것 바꾸기"}
          </Button>
        )}
      </div>
    );
  }

  if (busy && view !== "detail" && !list) {
    body = <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중…</p>;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={title}
      description={
        mode === "create"
          ? "네이버 예약에 올린 상품의 이름·설명·사진·가격을 채워요. 채운 뒤 고칠 수 있고, 등록해야 저장돼요."
          : "네이버에서 바뀐 것만 보여 줘요. 고른 것만 바뀌고, 저장해야 반영돼요."
      }
      footer={footer}
    >
      {body}
    </Dialog>
  );
}
