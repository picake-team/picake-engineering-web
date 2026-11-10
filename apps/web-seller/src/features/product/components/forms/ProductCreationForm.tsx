import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import {
  FRAME_SUBMIT_BUTTON_CLASS,
  useInMobileFrame,
} from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { FrameSubmitBar } from "@/apps/web-seller/common/components/layouts/FrameSubmitBar";
import { Switch } from "@/apps/web-seller/common/ui/Toggle";
import { cn } from "@/apps/web-seller/common/utils/classname.util";

import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { Checkbox } from "@/apps/web-seller/common/components/inputs/Checkbox";
import { RichTextEditor } from "@/apps/web-seller/common/components/editors/RichTextEditor";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { ImageMultiUpload } from "@/apps/web-seller/features/upload/components/ImageMultiUpload";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import {
  CakeSizeDisplayName,
  EnableStatus,
  ProductType,
} from "@/apps/web-seller/features/product/types/product.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import { FormSection } from "@/apps/web-seller/common/components/sections/FormSection";
import { ProductPriceSizeSection } from "@/apps/web-seller/features/product/components/sections/ProductPriceSizeSection";
import { ProductCreationCustomOptionsSection } from "@/apps/web-seller/features/product/components/sections/ProductCreationCustomOptionsSection";
import { ProductCreationProductNoticeSection } from "@/apps/web-seller/features/product/components/sections/ProductCreationProductNoticeSection";
import { ProductCreationCategorySection } from "@/apps/web-seller/features/product/components/sections/ProductCreationCategorySection";
import { ProductCreationSearchTagSection } from "@/apps/web-seller/features/product/components/sections/ProductCreationSearchTagSection";
import {
  PRODUCT_NOTICE_FIELDS,
  PRODUCT_NOTICE_MODE,
  type ProductNoticeValues,
} from "@/apps/web-seller/features/product/utils/product-notice.util";
import { validateProductForm } from "@/apps/web-seller/features/product/utils/validateProductForm";
import {
  SELLER_CHECK_MARK,
  hasSellerCheckMark,
} from "@/apps/web-seller/features/product/utils/ai-draft.util";
import {
  NaverProductImportDialog,
  type NaverSourceText,
} from "@/apps/web-seller/features/product/components/naver/NaverProductImportDialog";
import { AiDescriptionDialog } from "@/apps/web-seller/features/product/components/naver/AiDescriptionDialog";

interface Props {
  onSubmit: (data: ProductForm) => void | Promise<unknown>;
  initialValue?: ProductForm;
  onChange?: (data: ProductForm) => void;
  disabled?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
  /** 같은 스토어 상품에서 고시를 복사하고, 네이버·AI 기능을 쓸 때 필요 */
  storeId?: string;
  /** 수정 중인 상품 (고시 복사 목록에서 뺀다) */
  productId?: string;
  /** 수정 중인 상품의 네이버 연결 정보 (다시 불러오기용) */
  naverLink?: { naverBizItemId?: string | null; naverLinkedAt?: string | Date | null };
}

type Errors = Partial<Record<keyof ProductForm, string>>;

export const defaultForm: ProductForm = {
  images: [],
  name: "",
  originalPrice: undefined,
  salePrice: undefined,
  salesStatus: EnableStatus.ENABLE,
  visibilityStatus: EnableStatus.ENABLE,
  cakeSizeOptions: [
    {
      visible: EnableStatus.ENABLE,
      displayName: CakeSizeDisplayName.DOSIRAK,
      // 지름·설명은 비워 두고 사장님이 넣게 한다(손님 화면에 "도시락 0cm"로 보이지 않게)
      lengthCm: 0,
      price: 0,
      description: "",
    },
  ],
  // 상품 유형은 판매자가 반드시 고르도록 비워 둔다
  productType: undefined,
  customOptions: [],
  productCategoryTypes: [],
  searchTags: [],
  detailDescription: "",
  productNoticeFoodType: "",
  productNoticeProducer: "",
  productNoticeOrigin: "",
  productNoticeAddress: "",
  productNoticeManufactureDate: "",
  productNoticeExpirationDate: "",
  productNoticePackageCapacity: "",
  productNoticePackageQuantity: "",
  productNoticeIngredients: "",
  productNoticeCalories: "",
  productNoticeSafetyNotice: "",
  productNoticeGmoNotice: "",
  productNoticeImportNotice: "",
  productNoticeCustomerService: "",
};

