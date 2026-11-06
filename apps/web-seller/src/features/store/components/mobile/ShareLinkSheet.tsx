/**
 * 손님에게 링크 보내기 창 (SC-89, 디자인 A89). 손님 화면의 스토어·상품 주소를 복사하거나 휴대폰 공유 창으로 보낸다.
 * 앱 안 화면에서 공유 창은 앱 껍데기가 맡는다(앱 연결 PR). 지금은 휴대폰 브라우저 공유 창, 없으면 복사.
 */
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Button, ButtonPair, CircleIconButton } from "@/apps/web-seller/common/ui/Button";
import { Thumb } from "@/apps/web-seller/common/ui/Surface";
import { copyWithToast } from "@/apps/web-seller/common/utils/clipboard.util";
import {
  customerProductUrl,
  customerStoreUrl,
} from "@/apps/web-seller/common/constants/customer-web.constant";
import { useProductList } from "@/apps/web-seller/features/product/hooks/queries/useProductQuery";
import { flattenAndDeduplicateInfiniteData } from "@/apps/web-seller/common/utils/pagination.util";
import {
  EnableStatus,
  type ProductResponseDto,
} from "@/apps/web-seller/features/product/types/product.dto";

/** 휴대폰 공유 창(없거나 취소하면 복사로) */
export async function shareLink(title: string, url: string) {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url });
      return;
    } catch (e) {
      // 사용자가 공유 창을 닫은 경우는 그대로 끝
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
  }
  await copyWithToast(url, "주소를 복사했어요. 카톡·인스타에 붙여 넣어 보내 주세요");
}

function productState(p: ProductResponseDto): string | null {
  if (p.visibilityStatus === EnableStatus.DISABLE) return "숨김";
  if (p.salesStatus === EnableStatus.DISABLE) return "판매중지";
  return null;
}

export function ShareLinkSheet({
  open,
  onClose,
  storeId,
  storeName,
}: {
  open: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
}) {
  const products = useProductList({ storeId, limit: 50 });
  const list = flattenAndDeduplicateInfiniteData<ProductResponseDto>(products.data);
  const storeUrl = customerStoreUrl(storeId);
  return (
    <BottomSheet open={open} onClose={onClose} showClose title="손님에게 링크 보내기">
      <p className="-mt-2 text-sub leading-normal text-ink-600">
        손님에게 보내면 픽케이크에서 바로 예약할 수 있어요.
      </p>
      <div className="flex flex-col gap-2 rounded-card border border-ink-100 p-4">
        <p className="text-body font-bold text-ink-900">
          {/* 이름이 이미 "…스토어"면 한 번만 */}
          {storeName.endsWith("스토어") ? storeName : `${storeName} 스토어`}
        </p>
        <ButtonPair>
          <Button
            variant="secondary"
            onClick={() => void copyWithToast(storeUrl, "스토어 주소를 복사했어요")}
          >
            주소 복사
          </Button>
          <Button onClick={() => void shareLink(`${storeName} | 픽케이크`, storeUrl)}>
            공유하기
          </Button>
        </ButtonPair>
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center self-start px-0 text-sub font-bold text-brand-ink"
        >
          열어 보기
        </a>
      </div>
      {list.length > 0 ? (
        <>
          <p className="text-body font-bold text-ink-900">상품</p>
          <div className="-mt-2 flex flex-col">
            {list.map((p) => {
              const state = productState(p);
              return (
                <div key={p.id} className="flex items-center gap-3 border-b border-ink-100 py-3">
                  <Thumb size={44} src={p.images?.[0]} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-body font-semibold text-ink-900">{p.name}</span>
                    {state ? <span className="text-caption text-ink-600">{state}</span> : null}
                  </span>
                  <CircleIconButton
                    icon="share"
                    label={`${p.name} 링크 보내기`}
                    className="-my-1 -mr-1"
                    onClick={() =>
                      void shareLink(`${p.name} | ${storeName}`, customerProductUrl(p.id))
                    }
                  />
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </BottomSheet>
  );
}
