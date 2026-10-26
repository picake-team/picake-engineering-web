import type { Metadata } from "next";
import { Suspense } from "react";
import { JsonLd } from "@/apps/web-user/common/components/seo/JsonLd";
import { fetchProductForMetadata } from "@/apps/web-user/common/apis/metadata.api";
import { buildProductJsonLd } from "@/apps/web-user/common/utils/json-ld.util";
import {
  buildNotFoundMetadata,
  buildShareMetadata,
  formatKrwPrice,
  toMetaDescription,
} from "@/apps/web-user/common/utils/metadata.util";

interface ProductDetailLayoutProps {
  children: React.ReactNode;
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: ProductDetailLayoutProps): Promise<Metadata> {
  const { productId } = await params;
  const result = await fetchProductForMetadata(productId);

  if (result.status === "not_found") {
    return buildNotFoundMetadata("상품을 찾을 수 없어요");
  }

  // 시간 초과·서버 오류는 "없는 상품"이 아니므로 제목을 만들지 않고 루트 기본값을 쓴다
  if (result.status === "error") {
    return {};
  }

  const product = result.data;
  const pickupLocation = product.pickupRoadAddress || product.pickupAddress;
  const description = toMetaDescription(
    product.detailDescription,
    `${product.storeName} · ${formatKrwPrice(product.salePrice)} · ${pickupLocation} 픽업 가능`,
  );

  return buildShareMetadata({
    title: product.name,
    description,
    path: `/product/${productId}`,
    imageUrl: product.images[0] ?? product.storeLogoImageUrl,
  });
}

/** generateMetadata와 같은 fetch를 쓰므로 백엔드를 추가로 부르지 않는다 */
async function ProductJsonLd({ productId }: { productId: string }) {
  const result = await fetchProductForMetadata(productId);
  const data = result.status === "ok" ? buildProductJsonLd(result.data) : null;

  return data ? <JsonLd data={data} /> : null;
}

export default async function ProductDetailLayout({ children, params }: ProductDetailLayoutProps) {
  const { productId } = await params;

  return (
    <>
      {/* Suspense로 감싸 구조화 데이터를 기다리느라 화면(children)이 늦어지지 않게 한다 */}
      <Suspense fallback={null}>
        <ProductJsonLd productId={productId} />
      </Suspense>
      {children}
    </>
  );
}
