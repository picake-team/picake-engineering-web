/**
 * 상품 등록·수정 중 손님 화면 미리보기(PC에만, 기획 I-54, 운영자 결정 2026-11-19).
 * 스마트스토어 "미리보기는 PC만"·쿠팡이츠 "손님에게 보이는 메뉴를 보며 편집" 근거.
 * 넓은 PC 화면 오른쪽에 손님 앱 상품 화면을 줄여 그린다: 대표 사진 · 스토어 · 상품 이름 · 가격(할인) · 분류 ·
 * 사이즈(추가금) · 추가 옵션 · 상세 설명. 입력하는 대로 바로 바뀐다(저장 전 값).
 */
import { cx } from "@/apps/web-seller/common/ui/cx";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import {
  CAKE_SIZE_DISPLAY_NAME_OPTIONS,
  PRODUCT_CATEGORY_GROUPS,
} from "@/apps/web-seller/features/product/constants/product.constant";
import { EnableStatus } from "@/apps/web-seller/features/product/types/product.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import { formatWon } from "@/apps/web-seller/features/order/utils/order-mobile.util";
import {
  descriptionText,
  discountRate,
} from "@/apps/web-seller/features/product/utils/product-preview.util";

const CATEGORY_LABEL = new Map<string, string>(
  PRODUCT_CATEGORY_GROUPS.flatMap((g) =>
    g.options.map((o) => [o.value as string, o.label] as const),
  ),
);
const SIZE_LABEL = new Map<string, string>(
  CAKE_SIZE_DISPLAY_NAME_OPTIONS.map((o) => [o.value as string, o.label] as const),
);

export function ProductCustomerPreview({
  form,
  storeName,
}: {
  form: ProductForm;
  storeName: string;
}) {
  const photo = form.images?.[0];
  const sale = form.salePrice;
  const original = form.originalPrice;
  const rate = discountRate(original, sale);
  const sizes = (form.cakeSizeOptions ?? []).filter((s) => s.visible !== EnableStatus.DISABLE);
  const options = (form.customOptions ?? []).filter((o) => o.visible !== EnableStatus.DISABLE);
  const categories = (form.productCategoryTypes ?? [])
    .map((c) => CATEGORY_LABEL.get(c))
    .filter(Boolean);
  const text = descriptionText(form.detailDescription);
  const hidden = form.visibilityStatus === EnableStatus.DISABLE;
  const off = form.salesStatus === EnableStatus.DISABLE;

  return (
    <aside
      aria-label="손님 화면 미리보기"
      className="sticky top-[calc(var(--act-as-band,0px)+64px)] flex flex-col gap-2 self-start"
    >
      <p className="flex items-center gap-1.5 text-sub font-bold text-ink-700">
        손님 화면 미리보기
        {hidden ? <span className="font-normal text-ink-600">· 지금은 손님에게 숨김</span> : null}
      </p>
      <div className="overflow-hidden rounded-[24px] border border-ink-200 bg-white">
        <div className="flex aspect-square items-center justify-center bg-ink-50 text-ink-400">
          {photo ? (
            <img src={photo} alt="" className="size-full object-cover" />
          ) : (
            <Icon name="cake" size={40} strokeWidth={1.4} />
          )}
        </div>
        <div className="flex flex-col gap-1.5 px-4 pb-4 pt-3">
          {storeName ? <span className="text-caption text-ink-600">{storeName}</span> : null}
          <span
            className={cx(
              "text-group font-bold leading-snug [overflow-wrap:anywhere]",
              form.name?.trim() ? "text-ink-900" : "text-ink-400",
            )}
          >
            {form.name?.trim() || "상품 이름"}
          </span>
          <span className="flex flex-wrap items-baseline gap-x-1.5">
            {rate > 0 ? <b className="text-body text-brand">{rate}%</b> : null}
            <b className="text-heading tabular-nums text-ink-900">
              {sale ? formatWon(sale) : "가격"}
            </b>
            {rate > 0 && original ? (
              <s className="text-caption tabular-nums text-ink-500">{formatWon(original)}</s>
            ) : null}
          </span>
          {off ? (
            <span className="text-caption font-bold text-ink-600">지금은 판매중지</span>
          ) : null}
          {categories.length ? (
            <span className="mt-1 flex flex-wrap gap-1">
              {categories.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-ink-50 px-2 py-0.5 text-caption text-ink-700"
                >
                  {c}
                </span>
              ))}
            </span>
          ) : null}
        </div>
        {sizes.length ? (
          <div className="flex flex-col gap-1.5 border-t border-ink-100 px-4 py-3">
            <span className="text-caption font-bold text-ink-700">사이즈</span>
            <span className="flex flex-wrap gap-1.5">
              {sizes.map((s, i) => (
                <span
                  key={`${s.displayName}-${i}`}
                  className="rounded-control border border-ink-200 px-2.5 py-1 text-caption text-ink-900"
                >
                  {SIZE_LABEL.get(s.displayName) ?? s.displayName}
                  {s.price > 0 ? (
                    <span className="text-ink-600"> +{formatWon(s.price)}</span>
                  ) : null}
                </span>
              ))}
            </span>
          </div>
        ) : null}
        {options.length ? (
          <div className="flex flex-col gap-1 border-t border-ink-100 px-4 py-3">
            <span className="text-caption font-bold text-ink-700">옵션</span>
            {options.map((o, i) => (
              <span key={`${o.name}-${i}`} className="text-caption text-ink-900">
                {o.name || "옵션 이름"}
                {o.required ? <span className="text-brand-ink"> (필수)</span> : null}
              </span>
            ))}
          </div>
        ) : null}
        {text ? (
          <p className="line-clamp-6 whitespace-pre-line border-t border-ink-100 px-4 py-3 text-caption leading-relaxed text-ink-700">
            {text}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