const PRODUCT_TYPES = [
  { value: ProductType.BASIC_CAKE, label: "기본 케이크", desc: "정해진 디자인으로 만들어요" },
  { value: ProductType.CUSTOM_CAKE, label: "커스텀 케이크", desc: "손님 요청대로 디자인해요" },
];

/** 에러가 난 칸 → 화면의 섹션 (위에서부터 이 순서로 찾아 이동한다) */
const SECTION_ORDER: { id: string; keys: (k: string) => boolean }[] = [
  { id: "section-photos", keys: (k) => k === "images" },
  { id: "section-basic", keys: (k) => k === "name" || k === "productType" },
  {
    id: "section-price",
    keys: (k) => k === "salePrice" || k === "originalPrice" || k === "cakeSizeOptions",
  },
  { id: "section-custom", keys: (k) => k === "customOptions" },
  { id: "section-detail", keys: (k) => k === "detailDescription" },
  { id: "section-notice", keys: (k) => k.startsWith("productNotice") },
  { id: "section-status", keys: (k) => k === "salesStatus" || k === "visibilityStatus" },
];

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

/**
 * 상품 등록·수정 폼
 * - 한 화면에 사장님이 입력하는 순서대로: 사진 → 이름 → 가격·사이즈 → 추가 옵션(맛 등) → 설명 → 고시
 * - 판매 상태와 분류·태그는 옆 칸, 저장 버튼은 아래에 붙어 있다
 * - 네이버 가져오기와 AI 설명은 버튼 하나로 여는 창에서 끝난다
 */
