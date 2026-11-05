import { describe, expect, it } from "vitest";
import {
  CakeSizeDisplayName,
  CustomOptionType,
  EnableStatus,
} from "@/apps/web-seller/features/product/types/product.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import type {
  NaverProductDetailResponseDto,
  NaverProductOptionDto,
} from "@/apps/web-seller/features/product/types/product-naver.dto";
import {
  applyNaverImport,
  buildOptionSummary,
  buildTextRows,
  compareOption,
  defaultSelection,
  getSelectionProblems,
  hasNaverOnlyGuide,
  htmlToText,
  textToHtml,
  type NaverImportSelection,
} from "@/apps/web-seller/features/product/utils/naver-product.util";

// 네이버 예약 응답을 본뜬 예시 (실제 매장 데이터 아님)
const opt = (over: Partial<NaverProductOptionDto>): NaverProductOptionDto => ({
  optionId: "1",
  categoryName: null,
  name: "옵션",
  desc: null,
  price: 0,
  isSoldOut: false,
  role: "EXTRA",
  sizeDisplayName: null,
  lengthCm: null,
  selectedByDefault: true,
  invalidReason: null,
  imageUrl: null,
  groupName: "추가 선택",
  groupRequired: false,
  linkedProduct: null,
  ...over,
});

const detail = (
  options: NaverProductOptionDto[],
  over: Partial<NaverProductDetailResponseDto> = {},
): NaverProductDetailResponseDto => ({
  itemKey: "1001",
  source: "BOOKING",
  fetchedAt: "2026-11-05T00:00:00.000Z",
  name: "샘플 생크림 케이크",
  description: "제철 과일 케이크\n미니·1호·2호",
  precautions: "주의\n3일 전까지 취소",
  imageUrls: ["https://a.pstatic.net/1.jpg", "https://a.pstatic.net/2.jpg"],
  options,
  suggestedSalePrice: null,
  isClosed: false,
  soldOutOptionNames: [],
  menuLike: false,
  linkedProduct: null,
  warnings: [],
  ...over,
});

const emptyForm = (over: Partial<ProductForm> = {}): ProductForm =>
  ({
    images: [],
    name: "",
    originalPrice: undefined,
    salePrice: undefined,
    salesStatus: EnableStatus.ENABLE,
    visibilityStatus: EnableStatus.ENABLE,
    cakeSizeOptions: [
      {
        visible: EnableStatus.ENABLE,
        displayName: CakeSizeDisplayName.DOSIRAK,
        lengthCm: 0,
        price: 0,
        description: "1~2인용",
      },
    ],
    cakeFlavorOptions: [{ visible: EnableStatus.ENABLE, displayName: "초콜릿", price: 0 }],
    customOptions: [],
    detailDescription: "",
    ...over,
  }) as ProductForm;

const SIZES = [
  opt({
    optionId: "s2",
    name: "케이크 2호",
    price: 64000,
    role: "SIZE",
    sizeDisplayName: CakeSizeDisplayName.SIZE_2,
    lengthCm: 18,
  }),
  opt({
    optionId: "s0",
    name: "케이크 미니",
    price: 38000,
    role: "SIZE",
    sizeDisplayName: CakeSizeDisplayName.MINI,
    lengthCm: 12,
  }),
  opt({
    optionId: "s1",
    name: "케이크 1호",
    price: 54000,
    role: "SIZE",
    sizeDisplayName: CakeSizeDisplayName.SIZE_1,
    lengthCm: 15,
  }),
];

const selectAll = (d: NaverProductDetailResponseDto, form: ProductForm): NaverImportSelection => ({
  ...defaultSelection(d, form, "create"),
  optionIds: d.options.map((o) => o.optionId),
});

describe("textToHtml / htmlToText", () => {
  it("빈 줄은 문단, 줄바꿈은 <br>, 꺾쇠·따옴표는 바꿔서 넣는다", () => {
    expect(textToHtml('첫 줄\n둘째 줄\n\n<b>"굵게"</b>')).toBe(
      "<p>첫 줄<br>둘째 줄</p><p>&lt;b&gt;&quot;굵게&quot;&lt;/b&gt;</p>",
    );
  });

  it("상세정보 HTML을 비교용 글로 바꾼다", () => {
    expect(htmlToText("<p>첫 줄<br>둘째 &amp; 셋째</p>")).toBe("첫 줄 둘째 & 셋째");
  });

  it("네이버 예약에만 맞는 안내를 알아본다", () => {
    expect(hasNaverOnlyGuide("문의는 톡톡으로 주세요")).toBe(true);
    expect(hasNaverOnlyGuide("입금 후 예약확정됩니다")).toBe(true);
    expect(hasNaverOnlyGuide("생크림 케이크입니다")).toBe(false);
  });
});

