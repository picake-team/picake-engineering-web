/**
 * 손님에게 링크 보내기 창 (SC-89, 디자인 A89). 손님 화면의 스토어·상품 주소를 복사하거나 휴대폰 공유 창으로 보낸다.
 * 공유 창은 앱이면 앱 껍데기(shareLink), 휴대폰 브라우저면 브라우저 공유 창, 둘 다 없으면 복사.
 * 손님 화면을 "열어 보기"하는 링크는 두지 않는다(운영자 결정).
 * 링크 효과(기획 I-45): 스토어 칸 아래에 최근 30일 이 링크로 온 손님 수와 예약 신청 수를 보인다.
 */
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Button, ButtonPair, CircleIconButton } from "@/apps/web-seller/common/ui/Button";
import { Thumb } from "@/apps/web-seller/common/ui/Surface";
import { copyWithToast } from "@/apps/web-seller/common/utils/clipboard.util";
import { shareViaDevice } from "@/apps/web-seller/common/utils/webview.bridge";
import {
  customerProductUrl,
  customerStoreUrl,
} from "@/apps/web-seller/common/constants/customer-web.constant";
import { useProductList } from "@/apps/web-seller/features/product/hooks/queries/useProductQuery";
import { useStoreLinkStats } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import { flattenAndDeduplicateInfiniteData } from "@/apps/web-seller/common/utils/pagination.util";
import {
  EnableStatus,
  type ProductResponseDto,
} from "@/apps/web-seller/features/product/types/product.dto";

/** 휴대폰 공유 창(앱 → 휴대폰 브라우저), 둘 다 안 되면 복사 */
export async function shareLink(title: string, url: string) {
  if (await shareViaDevice(title, url)) return;
  await copyWithToast(url, "링크를 복사했어요. 카톡·인스타에 붙여 넣어 보내 주세요");
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
  const linkStats = useStoreLinkStats(open ? storeId : "");
  const stats = linkStats.data;
  const noVisitsYet = stats ? stats.visitorCount === 0 && stats.reservationCount === 0 : false;
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
            onClick={() => void copyWithToast(storeUrl, "스토어 링크를 복사했어요")}
          >
            링크 복사
          </Button>
          <Button onClick={() => void shareLink(`${storeName} | 픽케이크`, storeUrl)}>
            공유하기
          </Button>
        </ButtonPair>
        <div className="-mx-4 -mb-4 mt-1 grid grid-cols-2 border-t border-ink-100">
          {[
            {
              label: "링크로 온 손님",
              value: stats ? `${stats.visitorCount.toLocaleString("ko-KR")}명` : "–",
            },
            {
              label: "예약 신청",
              value: stats ? `${stats.reservationCount.toLocaleString("ko-KR")}건` : "–",
            },
          ].map((s, i) => (
            <span
              key={s.label}
              className={`flex flex-col items-center gap-1 py-3 ${i > 0 ? "border-l border-ink-100" : ""}`}
            >
              <span className="text-heading font-bold tabular-nums text-ink-900">{s.value}</span>
              <span className="text-caption text-ink-600">{s.label}</span>
            </span>
          ))}
        </div>
      </div>
      <p className="-mt-2 text-caption leading-normal text-ink-600">
        {noVisitsYet
          ? "아직 링크로 온 손님이 없어요. 카카오톡 채널 자동응답이나 인스타 프로필에 걸어 두세요."
          : "최근 30일, 이 창에서 보낸 스토어·상품 링크로 들어온 숫자예요."}
      </p>
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
