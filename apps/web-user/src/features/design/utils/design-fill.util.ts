/**
 * 고른 사진으로 견적 요청서 칸 채우기(기획 I-112 ⑤).
 * 디자인 모음 사진은 미리 읽어 둔 값을 정해 둔 문장 틀로 합친다(AI를 부르지 않는다).
 * 손님이 직접 올린 사진은 읽은 값이 없어 "가져올 것"만 설명에 적는다.
 */
import type { Design, DesignPart } from "@/apps/web-user/features/design/types/design.type";
import type { QuoteCakeSize, QuoteCream } from "@/apps/web-user/features/quote/types/quote.type";

export const DESIGN_PART_ORDER: Exclude<DesignPart, "ALL">[] = [
  "SHAPE",
  "COLOR",
  "DECORATION",
  "LETTERING",
];

export const DESIGN_PART_LABEL: Record<DesignPart, string> = {
  ALL: "전체",
  SHAPE: "모양",
  COLOR: "색",
  DECORATION: "장식",
  LETTERING: "글자",
};

/** 채울 값을 가진 사진: 디자인 모음(미리 읽은 값) 또는 AI가 읽은 손님 사진 */
export type FillSource = Pick<Design, "parts" | "description" | "size" | "creams" | "requestNote">;

export interface FillPhoto {
  design: FillSource | null;
  parts: DesignPart[];
}

export interface DesignFill {
  description: string;
  size: QuoteCakeSize | null;
  creams: QuoteCream[];
  requestNote: string;
  /** 사진마다 달라서 앞 사진을 따른 칸 */
  conflicts: ("size" | "creams")[];
}

export const DESCRIPTION_MAX = 500;

export function isAllParts(parts: DesignPart[]): boolean {
  return parts.length === 0 || parts.includes("ALL");
}

/** 칩에 보이는 말: "전체", "장식만", "색·장식" */
export function partsChipLabel(parts: DesignPart[]): string {
  if (isAllParts(parts)) return DESIGN_PART_LABEL.ALL;
  const picked = DESIGN_PART_ORDER.filter((p) => parts.includes(p));
  return picked.length === 1
    ? `${DESIGN_PART_LABEL[picked[0]]}만`
    : picked.map((p) => DESIGN_PART_LABEL[p]).join("·");
}

const PART_KEY = {
  SHAPE: "shape",
  COLOR: "color",
  DECORATION: "decoration",
  LETTERING: "lettering",
} as const;

export const REQUEST_NOTE_MAX = 200;

/** 사진에서 읽은 것 4줄(값이 없는 줄은 뺀다). 상세 화면과 요청서 설명이 같이 쓴다 */
export function designRows(parts: FillSource["parts"]): { label: string; value: string }[] {
  return DESIGN_PART_ORDER.flatMap((part) => {
    const value = parts[PART_KEY[part]];
    return value ? [{ label: DESIGN_PART_LABEL[part], value }] : [];
  });
}

/**
 * 사진들로 채울 값. 채울 것이 없으면 null.
 * 설명은 사진마다 묶어 "· 모양: …"처럼 한 줄씩 쓴다(운영자 11-14 "깔끔하게").
 * - 한 장·전체: "사진처럼 만들어 주세요" + 줄들
 * - 한 장·일부: "사진에서 장식·글자만 참고해 주세요" + 고른 줄들
 * - 여러 장: "1번 사진처럼" / "2번 사진에서 장식만" + 줄들, 사진 사이는 빈 줄.
 *   읽은 값이 없는 손님 사진은 "3번 사진도 참고해 주세요"
 */