describe("defaultSelection", () => {
  it("등록은 바뀐 이름·설명과 사진을 고르고, 주의사항은 고르지 않는다", () => {
    const d = detail(SIZES);
    const s = defaultSelection(d, emptyForm(), "create");
    expect(s.textKeys).toEqual(["name", "description"]);
    expect(s.imageIndexes).toEqual([0, 1]);
    expect(s.optionIds).toEqual(["s2", "s0", "s1"]);
  });

  it("다시 불러오기는 아무것도 고르지 않는다", () => {
    const s = defaultSelection(detail(SIZES), emptyForm(), "refresh");
    expect([...s.textKeys, ...s.imageIndexes, ...s.optionIds]).toEqual([]);
  });

  it("사진은 남은 칸(최대 8장)만큼만 고른다", () => {
    const form = emptyForm({ images: Array.from({ length: 7 }, (_, i) => `u${i}`) });
    expect(defaultSelection(detail(SIZES), form, "create").imageIndexes).toEqual([0]);
  });
});

describe("applyNaverImport (등록)", () => {
  it("가장 싼 사이즈가 판매가, 나머지는 차액, 작은 사이즈부터 정렬한다", () => {
    const d = detail(SIZES);
    const next = applyNaverImport(emptyForm(), d, selectAll(d, emptyForm()), "create", []);
    expect(next.salePrice).toBe(38000);
    expect(next.originalPrice).toBe(38000);
    expect(next.cakeSizeOptions.map((s) => [s.displayName, s.price, s.lengthCm])).toEqual([
      [CakeSizeDisplayName.MINI, 0, 12],
      [CakeSizeDisplayName.SIZE_1, 16000, 15],
      [CakeSizeDisplayName.SIZE_2, 26000, 18],
    ]);
    // 기본 폼의 '도시락' 자리 사이즈는 남기지 않고, 설명 칸은 빈 글자로 둔다
    expect(next.cakeSizeOptions.every((s) => s.description === "")).toBe(true);
  });

  it("이름·설명·사진을 채우고, 주의사항은 고르면 끝에 붙인다", () => {
    const d = detail([]);
    const sel = { ...selectAll(d, emptyForm()), textKeys: ["name", "description", "precautions"] };
    const next = applyNaverImport(emptyForm(), d, sel as NaverImportSelection, "create", [
      "https://cdn/1.jpg",
    ]);
    expect(next.name).toBe("샘플 생크림 케이크");
    expect(next.detailDescription).toBe(
      "<p>제철 과일 케이크<br>미니·1호·2호</p><p><strong>예약 전에 확인해 주세요</strong></p><p>주의<br>3일 전까지 취소</p>",
    );
    expect(next.images).toEqual(["https://cdn/1.jpg"]);
  });

  it("추가 옵션은 그룹별로, 필수 분류는 '하나 고르기(필수)'로 넣는다", () => {
    const d = detail([
      ...SIZES,
      opt({ optionId: "e1", name: "보냉백", price: 2000 }),
      opt({ optionId: "e2", name: "레드", price: 0, groupName: "포장 리본", groupRequired: true }),
      opt({
        optionId: "e3",
        name: "화이트",
        price: 0,
        groupName: "포장 리본",
        groupRequired: true,
      }),
    ]);
    const next = applyNaverImport(emptyForm(), d, selectAll(d, emptyForm()), "create", []);
    expect(
      next.customOptions.map((g) => [
        g.name,
        g.type,
        g.required,
        g.choices?.map((c) => `${c.label}:${c.price}`),
      ]),
    ).toEqual([
      ["추가 선택", CustomOptionType.MULTI_SELECT, false, ["보냉백:2000"]],
      ["포장 리본", CustomOptionType.SINGLE_SELECT, true, ["레드:0", "화이트:0"]],
    ]);
  });

  it("맛 옵션은 기본 맛 대신 네이버 맛으로 바꾼다", () => {
    const d = detail([
      ...SIZES,
      opt({ optionId: "f1", name: "초코", price: 0, role: "FLAVOR" }),
      opt({ optionId: "f2", name: "얼그레이", price: 2000, role: "FLAVOR" }),
    ]);
    const next = applyNaverImport(emptyForm(), d, selectAll(d, emptyForm()), "create", []);
    expect(next.cakeFlavorOptions.map((f) => [f.displayName, f.price])).toEqual([
      ["초코", 0],
      ["얼그레이", 2000],
    ]);
  });

  it("기본 가격 옵션은 판매가로 넣고 추가 옵션으로 더하지 않는다", () => {
    const d = detail([
      opt({ optionId: "b", name: "샘플 브라우니", price: 53000, role: "BASE" }),
      opt({ optionId: "e", name: "초 추가", price: 500 }),
    ]);
    const next = applyNaverImport(emptyForm(), d, selectAll(d, emptyForm()), "create", []);
    expect(next.salePrice).toBe(53000);
    expect(next.originalPrice).toBe(53000);
    expect(next.customOptions.flatMap((g) => g.choices ?? []).map((c) => c.label)).toEqual([
      "초 추가",
    ]);
  });

  it("옵션이 없으면(메뉴) 판매가 후보만 채운다", () => {
    const d = detail([], { source: "MENU", suggestedSalePrice: 30000 });
    const next = applyNaverImport(emptyForm(), d, selectAll(d, emptyForm()), "create", []);
    expect(next.salePrice).toBe(30000);
    expect(next.cakeSizeOptions[0].displayName).toBe(CakeSizeDisplayName.DOSIRAK);
  });

  it("할인 중인 정가는 판매가보다 크면 그대로 둔다", () => {
    const form = emptyForm({ originalPrice: 50000, salePrice: 45000 });
    const d = detail(SIZES);
    const next = applyNaverImport(form, d, selectAll(d, form), "create", []);
    expect(next.salePrice).toBe(38000);
    expect(next.originalPrice).toBe(50000);
  });
});

