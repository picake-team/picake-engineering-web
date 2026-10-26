import type { Metadata } from "next";
import { Suspense } from "react";
import { JsonLd } from "@/apps/web-user/common/components/seo/JsonLd";
import { fetchStoreForMetadata } from "@/apps/web-user/common/apis/metadata.api";
import { buildStoreJsonLd } from "@/apps/web-user/common/utils/json-ld.util";
import {
  buildNotFoundMetadata,
  buildShareMetadata,
  formatKrwPrice,
  toMetaDescription,
} from "@/apps/web-user/common/utils/metadata.util";

interface StoreDetailLayoutProps {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}

export async function generateMetadata({ params }: StoreDetailLayoutProps): Promise<Metadata> {
  const { storeId } = await params;
  const result = await fetchStoreForMetadata(storeId);

  if (result.status === "not_found") {
    return buildNotFoundMetadata("스토어를 찾을 수 없어요");
  }

  // 시간 초과·서버 오류는 "없는 스토어"가 아니므로 제목을 만들지 않고 루트 기본값을 쓴다
  if (result.status === "error") {
    return {};
  }

  const store = result.data;
  const priceHint =
    store.minProductPrice != null ? ` · ${formatKrwPrice(store.minProductPrice)}~` : "";
  const location = store.roadAddress || store.address;
  const description = toMetaDescription(
    store.description,
    `${location}${priceHint} · Picake에서 케이크 예약`,
  );

  const imageUrl = store.logoImageUrl ?? store.productRepresentativeImages[0]?.imageUrl ?? null;

  return buildShareMetadata({
    title: store.name,
    description,
    path: `/store/${storeId}`,
    imageUrl,
  });
}

/** generateMetadata와 같은 fetch를 쓰므로 백엔드를 추가로 부르지 않는다 */
async function StoreJsonLd({ storeId }: { storeId: string }) {
  const result = await fetchStoreForMetadata(storeId);

  return result.status === "ok" ? <JsonLd data={buildStoreJsonLd(result.data)} /> : null;
}

export default async function StoreDetailLayout({ children, params }: StoreDetailLayoutProps) {
  const { storeId } = await params;

  return (
    <>
      {/* Suspense로 감싸 구조화 데이터를 기다리느라 화면(children)이 늦어지지 않게 한다 */}
      <Suspense fallback={null}>
        <StoreJsonLd storeId={storeId} />
      </Suspense>
      {children}
    </>
  );
}