export const ProductCreationForm: React.FC<Props> = ({
  onSubmit,
  initialValue,
  onChange,
  disabled = false,
  onDelete,
  isDeleting = false,
  storeId,
  productId,
  naverLink,
}) => {
  const isEdit = !!initialValue;
  const inFrame = useInMobileFrame();
  const [form, setForm] = useState<ProductForm>(initialValue || defaultForm);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  // 다른 상품에서 복사한 고시: 판매자가 이 상품에 맞게 확인해야 저장된다 (P-59)
  const [noticeCopy, setNoticeCopy] = useState<{ fromName: string; confirmed: boolean } | null>(
    null,
  );
  const [noticeCopyError, setNoticeCopyError] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(!isEdit);
  const [naverOpen, setNaverOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSource, setAiSource] = useState("");

  const { data: store } = useStoreDetail(storeId ?? "");
  const storeConnected = !!store?.naverPlace;
  const tools = !!storeId && !disabled;

  // 최신 폼 값. 에디터(Quill)는 값이 바뀐 뒤 정리된 HTML로 onChange를 한 번 더 부르는데,
  // 그때 렌더 시점의 form으로 합치면 방금 채운 네이버 값이 지워진다. 그래서 항상 이 값에 합친다.
  const formRef = useRef(form);

  useEffect(() => {
    if (initialValue) {
      formRef.current = initialValue;
      setForm(initialValue);
      setErrors({});
      setSubmitted(false);
      setNoticeCopy(null);
      setNoticeCopyError(false);
    }
  }, [initialValue]);

  const commit = (next: ProductForm) => {
    formRef.current = next;
    setForm(next);
    onChange?.(next);
    if (submitted) setErrors(validateProductForm(next));
  };

  const patch = (p: Partial<ProductForm>) => {
    if (disabled) return;
    commit({ ...formRef.current, ...p });
  };

  const handleNaverApply = (
    next: ProductForm,
    extra: { naverBizItemId?: string; source: NaverSourceText },
  ) => {
    if (disabled) return;
    commit(extra.naverBizItemId ? { ...next, naverBizItemId: extra.naverBizItemId } : next);
    const sourceText = [extra.source.description, extra.source.precautions]
      .filter(Boolean)
      .join("\n\n");
    if (sourceText) setAiSource(sourceText);
  };

  const handleAiInsert = (html: string, how: "replace" | "append") =>
    patch({
      detailDescription:
        how === "replace" ? html : `${formRef.current.detailDescription ?? ""}${html}`,
    });

  const handleCopyNotice = (values: ProductNoticeValues, productName: string) => {
    patch(values);
    setNoticeCopy({ fromName: productName, confirmed: false });
    setNoticeCopyError(false);
  };

  const noticeFilled = PRODUCT_NOTICE_FIELDS.filter(({ key }) =>
    (form[key] ?? "").toString().trim(),
  ).length;
  const checkMarkLeft = hasSellerCheckMark(form.detailDescription);
  const errorKeys = Object.keys(errors);
  const sectionHasError = (id: string) =>
    errorKeys.some((k) => SECTION_ORDER.find((s) => s.id === id)?.keys(k));

  const goToFirstError = (keys: string[]) => {
    const first = SECTION_ORDER.find((s) => keys.some((k) => s.keys(k)));
    if (!first) return;
    if (first.id === "section-notice") setNoticeOpen(true);
    setTimeout(() => scrollTo(first.id), 0);
  };

  // 서버 답을 기다리는 동안 다시 누르면 상품이 두 번 만들어지지 않게
  const [saving, setSaving] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSubmitted(true);
    const next = validateProductForm(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return goToFirstError(Object.keys(next));
    if (checkMarkLeft) return scrollTo("section-detail");
    if (noticeCopy && !noticeCopy.confirmed) {
      setNoticeCopyError(true);
      setNoticeOpen(true);
      return setTimeout(() => scrollTo("section-notice"), 0);
    }
    setSaving(true);
    Promise.resolve(onSubmit(form)).finally(() => setSaving(false));
  };

  const blockingCount = errorKeys.length + (submitted && checkMarkLeft ? 1 : 0);

  // ---------- 네이버 안내 줄 ----------
  const linkedAt = naverLink?.naverLinkedAt
    ? new Date(naverLink.naverLinkedAt).toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
      })
    : null;
  const naverBar = tools && (
    <div
      className={
        inFrame
          ? "mb-6 flex items-center gap-3 rounded-card border border-ink-100 p-4 font-app"
          : "mb-4 flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 px-4 py-3"
      }
    >
      <p
        className={
          inFrame
            ? "min-w-0 flex-1 text-sub leading-normal text-ink-600"
            : "min-w-0 flex-1 text-sm text-muted-foreground"
        }
      >
        {!storeConnected
          ? "스토어에 네이버 매장을 연결하면 네이버 예약에 올린 상품을 불러올 수 있어요."
          : !isEdit
            ? "네이버 예약에 올린 상품이면 불러와서 사진·가격·설명을 한 번에 채울 수 있어요."
            : naverLink?.naverBizItemId
              ? `네이버 상품과 연결돼 있어요${linkedAt ? ` (${linkedAt})` : ""}. 네이버에서 바뀐 가격·설명을 불러올 수 있어요.`
              : "네이버 상품과 연결하면 네이버에서 바뀐 가격·설명을 불러올 수 있어요."}
      </p>
      {storeConnected ? (
        <Button type="button" size="sm" variant="outline" onClick={() => setNaverOpen(true)}>
          {!isEdit
            ? "네이버에서 가져오기"
            : naverLink?.naverBizItemId
              ? "네이버에서 다시 불러오기"
              : "네이버 상품과 연결"}
        </Button>
      ) : (
        <Link
          to={ROUTES.STORE_DETAIL_EDIT(storeId!)}
          className={
            inFrame
              ? "inline-flex h-10 shrink-0 items-center rounded-control border border-ink-200 px-3 text-sub font-bold text-ink-700 active:bg-ink-50"
              : "text-sm text-primary underline-offset-4 hover:underline"
          }
        >
          스토어에서 연결하기
        </Link>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      {naverBar}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* 왼쪽: 입력 순서대로 */}
        <div className="min-w-0 space-y-6">
          <FormSection
            id="section-photos"
            title={
              <>
                사진 <span className="text-destructive">*</span>
              </>
            }
            description="첫 번째 사진이 대표 사진이에요. 최대 8장까지 올릴 수 있어요."
            error={sectionHasError("section-photos")}
          >
            <ImageMultiUpload
              width={140}
              height={140}
              value={form.images ?? []}
              onChange={(images) => patch({ images })}
              maxImages={8}
              enableDragDrop
              showMinResolutionHint={false}
            />
            {errors.images && <p className="mt-2 text-sm text-destructive">{errors.images}</p>}
          </FormSection>

          <FormSection
            id="section-basic"
            title="상품 이름과 종류"
            error={sectionHasError("section-basic")}
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  상품명 <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="예: 무화과 생크림 케이크"
                  disabled={disabled}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
              </div>
              <div>
                <p
                  className={
                    inFrame
                      ? "mb-2 font-app text-sub font-bold text-ink-700"
                      : "mb-1 text-sm font-medium"
                  }
                >
                  종류 <span className="text-destructive">*</span>
                </p>
                <div
                  className={inFrame ? "grid grid-cols-2 gap-2" : "grid gap-2 sm:grid-cols-2"}
                  role="radiogroup"
                  aria-label="상품 종류"
                >
                  {PRODUCT_TYPES.map((t) => {
                    const on = form.productType === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        disabled={disabled}
                        onClick={() => patch({ productType: t.value })}
                        className={
                          inFrame
                            ? // 고른 카드: 얇은 주황 테두리 + 주황 점만(바탕은 흰색)
                              cn(
                                "relative flex flex-col gap-1 rounded-control bg-white p-4 text-left font-app",
                                on
                                  ? "border-[1.5px] border-brand p-[15.5px]"
                                  : "border border-ink-200",
                              )
                            : `rounded-lg border px-3 py-2.5 text-left transition-colors ${
                                on
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "hover:bg-muted/50"
                              }`
                        }
                      >
                        <span
                          className={
                            inFrame
                              ? "pr-6 text-body font-bold text-ink-900"
                              : "block text-sm font-medium"
                          }
                        >
                          {t.label}
                        </span>
                        <span
                          className={
                            inFrame
                              ? "text-caption text-ink-600"
                              : "block text-xs text-muted-foreground"
                          }
                        >
                          {t.desc}
                        </span>
                        {inFrame ? (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute right-3 top-3 inline-block size-5 rounded-full bg-white",
                              on ? "border-[6px] border-brand" : "border-[1.5px] border-ink-200",
                            )}
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                {errors.productType && (
                  <p className="mt-1 text-sm text-destructive">{errors.productType}</p>
                )}
              </div>
            </div>
          </FormSection>

          <ProductPriceSizeSection
            form={form}
            errors={errors}
            onChange={patch}
            disabled={disabled}
          />

          <ProductCreationCustomOptionsSection
            form={form}
            errors={errors}
            onCustomOptionsChange={(customOptions) => patch({ customOptions })}
            disabled={disabled}
          />

          <FormSection
            id="section-detail"
            title="상세 설명"
            description="손님이 주문 전에 읽는 설명이에요. 사진·글을 자유롭게 넣을 수 있어요."
            error={sectionHasError("section-detail") || (submitted && checkMarkLeft)}
            action={
              tools && (
                <Button type="button" size="sm" variant="outline" onClick={() => setAiOpen(true)}>
                  <Sparkles className="h-4 w-4" />
                  AI로 쓰기
                </Button>
              )
            }
          >
            <RichTextEditor
              value={form.detailDescription || ""}
              onChange={(detailDescription) => patch({ detailDescription })}
              placeholder="재료, 크기, 보관 방법, 픽업 안내 등을 적어 주세요."
              minHeight={260}
              error={!!errors.detailDescription}
            />
            {errors.detailDescription && (
              <p className="mt-1 text-sm text-destructive">{errors.detailDescription}</p>
            )}
            {checkMarkLeft && (
              <p className={`mt-2 text-sm ${submitted ? "text-destructive" : "text-amber-800"}`}>
                AI가 남긴 {SELLER_CHECK_MARK} 표시가 있어요. 그 부분을 사실대로 고쳐야 저장돼요.
              </p>
            )}
          </FormSection>

          {PRODUCT_NOTICE_MODE === "ORIGIN_ONLY" ? (
            // 고시는 원산지만 받는다(법 검토: product-notice.util의 PRODUCT_NOTICE_MODE)
            <FormSection
              id="section-notice"
              title={
                <>
                  원산지 <span className="text-destructive">*</span>
                </>
              }
              description="케이크에 쓴 주요 원료의 원산지예요."
              error={sectionHasError("section-notice")}
            >
              <Input
                aria-label="원산지"
                value={form.productNoticeOrigin || ""}
                onChange={(e) => patch({ productNoticeOrigin: e.target.value })}
                placeholder="예: 밀가루(미국산), 생크림·우유(국산), 딸기(국산)"
                disabled={disabled}
                className={errors.productNoticeOrigin ? "border-destructive" : ""}
              />
              {errors.productNoticeOrigin && (
                <p className="mt-1 text-sm text-destructive">{errors.productNoticeOrigin}</p>
              )}
            </FormSection>
          ) : (
            <FormSection
              id="section-notice"
              title="상품정보제공고시"
              hint={`${noticeFilled}/${PRODUCT_NOTICE_FIELDS.length} 입력`}
              description="식품을 팔 때 법으로 정해진 표시예요. 다른 상품에서 복사할 수 있어요."
              error={
                sectionHasError("section-notice") || (noticeCopyError && !noticeCopy?.confirmed)
              }
              action={
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-expanded={noticeOpen}
                  onClick={() => setNoticeOpen((v) => !v)}
                >
                  {noticeOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {noticeOpen ? "접기" : "펼치기"}
                </Button>
              }
            >
              {noticeOpen ? (
                <ProductCreationProductNoticeSection
                  hideHeader
                  form={form}
                  errors={errors}
                  onChange={(key) => (e) =>
                    patch({ [key]: e.target.value } as Partial<ProductForm>)
                  }
                  copy={
                    tools
                      ? {
                          storeId: storeId!,
                          excludeProductId: productId,
                          copiedFrom: noticeCopy?.fromName ?? null,
                          confirmed: noticeCopy?.confirmed ?? false,
                          showConfirmError: noticeCopyError,
                          onCopy: handleCopyNotice,
                          onConfirmedChange: (confirmed) =>
                            setNoticeCopy((prev) => (prev ? { ...prev, confirmed } : prev)),
                        }
                      : undefined
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {noticeFilled === PRODUCT_NOTICE_FIELDS.length
                    ? "모두 입력했어요."
                    : `${PRODUCT_NOTICE_FIELDS.length - noticeFilled}개가 비어 있어요. 펼쳐서 채워 주세요.`}
                </p>
              )}
            </FormSection>
          )}
        </div>

        {/* 오른쪽: 상태·분류 */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <FormSection id="section-status" title="판매 상태">
            {inFrame ? (
              <div className="-mt-2">
                {[
                  {
                    key: "sales",
                    title: "판매 중",
                    desc: "끄면 손님이 주문할 수 없어요",
                    on: form.salesStatus === EnableStatus.ENABLE,
                    set: (on: boolean) =>
                      patch({ salesStatus: on ? EnableStatus.ENABLE : EnableStatus.DISABLE }),
                  },
                  {
                    key: "visible",
                    title: "손님에게 보이기",
                    desc: "끄면 목록·검색에서 숨겨요",
                    on: form.visibilityStatus === EnableStatus.ENABLE,
                    set: (on: boolean) =>
                      patch({ visibilityStatus: on ? EnableStatus.ENABLE : EnableStatus.DISABLE }),
                  },
                ].map((row) => (
                  <div
                    key={row.key}
                    className="flex min-h-14 items-center gap-3 border-b border-ink-100 py-2 font-app last:border-b-0"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-body font-semibold text-ink-900">{row.title}</span>
                      <span className="text-caption text-ink-600">{row.desc}</span>
                    </span>
                    <Switch
                      label={row.title}
                      checked={row.on}
                      disabled={disabled}
                      onChange={row.set}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <Checkbox
                  checked={form.salesStatus === EnableStatus.ENABLE}
                  onChange={(on) =>
                    patch({ salesStatus: on ? EnableStatus.ENABLE : EnableStatus.DISABLE })
                  }
                  disabled={disabled}
                  label={
                    <span className="text-sm">
                      판매 중
                      <span className="block text-xs text-muted-foreground">
                        끄면 손님이 주문할 수 없어요
                      </span>
                    </span>
                  }
                />
                <Checkbox
                  checked={form.visibilityStatus === EnableStatus.ENABLE}
                  onChange={(on) =>
                    patch({ visibilityStatus: on ? EnableStatus.ENABLE : EnableStatus.DISABLE })
                  }
                  disabled={disabled}
                  label={
                    <span className="text-sm">
                      손님에게 보이기
                      <span className="block text-xs text-muted-foreground">
                        끄면 목록·검색에서 숨겨요
                      </span>
                    </span>
                  }
                />
              </div>
            )}
          </FormSection>

          <FormSection
            title="분류와 검색 태그"
            hint="(선택)"
            description="손님이 상품을 찾기 쉬워져요."
          >
            <div className="space-y-5">
              <ProductCreationCategorySection
                value={form.productCategoryTypes ?? []}
                onChange={(productCategoryTypes) => patch({ productCategoryTypes })}
                disabled={disabled}
              />
              <ProductCreationSearchTagSection
                value={form.searchTags ?? []}
                onChange={(searchTags) => patch({ searchTags })}
                disabled={disabled}
              />
            </div>
          </FormSection>
        </aside>
      </div>

      {/* 저장 버튼은 항상 화면 아래에 */}
      {!disabled && inFrame && isEdit && onDelete ? (
        // 휴대폰: 삭제는 아래 버튼 줄이 아니라 폼 맨 아래 흰 테두리 작은 버튼으로(약한 행동, 실수로 누르지 않게)
        <div className="mt-8 flex justify-center">
          <Button type="button" variant="outline" onClick={onDelete} disabled={isDeleting}>
            상품 삭제
          </Button>
        </div>
      ) : null}
      {!disabled && inFrame ? (
        // 휴대폰(디자인 6-E): 고칠 곳이 있으면 "고칠 곳 n개"(누르면 첫 고칠 곳으로) | 등록하기
        <FrameSubmitBar>
          {blockingCount > 0 && (
            <Button
              type="button"
              variant="outline"
              className={FRAME_SUBMIT_BUTTON_CLASS}
              onClick={() =>
                errorKeys.length ? goToFirstError(errorKeys) : scrollTo("section-detail")
              }
            >
              고칠 곳 {blockingCount}개
            </Button>
          )}
          <Button
            type="submit"
            disabled={isDeleting || saving}
            className={cn(FRAME_SUBMIT_BUTTON_CLASS, blockingCount > 0 && "flex-[2]")}
          >
            {saving ? (isEdit ? "저장하는 중…" : "등록하는 중…") : isEdit ? "저장하기" : "등록하기"}
          </Button>
        </FrameSubmitBar>
      ) : null}
      {!disabled && !inFrame && (
        <div className="sticky bottom-0 z-10 mt-6 flex items-center gap-3 border-t bg-background/95 px-1 py-3 backdrop-blur">
          {blockingCount > 0 && (
            <button
              type="button"
              className="text-sm text-destructive underline-offset-4 hover:underline"
              onClick={() =>
                errorKeys.length ? goToFirstError(errorKeys) : scrollTo("section-detail")
              }
            >
              고칠 곳 {blockingCount}개 보기
            </button>
          )}
          <div className="ml-auto flex gap-2">
            {isEdit && onDelete && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={onDelete}
                disabled={isDeleting}
              >
                삭제
              </Button>
            )}
            <Button type="submit" disabled={isDeleting}>
              {isEdit ? "저장하기" : "등록하기"}
            </Button>
          </div>
        </div>
      )}

      {tools && storeConnected && (
        <NaverProductImportDialog
          open={naverOpen}
          onClose={() => setNaverOpen(false)}
          storeId={storeId!}
          product={
            productId ? { id: productId, naverBizItemId: naverLink?.naverBizItemId } : undefined
          }
          form={form}
          onApply={handleNaverApply}
        />
      )}
      {tools && (
        <AiDescriptionDialog
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          storeId={storeId!}
          form={form}
          sourceText={aiSource}
          onInsert={handleAiInsert}
        />
      )}
    </form>
  );
};
