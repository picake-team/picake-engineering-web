import { describe, expect, it } from "vitest";
import {
  CakeSizeDisplayName,
  EnableStatus,
  ProductType,
} from "@/apps/web-seller/features/product/types/product.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import { PRODUCT_NOTICE_FIELDS } from "@/apps/web-seller/features/product/utils/product-notice.util";
import { validateProductForm } from "@/apps/web-seller/features/product/utils/validateProductForm";

const size = (displayName: CakeSizeDisplayName, price = 0) => ({
  visible: EnableStatus.ENABLE,
  displayName,
  lengthCm: 0,
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
    cakeFlavorOptions: [],
    customOptions: [],
    productCategoryTypes: [],
    searchTags: [],
    detailDescription: "<p>설명</p>",
    ...Object.fromEntries(PRODUCT_NOTICE_FIELDS.map(({ key }) => [key, "값"])),
    ...patch,
  }) as ProductForm;

describe("validateProductForm", () => {
  it("맛이 없어도 등록할 수 있다 (맛은 선택)", () => {
    expect(validateProductForm(validForm())).toEqual({});
  });

  it("맛을 넣었으면 이름이 비어 있으면 안 된다", () => {
    const errors = validateProductForm(
      validForm({
        cakeFlavorOptions: [{ visible: EnableStatus.ENABLE, displayName: " ", price: 0 }],
      }),
    );
    expect(errors.cakeFlavorOptions).toContain("이름이 비어 있는 맛");
  });

  it("같은 맛을 두 번 넣으면 막는다", () => {
    const flavor = { visible: EnableStatus.ENABLE, displayName: "초코", price: 0 };
    const errors = validateProductForm(validForm({ cakeFlavorOptions: [flavor, { ...flavor }] }));
    expect(errors.cakeFlavorOptions).toContain("같은 맛(초코)");
  });

  it("같은 사이즈를 두 번 넣으면 막는다", () => {
    const errors = validateProductForm(
      validForm({
        cakeSizeOptions: [size(CakeSizeDisplayName.SIZE_1), size(CakeSizeDisplayName.SIZE_1, 5000)],
      }),
    );
    expect(errors.cakeSizeOptions).toContain("같은 사이즈(1호)");
  });

  it("노출 중인 사이즈는 여전히 1개 이상 필요하다", () => {
    const errors = validateProductForm(validForm({ cakeSizeOptions: [] }));
    expect(errors.cakeSizeOptions).toBeTruthy();
  });
});
