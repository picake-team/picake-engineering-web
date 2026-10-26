import { describe, expect, it } from "vitest";

import {
  SalesStatus,
  VisibilityStatus,
  type Product,
} from "@/apps/web-user/features/product/types/product.type";
import type { StoreInfo } from "@/apps/web-user/features/store/types/store.type";

import { buildProductJsonLd, buildStoreJsonLd, serializeJsonLd } from "./json-ld.util";

const product = {
  id: "p1",
  name: "곰인형 케이크",
  images: ["https://static.example.com/uploads/a.jpg", "https://static.example.com/uploads/b.jpg"],
  salePrice: 35000,
  salesStatus: SalesStatus.ENABLE,
  visibilityStatus: VisibilityStatus.ENABLE,
  averageRating: 4.26,
  totalReviewCount: 3,
  detailDescription: "<p>포근한  케이크</p>",
  storeName: "달콤스토어",
} as Product;

const store = {
  id: "s1",
  name: "달콤스토어",
  logoImageUrl: "https://static.example.com/uploads/logo.jpg",
  description: "수제 케이크",
  roadAddress: "서울 서초구 서초대로 1",
  address: "서울 서초구 서초동 1",
  latitude: 37.48,
  longitude: 127.03,
  averageRating: 0,
  totalReviewCount: 0,
  productRepresentativeImages: [],
  // 구조화 데이터에 들어가면 안 되는 값
  businessNo: "000-00-00000",
  representativeName: "홍길동",
  phoneNumber: "010-0000-0000",
} as unknown as StoreInfo;

describe("buildProductJsonLd", () => {
  it("상품 정보와 가격·판매 상태를 담는다", () => {
    const data = buildProductJsonLd(product);

    expect(data).toMatchObject({
      "@type": "Product",
      name: "곰인형 케이크",
      url: "https://picakes.com/product/p1",
      description: "포근한 케이크",
      brand: { name: "달콤스토어" },
      offers: {
        price: 35000,
        priceCurrency: "KRW",
        availability: "https://schema.org/InStock",
        seller: { name: "달콤스토어" },
      },
    });
    expect(data?.image).toEqual(product.images);
  });

  it("후기가 있으면 평점을 소수 첫째 자리로 담는다", () => {
    expect(buildProductJsonLd(product)?.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.3,
      reviewCount: 3,
    });
  });

  it("후기가 없으면 평점을 넣지 않는다", () => {
    const data = buildProductJsonLd({ ...product, totalReviewCount: 0, averageRating: 0 });

    expect(data).not.toHaveProperty("aggregateRating", expect.anything());
    expect(JSON.stringify(data)).not.toContain("aggregateRating");
  });

  it("판매 중지 상품은 품절로 표시한다", () => {
    const data = buildProductJsonLd({ ...product, salesStatus: SalesStatus.DISABLE });

    expect(data?.offers).toMatchObject({ availability: "https://schema.org/OutOfStock" });
  });

  it("노출 중이 아닌 상품은 만들지 않는다", () => {
    expect(
      buildProductJsonLd({ ...product, visibilityStatus: VisibilityStatus.DISABLE }),
    ).toBeNull();
  });

  it("사진이 없으면 image 항목을 빼고, 설명이 없으면 기본 문장을 쓴다", () => {
    const data = buildProductJsonLd({ ...product, images: [], detailDescription: undefined });

    expect(JSON.stringify(data)).not.toContain('"image"');
    expect(data?.description).toBe("달콤스토어의 곰인형 케이크");
  });
});

describe("buildStoreJsonLd", () => {
  it("이름·주소·사진·위치를 담는다", () => {
    expect(buildStoreJsonLd(store)).toMatchObject({
      "@type": "Bakery",
      name: "달콤스토어",
      url: "https://picakes.com/store/s1",
      image: "https://static.example.com/uploads/logo.jpg",
      description: "수제 케이크",
      address: { streetAddress: "서울 서초구 서초대로 1", addressCountry: "KR" },
      geo: { latitude: 37.48, longitude: 127.03 },
    });
  });

  it("사업자 정보·연락처는 담지 않는다", () => {
    const json = JSON.stringify(buildStoreJsonLd(store));

    expect(json).not.toContain("000-00-00000");
    expect(json).not.toContain("홍길동");
    expect(json).not.toContain("010-0000-0000");
  });

  it("후기가 없으면 평점을 넣지 않는다", () => {
    expect(JSON.stringify(buildStoreJsonLd(store))).not.toContain("aggregateRating");
  });

  it("로고가 없으면 상품 대표 사진을 쓰고, 둘 다 없으면 image를 뺀다", () => {
    const withProductImage = buildStoreJsonLd({
      ...store,
      logoImageUrl: undefined,
      productRepresentativeImages: [
        { productId: "p1", imageUrl: "https://static.example.com/p.jpg" },
      ],
    });
    const withoutImage = buildStoreJsonLd({ ...store, logoImageUrl: undefined });

    expect(withProductImage.image).toBe("https://static.example.com/p.jpg");
    expect(JSON.stringify(withoutImage)).not.toContain('"image"');
  });
});

describe("serializeJsonLd", () => {
  it("값에 </script>가 들어 있어도 태그가 닫히지 않게 `<`를 이스케이프한다", () => {
    const json = serializeJsonLd({ name: "</script><script>alert(1)</script>" });

    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toEqual({ name: "</script><script>alert(1)</script>" });
  });

  it("undefined 값은 결과에서 제외한다", () => {
    expect(serializeJsonLd({ a: 1, b: undefined })).toBe('{"a":1}');
  });
});