export function buildDesignFill(photos: FillPhoto[]): DesignFill | null {
  if (!photos.some((p) => p.design) && photos.every((p) => isAllParts(p.parts))) return null;
  const multi = photos.length > 1;
  const chosen = (p: FillPhoto) =>
    isAllParts(p.parts) ? DESIGN_PART_ORDER : DESIGN_PART_ORDER.filter((x) => p.parts.includes(x));

  const blocks: string[] = [];
  photos.forEach((p, i) => {
    const parts = chosen(p);
    const partial = !isAllParts(p.parts);
    if (!p.design && !partial) {
      if (multi) blocks.push(`${i + 1}번 사진도 참고해 주세요`);
      return;
    }
    const what = parts.map((x) => DESIGN_PART_LABEL[x]).join("·");
    const head = multi
      ? partial
        ? `${i + 1}번 사진에서 ${what}만`
        : `${i + 1}번 사진처럼`
      : partial
        ? `사진에서 ${what}만 참고해 주세요`
        : "사진처럼 만들어 주세요";
    const lines = parts.flatMap((part) => {
      const value = p.design?.parts[PART_KEY[part]];
      return value ? [`· ${DESIGN_PART_LABEL[part]}: ${value}`] : [];
    });
    blocks.push([head, ...lines].join("\n"));
  });
  if (!blocks.length) return null;

  // 크기·크림은 그 칸을 직접 고른 사진을 먼저, 없으면 전체인 사진을 따른다
  const sources = (part: Exclude<DesignPart, "ALL">) =>
    [
      ...photos.filter((p) => !isAllParts(p.parts) && p.parts.includes(part)),
      ...photos.filter((p) => isAllParts(p.parts)),
    ]
      .map((p) => p.design)
      .filter((d): d is FillSource => !!d);
  const sizes = sources("SHAPE")
    .map((d) => d.size)
    .filter((v): v is QuoteCakeSize => !!v);
  const creamSets = sources("COLOR")
    .map((d) => d.creams)
    .filter((c) => c.length > 0);
  const notes = [
    ...new Set(
      photos
        .filter((p) => p.design && chosen(p).includes("DECORATION") && p.design.requestNote)
        .map((p) => p.design?.requestNote as string),
    ),
  ];
  const conflicts: DesignFill["conflicts"] = [];
  if (new Set(sizes).size > 1) conflicts.push("size");
  if (new Set(creamSets.map((c) => [...c].sort().join())).size > 1) conflicts.push("creams");

  return {
    description: blocks.join(multi ? "\n\n" : "\n").slice(0, DESCRIPTION_MAX),
    size: sizes[0] ?? null,
    creams: creamSets[0] ?? [],
    requestNote: notes.join(", ").slice(0, REQUEST_NOTE_MAX),
    conflicts,
  };
}

/** 요청서에 남겨 둔 "마지막으로 채운 값". 손님이 고친 칸은 다시 채우지 않는다 */
export interface QuoteAutoFill {
  description?: string;
  size?: QuoteCakeSize | null;
  creams?: QuoteCream[];
  requestNote?: string;
  conflicts?: DesignFill["conflicts"];
}

export interface FillableFields {
  description: string;
  size: QuoteCakeSize | null;
  creams: QuoteCream[];
  requestNote: string;
}

const EMPTY: FillableFields = { description: "", size: null, creams: [], requestNote: "" };
const FIELDS = ["description", "size", "creams", "requestNote"] as const;

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function isEmpty(v: unknown): boolean {
  return v === null || v === "" || (Array.isArray(v) && v.length === 0);
}

/** 이 칸이 지금 채운 값 그대로인지(✦ 표시) */
export function isAutoFilled(
  field: (typeof FIELDS)[number],
  current: FillableFields,
  auto: QuoteAutoFill | undefined,
): boolean {
  if (!auto || auto[field] === undefined) return false;
  return !isEmpty(current[field]) && same(current[field], auto[field]);
}

/**
 * 새로 채울 값을 지금 칸에 반영한다. 비어 있거나 지난번에 채운 값 그대로인 칸만 바꾸고,
 * 손님이 고친 칸은 그대로 둔다.
 */
export function applyDesignFill(
  current: FillableFields,
  prev: QuoteAutoFill | undefined,
  next: DesignFill | null,
): { patch: Partial<FillableFields>; auto: QuoteAutoFill } {
  const patch: Partial<FillableFields> = {};
  const auto: QuoteAutoFill = {};
  for (const f of FIELDS) {
    const cur = current[f];
    const untouched = isEmpty(cur) || (prev?.[f] !== undefined && same(cur, prev[f]));
    if (!untouched) continue;
    const value = next ? next[f] : EMPTY[f];
    if (!same(cur, value)) Object.assign(patch, { [f]: value });
    if (next && !isEmpty(value)) Object.assign(auto, { [f]: value });
  }
  if (next?.conflicts.length) auto.conflicts = next.conflicts;
  return { patch, auto };
}

/** "되돌리기": 채운 값 그대로인 칸을 비운다 */
export function revertDesignFill(
  current: FillableFields,
  auto: QuoteAutoFill | undefined,
): Partial<FillableFields> {
  const patch: Partial<FillableFields> = {};
  for (const f of FIELDS) {
    if (isAutoFilled(f, current, auto)) Object.assign(patch, { [f]: EMPTY[f] });
  }
  return patch;
}

/** 가게·손님 화면의 사진 이름표: "1 · 전체", "2 · 장식만"(사진이 한 장이면 없음) */
export function photoBadge(
  details: { parts: DesignPart[] }[] | undefined,
  index: number,
  total: number,
): string | null {
  const parts = details?.[index]?.parts ?? ["ALL"];
  // 한 장이면 전체일 때는 없음, 일부만 고르면 "장식만"
  if (total < 2) return isAllParts(parts) ? null : partsChipLabel(parts);
  return `${index + 1} · ${partsChipLabel(parts)}`;
}
