import {
  CakeSizeDisplayName,
  CustomOptionType,
  EnableStatus,
  type CakeSizeOptionDto,
  type CustomOptionDto,
} from "@/apps/web-seller/features/product/types/product.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import type {
  NaverProductDetailResponseDto,
  NaverProductOptionDto,
} from "@/apps/web-seller/features/product/types/product-naver.dto";

/** 상품 사진 최대 수 (대표 1 + 추가 7) */
export const PRODUCT_MAX_IMAGES = 8;
/** 추가 옵션 이름 최대 글자 수 */
const CUSTOM_OPTION_NAME_MAX = 20;
/** 네이버 추가 옵션을 넣을 그룹 기본 이름 */
export const NAVER_EXTRA_GROUP_NAME = "추가 선택";

export type ImportMode = "create" | "refresh";

/** 네이버 옵션 1개를 어떻게 넣을지 (판매자가 바꿀 수 있음) */
export type OptionChoice = {
  optionId: string;
  use: "SIZE" | "EXTRA" | "SKIP";
  sizeDisplayName: CakeSizeDisplayName | null;
  lengthCm: number | null;
};

export type TextRowKey = "name" | "description" | "precautions";

export type TextRow = {
  key: TextRowKey;
  label: string;
  naverValue: string | null;
  currentValue: string | null;
  status: "changed" | "same" | "missing";
};

/** 화면에서 고른 것 */
export type NaverImportSelection = {
  textKeys: TextRowKey[];
  imageIndexes: number[];
  optionChoices: OptionChoice[];
  /** 고른 옵션 ID */
  optionIds: string[];
};

const normalize = (text: string | null | undefined) => (text ?? "").replace(/\s+/g, " ").trim();

