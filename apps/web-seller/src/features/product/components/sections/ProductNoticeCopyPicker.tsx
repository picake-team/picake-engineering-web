import React, { useMemo, useState } from "react";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { useProductList } from "@/apps/web-seller/features/product/hooks/queries/useProductQuery";
import {
  PRODUCT_NOTICE_FIELDS,
  hasAnyProductNotice,
  pickProductNotice,
  type ProductNoticeValues,
} from "@/apps/web-seller/features/product/utils/product-notice.util";

interface Props {
  storeId: string;
  /** 수정 중인 상품 (목록에서 뺀다) */
  excludeProductId?: string;
  /** 지금 폼에 고시 값이 있는지 (덮어쓰기 안내용) */
  hasCurrentValues: boolean;
  onCopy: (values: ProductNoticeValues, productName: string) => void;
  onClose: () => void;
}

/**
 * 같은 스토어의 다른 상품에서 상품정보제공고시 14개 항목을 복사한다 (I-43).
 * 값만 복사하므로 원본 상품을 나중에 고쳐도 이 상품은 바뀌지 않는다.
 */
export const ProductNoticeCopyPicker: React.FC<Props> = ({
  storeId,
  excludeProductId,
  hasCurrentValues,
  onCopy,
  onClose,
}) => {
  const { data, isLoading } = useProductList({ storeId, limit: 50 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const candidates = useMemo(
    () =>
      (data?.pages ?? [])
        .flatMap((page) => page.data)
        .filter((p) => p.id !== excludeProductId && hasAnyProductNotice(pickProductNotice(p))),
    [data, excludeProductId],
  );
  const selected = candidates.find((p) => p.id === selectedId) ?? null;
  const selectedValues = selected ? pickProductNotice(selected) : null;

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">어느 상품의 고시를 복사할까요?</p>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          닫기
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">상품을 불러오는 중…</p>}
      {!isLoading && candidates.length === 0 && (
        <p className="text-sm text-muted-foreground">
          고시를 입력해 둔 다른 상품이 없어요. 직접 입력해 주세요.
        </p>
      )}

      {candidates.length > 0 && (
        <ul className="max-h-48 overflow-y-auto divide-y rounded-md border">
          {candidates.map((product) => (
            <li key={product.id}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
                <input
                  type="radio"
                  name="product-notice-copy-source"
                  checked={selectedId === product.id}
                  onChange={() => setSelectedId(product.id)}
                />
                <span className="truncate">{product.name}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {selected && selectedValues && (
        <div className="space-y-3">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-md bg-muted p-3 text-sm md:grid-cols-2">
            {PRODUCT_NOTICE_FIELDS.map(({ key, label }) => (
              <div key={key} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="truncate">{selectedValues[key] || "-"}</dd>
              </div>
            ))}
          </dl>
          {hasCurrentValues && (
            <p className="text-xs text-amber-800">지금 입력한 고시 값은 복사한 값으로 바뀌어요.</p>
          )}
          <Button type="button" size="sm" onClick={() => onCopy(selectedValues, selected.name)}>
            이 상품의 고시 복사
          </Button>
        </div>
      )}
    </div>
  );
};
