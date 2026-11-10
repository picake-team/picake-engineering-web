import { describe, expect, it } from "vitest";
import {
  CakeSizeDisplayName,
  EnableStatus,
  ProductType,
} from "@/apps/web-seller/features/product/types/product.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import {
  PRODUCT_NOTICE_FIELDS,
  REQUIRED_PRODUCT_NOTICE_KEYS,
} from "@/apps/web-seller/features/product/utils/product-notice.util";
import { validateProductForm } from "@/apps/web-seller/features/product/utils/validateProductForm";

const size = (displayName: CakeSizeDisplayName, price = 0) => ({
  visible: EnableStatus.ENABLE,
  displayName,
  lengthCm: 15,
  price,
  description: "",
});

const validForm = (patch: Partial<ProductForm> = {}): ProductForm =>
  ({
    images: ["https://example.com/a.jpg"],
    name: "무화과 생크림 케이크",
    originalPrice: 38000,
    salePrice: 38000,
    salesStatus: EnableStatus.ENABLE,
    visibilityStatus: EnableStatus.ENABLE,
    productType: ProductType.BASIC_CAKE,
    cakeSizeOptions: [size(CakeSizeDisplayName.MINI), size(CakeSizeDisplayName.SIZE_1, 16000)],
    customOptions: [],
    productCategoryTypes: [],
    searchTags: [],
    detailDescription: "<p>설명</p>",
    ...Object.fromEntries(PRODUCT_NOTICE_FIELDS.map(({ key }) => [key, "값"])),
    ...patch,
  }) as ProductForm;

describe("validateProductForm", () => {
  it("맛 없이(사이즈만으로) 등록할 수 있다", () => {
    expect(validateProductForm(validForm())).toEqual({});
  });

  it("같은 사이즈를 두 번 넣으면 막는다", () => {
    const errors = validateProductForm(
      validForm({
        cakeSizeOptions: [size(CakeSizeDisplayName.SIZE_1), size(CakeSizeDisplayName.SIZE_1, 5000)],
      }),
    );
    expect(errors.cakeSizeOptions).toContain("같은 사이즈(1호)");
  });

  it("파는 사이즈는 지름을 넣어야 한다(손님 화면에 0cm로 보이지 않게)", () => {
    const errors = validateProductForm(
      validForm({
        cakeSizeOptions: [{ ...size(CakeSizeDisplayName.DOSIRAK), lengthCm: 0 }],
      }),
    );
    expect(errors.cakeSizeOptions).toContain("도시락 사이즈의 지름");
  });

  it("고시는 원산지만 채워도 등록할 수 있다 (법 검토로 원산지만 필수)", () => {
    const onlyOrigin = validForm({
      ...Object.fromEntries(PRODUCT_NOTICE_FIELDS.map(({ key }) => [key, ""])),
      productNoticeOrigin: "밀가루(미국산), 생크림(국산)",
    });
    expect(validateProductForm(onlyOrigin)).toEqual({});
  });

  it("원산지가 비어 있으면 막는다", () => {
    const errors = validateProductForm(validForm({ productNoticeOrigin: " " }));
    expect(errors.productNoticeOrigin).toBe("원산지를 입력해 주세요.");
    expect(REQUIRED_PRODUCT_NOTICE_KEYS).toEqual(["productNoticeOrigin"]);
  });

  it("노출 중인 사이즈는 여전히 1개 이상 필요하다", () => {
    const errors = validateProductForm(validForm({ cakeSizeOptions: [] }));
    expect(errors.cakeSizeOptions).toBeTruthy();
  });
});
