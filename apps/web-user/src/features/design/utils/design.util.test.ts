import { existsSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { DESIGNS } from "@/apps/web-user/features/design/constants/designs.constant";
import { ProductCategoryType as C } from "@/apps/web-user/features/product/types/product.type";
import {
  designCaption,
  designHashtags,
  getDesign,
  searchDesigns,
} from "@/apps/web-user/features/design/utils/design.util";

// 크리스마스 디자인이 보이는 날(11월 1일~12월 25일)
const IN_SEASON = new Date("2026-12-01T03:00:00Z");
const names = (r: { items: { id: string }[] }) => r.items.map((d) => d.id);

describe("searchDesigns (11-15 카테고리 묶음)", () => {
  it("묶음끼리는 그리고: 생일 + 하트 = 생일이면서 하트인 디자인만", () => {
    const r = searchDesigns({ categories: [C.BIRTHDAY, C.HEART], q: "" }, IN_SEASON);
    expect(r.matched).toBe(true);
    for (const id of names(r)) {
      const d = getDesign(id)!;
      expect(d.occasions).toContain(C.BIRTHDAY);
      expect(d.occasions).toContain(C.HEART);
    }
  });

  it("묶음 안은 또는: 결혼·프로포즈 또는 백일·돌", () => {
    const r = searchDesigns({ categories: [C.WEDDING, C.BABY], q: "" }, IN_SEASON);
    expect(r.matched).toBe(true);
    expect(names(r)).toEqual(
      expect.arrayContaining(["baegil-gold-lettering", "heart-white-engaged"]),
    );
    for (const id of names(r)) {
      const d = getDesign(id)!;
      expect(d.occasions.includes(C.WEDDING) || d.occasions.includes(C.BABY)).toBe(true);
    }
  });

  it("도시락만 고르면 도시락 디자인만, 다른 사이즈가 섞이면 거르지 않는다", () => {
    const lunch = searchDesigns({ categories: [], q: "", sizes: ["도시락"] }, IN_SEASON);
    expect(lunch.items.length).toBeGreaterThan(0);
    expect(lunch.items.every((d) => d.style === "도시락" || d.parts.shape.includes("도시락"))).toBe(
      true,
    );
    const mixed = searchDesigns({ categories: [], q: "", sizes: ["도시락", "1호"] }, IN_SEASON);
    const all = searchDesigns({ categories: [], q: "" }, IN_SEASON);
    expect(mixed.items.length).toBe(all.items.length);
  });

  it("검색어가 카테고리와 같은 뜻이면 그 카테고리 디자인도 찾는다(남친 → 연인·기념일)", () => {
    const r = searchDesigns({ categories: [], q: "남친" }, IN_SEASON);
    expect(r.matched).toBe(true);
    expect(r.items.every((d) => d.occasions.includes(C.COUPLE))).toBe(true);
  });

  it("'사진'으로 찾으면 설명 문장(사진처럼 …) 때문에 모두 맞지 않는다", () => {
    expect(searchDesigns({ categories: [], q: "사진" }, IN_SEASON).matched).toBe(false);
    expect(searchDesigns({ categories: [], q: "사진 케이크" }, IN_SEASON).matched).toBe(false);
  });

  it("맞는 게 없으면 전체를 보이고 matched=false", () => {
    // 사진(사진을 인쇄해 올린 케이크)은 무료 사진이 없어 디자인이 아직 없다
    const r = searchDesigns({ categories: [C.PHOTO], q: "" }, IN_SEASON);
    expect(r.matched).toBe(false);
  });
});

describe("해시태그·카드 둘째 줄", () => {
  it("크리스마스 디자인은 #크리스마스 하나(시즌·모양 말이 겹치지 않음)", () => {
    const tags = designHashtags(getDesign("christmas-wreath-lettering")!).map((t) => t.label);
    expect(tags).toEqual(["#크리스마스", "#레터링"]);
    expect(designCaption(getDesign("christmas-wreath-lettering")!)).toBe("크리스마스");
  });

  it("카테고리 해시태그는 그 카테고리 디자인 탭으로 간다", () => {
    const tags = designHashtags(getDesign("heart-love-red")!);
    expect(tags.map((t) => t.label)).toEqual(["#연인·기념일", "#레터링", "#하트"]);
    expect(tags[0].href).toBe("/search?tab=design&category=COUPLE");
  });

  it("모양 말이 카테고리와 같은 뜻이면(플라워 = 꽃) 한 번만", () => {
    const tags = designHashtags(getDesign("carnation-pearl")!).map((t) => t.label);
    expect(tags).toEqual(["#부모님·감사", "#꽃"]);
  });
});

describe("디자인 모음 데이터(11-15 66장)", () => {
  const dir = path.resolve(__dirname, "../../../../public/images/designs");

  it("id가 겹치지 않고 사진·작은 사진 파일이 있다", () => {
    expect(new Set(DESIGNS.map((d) => d.id)).size).toBe(DESIGNS.length);
    for (const d of DESIGNS) {
      expect(existsSync(path.join(dir, d.image.file)), d.image.file).toBe(true);
      expect(existsSync(path.join(dir, d.image.thumb)), d.image.thumb).toBe(true);
    }
  });

  it("해시태그 카테고리는 거르기 카테고리 안에 있고, 크리스마스 디자인은 시즌이다", () => {
    for (const d of DESIGNS) {
      for (const t of d.tagOccasions) expect(d.occasions, d.id).toContain(t);
      if (d.seasonal === "CHRISTMAS") expect(d.occasions, d.id).toContain(C.SEASON);
      else expect(d.occasions, d.id).not.toContain(C.SEASON);
    }
  });

  it("2단·캐릭터 칸에도 디자인이 있다(11-15 전에는 0개)", () => {
    for (const c of [C.TWO_TIER, C.CHARACTER]) {
      expect(searchDesigns({ categories: [c], q: "" }, IN_SEASON).matched).toBe(true);
    }
  });
});