/** HTML 태그를 지운 글 (지금 상세설명과 비교용) */
export const htmlToText = (html: string | null | undefined) =>
  normalize(
    (html ?? "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " "),
  )
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** 줄바꿈이 있는 글을 상세설명(HTML) 문단으로 바꾼다. 빈 줄은 문단, 한 줄 바꿈은 <br> */
export const textToHtml = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.split("\n").map(escapeHtml).join("<br>")}</p>`)
    .join("");

/** 네이버 예약에만 맞는 안내가 들어 있는지 (톡톡·네이버 리뷰·네이버 예약 확정 등) */
export const hasNaverOnlyGuide = (text: string | null) =>
  !!text && /(톡톡|네이버\s*(영수증|리뷰|예약)|예약\s*확정|입금\s*후)/.test(text);

const textStatus = (naver: string | null, current: string | null): TextRow["status"] => {
  if (!normalize(naver)) return "missing";
  return normalize(naver) === normalize(current) ? "same" : "changed";
};

/** 이름·설명·주의사항 비교 줄 */
export function buildTextRows(detail: NaverProductDetailResponseDto, form: ProductForm): TextRow[] {
  const currentText = htmlToText(form.detailDescription);
  return [
    {
      key: "name",
      label: "상품명",
      naverValue: detail.name,
      currentValue: form.name || null,
      status: textStatus(detail.name, form.name),
    },
    {
      key: "description",
      label: "상세정보 (네이버 설명)",
      naverValue: detail.description,
      currentValue: currentText || null,
      status: textStatus(detail.description, currentText),
    },
    {
      key: "precautions",
      label: "상세정보 끝에 붙일 예약 안내 (네이버 주의사항)",
      naverValue: detail.precautions,
      currentValue: null,
      status: !normalize(detail.precautions)
        ? "missing"
        : currentText.includes(normalize(detail.precautions))
          ? "same"
          : "changed",
    },
  ];
}

/** 처음에 고를 것: 등록은 바뀐 것 전부, 다시 불러오기는 아무것도 고르지 않는다 */
export function defaultSelection(
  detail: NaverProductDetailResponseDto,
  form: ProductForm,
  mode: ImportMode,
): NaverImportSelection {
  const optionChoices: OptionChoice[] = detail.options.map((o) => ({
    optionId: o.optionId,
    use: o.role,
    sizeDisplayName: o.sizeDisplayName,
    lengthCm: o.lengthCm,
  }));
  if (mode === "refresh") {
    return { textKeys: [], imageIndexes: [], optionChoices, optionIds: [] };
  }
  const textKeys = buildTextRows(detail, form)
    .filter((r) => r.status === "changed" && r.key !== "precautions")
    .map((r) => r.key);
  const room = Math.max(0, PRODUCT_MAX_IMAGES - (form.images?.length ?? 0));
  return {
    textKeys,
    imageIndexes: detail.imageUrls.map((_, i) => i).slice(0, room),
    optionChoices,
    optionIds: detail.options.filter((o) => o.selectedByDefault).map((o) => o.optionId),
  };
}

/** 고른 옵션 중 그대로 넣을 수 없는 이유 (화면에 보여 주고 채우기를 막는다) */
export function getSelectionProblems(
  detail: NaverProductDetailResponseDto,
  selection: NaverImportSelection,
): string[] {
  const problems: string[] = [];
  const picked = pickedOptions(detail, selection);
  const sizes = picked.filter(({ choice }) => choice.use === "SIZE");
  const names = new Set<string>();
  for (const { option, choice } of sizes) {
    if (!choice.sizeDisplayName)
      problems.push(`'${option.name}'의 사이즈(도시락·미니·1~3호)를 골라 주세요.`);
    else if (names.has(choice.sizeDisplayName))
      problems.push(`'${choice.sizeDisplayName}' 사이즈를 두 번 골랐어요. 하나만 남겨 주세요.`);
    else names.add(choice.sizeDisplayName);
    if (!option.price || option.price <= 0)
      problems.push(`'${option.name}'은 네이버 가격이 없어요.`);
  }
  for (const { option, choice } of picked) {
    if (choice.use === "EXTRA" && option.name.length > 30) {
      problems.push(`'${option.name.slice(0, 15)}…'은 선택지 이름이 30자를 넘어요.`);
    }
  }
  return problems;
}

function pickedOptions(detail: NaverProductDetailResponseDto, selection: NaverImportSelection) {
  return detail.options
    .filter((o) => selection.optionIds.includes(o.optionId))
    .map((option) => ({
      option,
      choice:
        selection.optionChoices.find((c) => c.optionId === option.optionId) ??
        ({
          optionId: option.optionId,
          use: option.role,
          sizeDisplayName: option.sizeDisplayName,
          lengthCm: option.lengthCm,
        } as OptionChoice),
    }))
    .filter(({ choice }) => choice.use !== "SKIP");
}

/**
 * 고른 네이버 값을 상품 폼에 넣는다.
 * - 사이즈 가격: Picake는 판매가 + 사이즈 추가금이라, 가장 싼 사이즈를 판매가로 두고 나머지는 차액으로 넣는다.
 * - 등록: 사이즈를 네이버 것으로 바꾼다. 다시 불러오기: 같은 사이즈는 가격만 바꾸고 없는 사이즈는 더한다(지우지 않음).
 * - 추가 옵션: '추가 선택' 그룹(또는 네이버 분류 이름)의 선택지로 넣는다. 같은 이름 선택지는 가격만 바꾼다.
 * - 사진: Picake에 올린 주소(uploadedImageUrls)를 뒤에 붙인다. 대표 사진이 없으면 첫 장이 대표가 된다.
 */
export function applyNaverImport(
  form: ProductForm,
  detail: NaverProductDetailResponseDto,
  selection: NaverImportSelection,
  mode: ImportMode,
  uploadedImageUrls: string[],
): ProductForm {
  const next: ProductForm = { ...form };

  if (selection.textKeys.includes("name")) next.name = detail.name;

  let description = next.detailDescription ?? "";
  if (selection.textKeys.includes("description") && detail.description) {
    description = textToHtml(detail.description);
  }
  if (selection.textKeys.includes("precautions") && detail.precautions) {
    description += `<p><strong>예약 전에 확인해 주세요</strong></p>${textToHtml(detail.precautions)}`;
  }
  next.detailDescription = description;

  if (uploadedImageUrls.length > 0) {
    next.images = [...(form.images ?? []), ...uploadedImageUrls].slice(0, PRODUCT_MAX_IMAGES);
  }

  const picked = pickedOptions(detail, selection);
  const sizes = picked.filter(({ choice }) => choice.use === "SIZE" && choice.sizeDisplayName);
  const extras = picked.filter(({ choice }) => choice.use === "EXTRA");

  if (sizes.length > 0) {
    // 사이즈별 "손님이 내는 금액" 표를 만든다
    const totals = new Map<
      CakeSizeDisplayName,
      { base?: CakeSizeOptionDto; total: number; lengthCm: number }
    >();
    if (mode === "refresh") {
      for (const s of form.cakeSizeOptions ?? []) {
        totals.set(s.displayName, {
          base: s,
          total: (form.salePrice ?? 0) + s.price,
          lengthCm: s.lengthCm,
        });
      }
    }
    for (const { option, choice } of sizes) {
      const name = choice.sizeDisplayName as CakeSizeDisplayName;
      const prev = totals.get(name);
      totals.set(name, {
        base: prev?.base,
        total: option.price ?? 0,
        lengthCm: choice.lengthCm ?? prev?.lengthCm ?? 0,
      });
    }
    const visibleTotals = [...totals.values()]
      .filter((t) => (t.base?.visible ?? EnableStatus.ENABLE) === EnableStatus.ENABLE)
      .map((t) => t.total)
      .filter((t) => t > 0);
    const salePrice = visibleTotals.length > 0 ? Math.min(...visibleTotals) : (form.salePrice ?? 0);
    // 작은 사이즈부터 (도시락 → 미니 → 1호 → 2호 → 3호)
    const sizeOrder = Object.values(CakeSizeDisplayName);
    next.cakeSizeOptions = [...totals.entries()]
      .sort(([a], [b]) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b))
      .map(([displayName, t]) => ({
        ...(t.base ?? { visible: EnableStatus.ENABLE, description: "" }),
        displayName,
        lengthCm: t.lengthCm,
        price: Math.max(0, t.total - salePrice),
      })) as CakeSizeOptionDto[];
    next.salePrice = salePrice;
    // 할인 중이 아니었으면 정가도 판매가와 같게 둔다
    if (
      next.originalPrice === undefined ||
      next.originalPrice === form.salePrice ||
      next.originalPrice < salePrice
    ) {
      next.originalPrice = salePrice;
    }
  } else if (mode === "create" && detail.suggestedSalePrice && !form.salePrice) {
    // 메뉴처럼 옵션이 없으면 가격만 채운다
    next.salePrice = detail.suggestedSalePrice;
    next.originalPrice = detail.suggestedSalePrice;
  }

  if (extras.length > 0) {
    const groups = [...(form.customOptions ?? [])];
    for (const { option } of extras) {
      const groupName = (option.categoryName ?? NAVER_EXTRA_GROUP_NAME).slice(
        0,
        CUSTOM_OPTION_NAME_MAX,
      );
      let index = groups.findIndex(
        (g) => g.name === groupName && g.type === CustomOptionType.MULTI_SELECT,
      );
      if (index < 0) {
        groups.push({
          type: CustomOptionType.MULTI_SELECT,
          name: groupName,
          required: false,
          visible: EnableStatus.ENABLE,
          choices: [],
        });
        index = groups.length - 1;
      }
      const group: CustomOptionDto = {
        ...groups[index],
        choices: [...(groups[index].choices ?? [])],
      };
      const existing = group.choices!.findIndex((c) => c.label === option.name);
      const price = Math.max(0, option.price ?? 0);
      if (existing >= 0) group.choices![existing] = { ...group.choices![existing], price };
      else group.choices!.push({ label: option.name, price, visible: EnableStatus.ENABLE });
      groups[index] = group;
    }
    next.customOptions = groups;
  }

  return next;
}

/** 다시 불러오기: 사이즈별 지금 가격과 네이버 가격 비교 */
export function compareSizePrice(
  option: NaverProductOptionDto,
  choice: OptionChoice | undefined,
  form: ProductForm,
): { current: number | null; status: "new" | "same" | "changed" } {
  const name = choice?.sizeDisplayName ?? option.sizeDisplayName;
  const current = (form.cakeSizeOptions ?? []).find((s) => s.displayName === name);
  if (!current) return { current: null, status: "new" };
  const total = (form.salePrice ?? 0) + current.price;
  return { current: total, status: total === option.price ? "same" : "changed" };
}

/** AI 초안에 넘길 옵션 요약 (예: 미니 38,000원 / 1호 54,000원) */
export function buildOptionSummary(form: ProductForm): string {
  const base = form.salePrice ?? 0;
  const sizes = (form.cakeSizeOptions ?? [])
    .filter((s) => s.visible === EnableStatus.ENABLE)
    .map(
      (s) =>
        `${s.displayName}${s.lengthCm ? `(${s.lengthCm}cm)` : ""} ${(base + s.price).toLocaleString()}원`,
    );
  const flavors = (form.cakeFlavorOptions ?? [])
    .filter((f) => f.visible === EnableStatus.ENABLE && f.displayName.trim())
    .map((f) => f.displayName);
  return [
    sizes.length ? `사이즈: ${sizes.join(" / ")}` : null,
    flavors.length ? `맛: ${flavors.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
