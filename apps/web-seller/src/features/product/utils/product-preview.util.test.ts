import { describe, expect, it } from "vitest";
import { EnableStatus } from "@/apps/web-seller/features/product/types/product.dto";
import {
  customerButtonLabel,
  descriptionText,
  discountRate,
  showsFromPrice,
} from "./product-preview.util";

describe("손님 화면 미리보기 계산", () => {
  it("할인율은 반올림한 %, 할인 아니면 0", () => {
    expect(discountRate(40000, 32000)).toBe(20);
    expect(discountRate(30000, 30000)).toBe(0);
    expect(discountRate(undefined, 30000)).toBe(0);
    expect(discountRate(30000, 35000)).toBe(0);
  });
  it("상세 설명 HTML은 글자만", () => {
    expect(descriptionText("<p>생크림이 <b>부드러워요</b></p>")).toContain("부드러워요");
    expect(descriptionText("<p>생크림이 <b>부드러워요</b></p>")).not.toContain("<");
    expect(descriptionText(undefined)).toBe("");
  });

  const ON = EnableStatus.ENABLE;
  const OFF = EnableStatus.DISABLE;
  it("가격 뒤 ~: 견적 받기는 늘, 아니면 보이는 추가금이 있을 때만(서버와 같은 규칙)", () => {
    expect(showsFromPrice({ orderMethod: "QUOTE" })).toBe(true);
    expect(showsFromPrice({ cakeSizeOptions: [{ visible: ON, price: 0 }] })).toBe(false);
    expect(showsFromPrice({ cakeSizeOptions: [{ visible: ON, price: 10000 }] })).toBe(true);
    // 숨긴 사이즈·숨긴 선택지의 추가금은 손님에게 안 보이니 세지 않는다
    expect(showsFromPrice({ cakeSizeOptions: [{ visible: OFF, price: 10000 }] })).toBe(false);
    expect(
      showsFromPrice({
        customOptions: [{ visible: ON, choices: [{ visible: OFF, price: 3000 }] }],
      }),
    ).toBe(false);
    expect(
      showsFromPrice({ customOptions: [{ visible: ON, choices: [{ visible: ON, price: 3000 }] }] }),
    ).toBe(true);
  });
  it("손님 화면 아래 버튼 글", () => {
    expect(customerButtonLabel({})).toBe("예약신청");
    expect(customerButtonLabel({ orderMethod: "QUOTE" })).toBe("이 디자인으로 견적 받기");
    expect(customerButtonLabel({ orderMethod: "QUOTE", salesStatus: OFF })).toBe(
      "판매중지된 상품이에요",
    );
  });
});
