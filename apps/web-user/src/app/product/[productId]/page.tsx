import ProductDetailScreen from "@/apps/web-user/features/product/components/screens/ProductDetailScreen";
import { fetchProductForMetadata } from "@/apps/web-user/common/apis/metadata.api";

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

/**
 * 상품 상세. 미리보기(layout의 generateMetadata)와 같은 요청으로 상품을 서버에서 받아(중복 요청 없음)
 * 첫 HTML에 사진·이름·가격을 넣는다. 받지 못하면(3초 넘김·없음) 예전처럼 화면이 받는다.
 */
export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { productId } = await params;
  const result = await fetchProductForMetadata(productId);
  return (
    <ProductDetailScreen
      productId={productId}
      initialProduct={result.status === "ok" ? result.data : undefined}
    />
  );
}
