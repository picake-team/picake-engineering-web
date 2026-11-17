import { toAbsoluteUrl, toMetaDescription } from "@/apps/web-user/common/utils/metadata.util";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import {
  SITE_BASE_URL,
  SITE_NAME,
  SITE_NAME_EN,
} from "@/apps/web-user/common/constants/site.constants";
import {
  SalesStatus,
  VisibilityStatus,
  type Product,
} from "@/apps/web-user/features/product/types/product.type";
import type { StoreInfo } from "@/apps/web-user/features/store/types/store.type";

type JsonLd = Record<string, unknown>;

/**
 * <script type="application/ld+json">에 넣을 문자열.
 * 상품명·설명은 판매자가 입력한 값이라 "</script>" 같은 문자열이 들어 있어도
 * 태그가 닫히지 않도록 `<`를 이스케이프한다.
 */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function toRating(averageRating: number, reviewCount: number): JsonLd | undefined {
  if (!(reviewCount > 0) || !Number.isFinite(averageRating)) return undefined;

  return {
    "@type": "AggregateRating",
    ratingValue: Math.round(averageRating * 10) / 10,
    reviewCount,
  };
}

/**
 * 상품 상세 구조화 데이터(schema.org Product).
 * 노출 중이 아닌 상품은 만들지 않는다. 가격은 화면의 "~원~"과 같은 기본 판매가다.
 */
export function buildProductJsonLd(product: Product): JsonLd | null {
  if (product.visibilityStatus !== VisibilityStatus.ENABLE) return null;

  const url = toAbsoluteUrl(PATHS.PRODUCT.DETAIL(product.id));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url,
    image: product.images.length > 0 ? product.images.map(toAbsoluteUrl) : undefined,
    description: toMetaDescription(
      product.detailDescription,
      `${product.storeName}의 ${product.name}`,
    ),
    brand: { "@type": "Brand", name: product.storeName },
    offers: {
      "@type": "Offer",
      url,
      price: product.salePrice,
      priceCurrency: "KRW",
      availability:
        product.salesStatus === SalesStatus.ENABLE
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: product.storeName },
    },
    aggregateRating: toRating(product.averageRating, product.totalReviewCount),
  };
}

/**
 * 스토어 상세 구조화 데이터(schema.org Bakery).
 * 공개 화면에 이미 보이는 정보(이름·주소·사진·평점)만 쓰고 연락처·사업자 정보는 넣지 않는다.
 */
export function buildStoreJsonLd(store: StoreInfo): JsonLd {
  const image = store.logoImageUrl ?? store.productRepresentativeImages[0]?.imageUrl;
  const hasLocation = Number.isFinite(store.latitude) && Number.isFinite(store.longitude);
  const description = store.description ? toMetaDescription(store.description, "") : "";

  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: store.name,
    url: toAbsoluteUrl(PATHS.STORE.DETAIL(store.id)),
    image: image ? toAbsoluteUrl(image) : undefined,
    description: description || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: store.roadAddress || store.address,
      addressCountry: "KR",
    },
    geo: hasLocation
      ? { "@type": "GeoCoordinates", latitude: store.latitude, longitude: store.longitude }
      : undefined,
    aggregateRating: toRating(store.averageRating, store.totalReviewCount),
  };
}

/**
 * 홈 구조화 데이터(schema.org WebSite). 구글이 검색 결과 위에 보여 주는 사이트 이름을 정할 때 읽는다.
 * 사람들이 검색하는 한글 이름을 name에, 영문 이름을 alternateName에 둔다.
 */
export function buildWebSiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: [SITE_NAME_EN],
    url: SITE_BASE_URL,
    inLanguage: "ko-KR",
  };
}