describe("applyNaverImport (다시 불러오기)", () => {
  const existing = emptyForm({
    salePrice: 38000,
    originalPrice: 38000,
    cakeSizeOptions: [
      {
        id: "size_mini",
        visible: EnableStatus.ENABLE,
        displayName: CakeSizeDisplayName.MINI,
        lengthCm: 12,
        price: 0,
      },
      {
        id: "size_1",
        visible: EnableStatus.ENABLE,
        displayName: CakeSizeDisplayName.SIZE_1,
        lengthCm: 15,
        price: 10000,
      },
      {
        id: "size_3",
        visible: EnableStatus.ENABLE,
        displayName: CakeSizeDisplayName.SIZE_3,
        lengthCm: 21,
        price: 40000,
      },
    ],
    cakeFlavorOptions: [
      { id: "flavor_choco", visible: EnableStatus.ENABLE, displayName: "초코", price: 0 },
    ],
    customOptions: [
      {
        id: "opt_1",
        type: CustomOptionType.MULTI_SELECT,
        name: "추가 선택",
        required: false,
        visible: EnableStatus.ENABLE,
        choices: [{ id: "c1", label: "보냉백", price: 1000, visible: EnableStatus.ENABLE }],
      },
    ],
  });

  it("고른 사이즈만 가격을 바꾸고, 네이버에 없는 사이즈와 옵션 ID는 그대로 둔다", () => {
    const d = detail(SIZES);
    const sel = { ...defaultSelection(d, existing, "refresh"), optionIds: ["s1"] };
    const next = applyNaverImport(existing, d, sel, "refresh", []);
    expect(next.salePrice).toBe(38000);
    expect(next.cakeSizeOptions.map((s) => [s.id, s.displayName, s.price])).toEqual([
      ["size_mini", CakeSizeDisplayName.MINI, 0],
      ["size_1", CakeSizeDisplayName.SIZE_1, 16000],
      ["size_3", CakeSizeDisplayName.SIZE_3, 40000],
    ]);
  });

  it("더 싼 사이즈가 생기면 판매가를 낮추고 다른 사이즈의 손님 금액은 유지한다", () => {
    const d = detail([
      opt({
        optionId: "d",
        name: "도시락",
        price: 25000,
        role: "SIZE",
        sizeDisplayName: CakeSizeDisplayName.DOSIRAK,
        lengthCm: 10,
      }),
    ]);
    const sel = { ...defaultSelection(d, existing, "refresh"), optionIds: ["d"] };
    const next = applyNaverImport(existing, d, sel, "refresh", []);
    expect(next.salePrice).toBe(25000);
    const total = (name: CakeSizeDisplayName) =>
      (next.salePrice ?? 0) +
      (next.cakeSizeOptions.find((s) => s.displayName === name)?.price ?? 0);
    expect(total(CakeSizeDisplayName.DOSIRAK)).toBe(25000);
    expect(total(CakeSizeDisplayName.MINI)).toBe(38000);
    expect(total(CakeSizeDisplayName.SIZE_1)).toBe(48000);
  });

  it("맛·추가 옵션은 같은 이름이면 가격만 바꾸고 없으면 더한다", () => {
    const d = detail([
      opt({ optionId: "f", name: "초코", price: 1000, role: "FLAVOR" }),
      opt({ optionId: "f2", name: "바닐라", price: 0, role: "FLAVOR" }),
      opt({ optionId: "e", name: "보냉백", price: 2000 }),
    ]);
    const sel = { ...defaultSelection(d, existing, "refresh"), optionIds: ["f", "f2", "e"] };
    const next = applyNaverImport(existing, d, sel, "refresh", []);
    expect(next.cakeFlavorOptions.map((f) => [f.id, f.displayName, f.price])).toEqual([
      ["flavor_choco", "초코", 1000],
      [undefined, "바닐라", 0],
    ]);
    expect(next.customOptions[0].choices).toEqual([
      { id: "c1", label: "보냉백", price: 2000, visible: EnableStatus.ENABLE },
    ]);
  });
});

