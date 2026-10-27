import { describe, expect, it } from "vitest";

import {
  CustomOptionType,
  VisibleStatus,
  type CustomOption,
} from "@/apps/web-user/features/product/types/product.type";

import {
  calculateItemPrice,
  calculateOptionsPrice,
  findMissingRequiredOption,
  formatSelectedOptionValue,
  getVisibleCustomOptions,
  selectedOptionsToSelections,
  toOrderItemOptionInputs,
  toSelectedOptionPreviews,
} from "./custom-option.util";

const OPTIONS: CustomOption[] = [
  {
    id: "opt_candle",
    type: CustomOptionType.SINGLE_SELECT,
    name: "초 추가",
    required: false,
    visible: VisibleStatus.ENABLE,
    choices: [
      { id: "c_none", label: "없음", price: 0, visible: VisibleStatus.ENABLE },
      { id: "c_big", label: "큰초", price: 1000, visible: VisibleStatus.ENABLE },
    ],
  },
  {
    id: "opt_topping",
    type: CustomOptionType.MULTI_SELECT,
    name: "토핑",
    required: false,
    visible: VisibleStatus.ENABLE,
    maxSelect: 2,
    choices: [
      { id: "t_berry", label: "딸기", price: 2000, visible: VisibleStatus.ENABLE },
      { id: "t_blue", label: "블루베리", price: 2500, visible: VisibleStatus.ENABLE },
    ],
  },
  {
    id: "opt_lettering",
    type: CustomOptionType.TEXT,
    name: "레터링 문구",
    required: true,
    visible: VisibleStatus.ENABLE,
    maxLength: 10,
  },
  {
    id: "opt_image",
    type: CustomOptionType.IMAGE,
    name: "참고사진",
    required: false,
    visible: VisibleStatus.ENABLE,
    maxCount: 3,
  },
];

describe("calculateOptionsPrice / calculateItemPrice", () => {
  it("선택한 옵션값의 옵션가를 모두 더한다 (백엔드 itemPrice 계산과 같은 케이스)", () => {
    const optionsPrice = calculateOptionsPrice(OPTIONS, {
      opt_candle: { choiceIds: ["c_big"] },
      opt_topping: { choiceIds: ["t_blue", "t_berry"] },
      opt_lettering: { text: "축하해" },
    });
    expect(optionsPrice).toBe(5500);
    expect(
      calculateItemPrice({ basePrice: 30000, sizePrice: 5000, flavorPrice: 0, optionsPrice }),
    ).toBe(40500);
  });

  it("상품에 없는 옵션값은 금액에 넣지 않는다", () => {
    expect(calculateOptionsPrice(OPTIONS, { opt_candle: { choiceIds: ["c_gone"] } })).toBe(0);
  });
});

describe("findMissingRequiredOption", () => {
  it("공백만 입력한 필수 직접입력형은 빠진 것으로 본다", () => {
    expect(findMissingRequiredOption(OPTIONS, { opt_lettering: { text: "   " } })?.id).toBe(
      "opt_lettering",
    );
    expect(findMissingRequiredOption(OPTIONS, { opt_lettering: { text: "축하" } })).toBeUndefined();
  });
});

describe("toOrderItemOptionInputs", () => {
  it("비어 있는 선택값은 빼고, 문구는 앞뒤 공백을 지우고, 사진은 기존 URL 뒤에 새 URL을 붙인다", () => {
    const inputs = toOrderItemOptionInputs(
      OPTIONS,
      {
        opt_candle: { choiceIds: [] },
        opt_topping: { choiceIds: ["t_berry"] },
        opt_lettering: { text: "  축하해 " },
        opt_image: { imageUrls: ["https://cdn/old.png"] },
      },
      { opt_image: ["https://cdn/new.png"] },
    );
    expect(inputs).toEqual([
      { optionId: "opt_topping", choiceIds: ["t_berry"] },
      { optionId: "opt_lettering", text: "축하해" },
      { optionId: "opt_image", imageUrls: ["https://cdn/old.png", "https://cdn/new.png"] },
    ]);
  });
});

describe("toSelectedOptionPreviews / formatSelectedOptionValue", () => {
  it("주문 전 확인 화면에서도 주문 스냅샷과 같은 모양으로 보여준다", () => {
    const previews = toSelectedOptionPreviews(
      OPTIONS,
      {
        opt_candle: { choiceIds: ["c_big"] },
        opt_lettering: { text: "축하해" },
        opt_image: { imageFiles: [new File([""], "a.png")] },
      },
      { opt_image: ["blob:preview"] },
    );
    expect(previews.map((option) => [option.name, formatSelectedOptionValue(option)])).toEqual([
      ["초 추가", "큰초"],
      ["레터링 문구", "축하해"],
      ["참고사진", "사진 1장"],
    ]);
    expect(previews[0].price).toBe(1000);
  });
});

describe("selectedOptionsToSelections", () => {
  it("주문 스냅샷을 옵션 변경 화면의 초기 선택값으로 되돌린다", () => {
    expect(
      selectedOptionsToSelections([
        {
          optionId: "opt_candle",
          type: CustomOptionType.SINGLE_SELECT,
          name: "초 추가",
          choices: [{ id: "c_big", label: "큰초", price: 1000 }],
          price: 1000,
        },
        {
          optionId: "opt_image",
          type: CustomOptionType.IMAGE,
          name: "참고사진",
          imageUrls: ["https://cdn/a.png"],
          price: 0,
        },
      ]),
    ).toEqual({
      opt_candle: { choiceIds: ["c_big"] },
      opt_image: { imageUrls: ["https://cdn/a.png"] },
    });
  });
});

describe("getVisibleCustomOptions", () => {
  it("숨김 옵션과 숨김 옵션값을 뺀다", () => {
    const visible = getVisibleCustomOptions([
      { ...OPTIONS[0], choices: [{ ...OPTIONS[0].choices![0], visible: VisibleStatus.DISABLE }] },
      { ...OPTIONS[2], visible: VisibleStatus.DISABLE },
    ]);
    expect(visible).toHaveLength(1);
    expect(visible[0].choices).toEqual([]);
  });
});