describe("getSelectionProblems", () => {
  it("사이즈 표시명이 없거나 겹치면 알려 준다", () => {
    const d = detail([
      opt({ optionId: "a", name: "S", price: 30000, role: "SIZE" }),
      opt({
        optionId: "b",
        name: "1호",
        price: 40000,
        role: "SIZE",
        sizeDisplayName: CakeSizeDisplayName.SIZE_1,
      }),
      opt({
        optionId: "c",
        name: "1호 초코",
        price: 40000,
        role: "SIZE",
        sizeDisplayName: CakeSizeDisplayName.SIZE_1,
      }),
    ]);
    const problems = getSelectionProblems(d, selectAll(d, emptyForm()));
    expect(problems.some((p) => p.includes("'S'의 사이즈"))).toBe(true);
    expect(problems.some((p) => p.includes("두 번"))).toBe(true);
  });

  it("기본 가격과 사이즈를 함께 고르면 알려 준다", () => {
    const d = detail([
      opt({ optionId: "b", name: "기본", price: 30000, role: "BASE" }),
      opt({
        optionId: "s",
        name: "1호",
        price: 40000,
        role: "SIZE",
        sizeDisplayName: CakeSizeDisplayName.SIZE_1,
      }),
    ]);
    expect(getSelectionProblems(d, selectAll(d, emptyForm())).join()).toContain(
      "함께 고를 수 없어요",
    );
  });

  it("문제가 없으면 빈 목록", () => {
    const d = detail(SIZES);
    expect(getSelectionProblems(d, selectAll(d, emptyForm()))).toEqual([]);
  });
});

describe("compareOption / buildTextRows / buildOptionSummary", () => {
  const form = emptyForm({
    name: "샘플 생크림 케이크",
    salePrice: 38000,
    cakeSizeOptions: [
      {
        visible: EnableStatus.ENABLE,
        displayName: CakeSizeDisplayName.MINI,
        lengthCm: 12,
        price: 0,
      },
      {
        visible: EnableStatus.ENABLE,
        displayName: CakeSizeDisplayName.SIZE_1,
        lengthCm: 15,
        price: 10000,
      },
    ],
  });

  it("사이즈는 판매가 + 추가금을 네이버 가격과 비교한다", () => {
    const [s2, mini, s1] = SIZES;
    expect(compareOption(mini, undefined, form)).toEqual({ current: 38000, status: "same" });
    expect(compareOption(s1, undefined, form)).toEqual({ current: 48000, status: "changed" });
    expect(compareOption(s2, undefined, form)).toEqual({ current: null, status: "new" });
  });

  it("기본 가격은 판매가와, 맛은 맛 가격과 비교한다", () => {
    expect(compareOption(opt({ role: "BASE", price: 38000 }), undefined, form)?.status).toBe(
      "same",
    );
    expect(
      compareOption(opt({ role: "FLAVOR", name: "초콜릿", price: 0 }), undefined, form)?.status,
    ).toBe("same");
  });

  it("이름이 같으면 '지금 값과 같음', 주의사항이 이미 들어 있으면 같음으로 본다", () => {
    const rows = buildTextRows(detail([]), {
      ...form,
      detailDescription: "<p>주의<br>3일 전까지 취소</p>",
    });
    expect(rows.map((r) => [r.key, r.status])).toEqual([
      ["name", "same"],
      ["description", "changed"],
      ["precautions", "same"],
    ]);
  });

  it("AI 초안에 넘길 옵션 요약", () => {
    expect(buildOptionSummary(form)).toBe(
      "사이즈: 미니(12cm) 38,000원 / 1호(15cm) 48,000원\n맛: 초콜릿",
    );
  });
});
