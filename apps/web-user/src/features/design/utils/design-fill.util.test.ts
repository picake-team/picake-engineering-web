import { describe, expect, it } from "vitest";
import type { Design } from "@/apps/web-user/features/design/types/design.type";
import {
  applyDesignFill,
  buildDesignFill,
  isAutoFilled,
  partsChipLabel,
} from "@/apps/web-user/features/design/utils/design-fill.util";

const base: Omit<Design, "id" | "parts" | "description" | "size" | "creams" | "requestNote"> = {
  name: "",
  occasions: [],
  style: "",
  seasonal: null,
  image: { file: "", thumb: "", width: 1, height: 1 },
  credit: { kind: "FREE_PHOTO", author: "", site: "Pexels", pageUrl: "", checkedAt: "2026-11-14" },
  tagOccasions: [],
  magazine: null,
};

const bento: Design = {
  ...base,
  id: "bento",
  parts: {
    shape: "흰 크림 도시락 케이크",
    color: "흰색 크림",
    decoration: "작은 빨간 하트",
    lettering: '검은 필기체 "happy birthday" 레터링',
  },
  description: '사진처럼 흰 크림 도시락 케이크에 작은 빨간 하트, 가운데 "happy birthday" 레터링',
  size: "LUNCHBOX",
  creams: [],
  requestNote: "사진처럼 초 1개",
};

const heart: Design = {
  ...base,
  id: "heart",
  parts: {
    shape: "하트 모양 케이크",
    color: "연분홍 크림",
    decoration: "분홍 크림 프릴 테두리",
    lettering: '"18"',
  },
  description: '사진처럼 연분홍 하트 모양 케이크에 분홍 크림 프릴 테두리, 가운데 "18"',
  size: null,
  creams: ["BUTTER_CREAM"],
  requestNote: "",
};

describe("partsChipLabel", () => {
  it("전체·하나만·여러 개", () => {
    expect(partsChipLabel(["ALL"])).toBe("전체");
    expect(partsChipLabel([])).toBe("전체");
    expect(partsChipLabel(["DECORATION"])).toBe("장식만");
    expect(partsChipLabel(["DECORATION", "COLOR"])).toBe("색·장식");
  });
});

describe("buildDesignFill", () => {
  it("한 장·전체는 머리말 + 분류 줄", () => {
    expect(buildDesignFill([{ design: bento, parts: ["ALL"] }])).toEqual({
      description:
        '사진처럼 만들어 주세요\n· 모양: 흰 크림 도시락 케이크\n· 색: 흰색 크림\n· 장식: 작은 빨간 하트\n· 글자: 검은 필기체 "happy birthday" 레터링',
    });
  });

  it("한 장에서 일부만 고르면 그 줄만", () => {
    const fill = buildDesignFill([{ design: bento, parts: ["DECORATION", "LETTERING"] }]);
    expect(fill?.description).toBe(
      '사진에서 장식·글자만 참고해 주세요\n· 장식: 작은 빨간 하트\n· 글자: 검은 필기체 "happy birthday" 레터링',
    );
  });

  it("손님 사진만 있고 모두 전체면 채우지 않는다", () => {
    expect(buildDesignFill([{ design: null, parts: ["ALL"] }])).toBeNull();
  });

  it("여러 장은 사진마다 묶고 사이에 빈 줄", () => {
    const fill = buildDesignFill([
      { design: bento, parts: ["ALL"] },
      { design: heart, parts: ["DECORATION"] },
    ]);
    expect(fill?.description).toBe(
      '1번 사진처럼\n· 모양: 흰 크림 도시락 케이크\n· 색: 흰색 크림\n· 장식: 작은 빨간 하트\n· 글자: 검은 필기체 "happy birthday" 레터링\n\n2번 사진에서 장식만\n· 장식: 분홍 크림 프릴 테두리',
    );
  });

  it("읽은 값이 없는 손님 사진은 번호로", () => {
    const fill = buildDesignFill([
      { design: heart, parts: ["SHAPE", "COLOR"] },
      { design: null, parts: ["ALL"] },
    ]);
    expect(fill?.description).toBe(
      "1번 사진에서 모양·색만\n· 모양: 하트 모양 케이크\n· 색: 연분홍 크림\n\n2번 사진도 참고해 주세요",
    );
  });

  it("설명은 500자까지", () => {
    const long = { ...bento, parts: { ...bento.parts, decoration: "가".repeat(300) } };
    const long2 = { ...heart, parts: { ...heart.parts, decoration: "나".repeat(300) } };
    const fill = buildDesignFill([
      { design: long, parts: ["ALL"] },
      { design: long2, parts: ["ALL"] },
    ]);
    expect(fill?.description.length).toBe(500);
  });

  it("채우는 칸은 설명 하나뿐(크기·크림·요청 사항은 손님이 고른다)", () => {
    expect(Object.keys(buildDesignFill([{ design: bento, parts: ["ALL"] }]) ?? {})).toEqual([
      "description",
    ]);
  });
});

describe("applyDesignFill", () => {
  const empty = { description: "" };

  it("빈 설명을 채우고 채운 값을 기억한다", () => {
    const next = buildDesignFill([{ design: bento, parts: ["ALL"] }]);
    const { patch, auto } = applyDesignFill(empty, undefined, next);
    expect(patch).toEqual({ description: next?.description });
    expect(auto.description).toBe(next?.description);
    expect(isAutoFilled("description", { ...empty, ...patch }, auto)).toBe(true);
  });

  it("손님이 고친 설명은 건드리지 않는다", () => {
    const first = applyDesignFill(
      empty,
      undefined,
      buildDesignFill([{ design: bento, parts: ["ALL"] }]),
    );
    const edited = { description: "제가 쓴 설명" };
    const next = buildDesignFill([{ design: heart, parts: ["ALL"] }]);
    expect(applyDesignFill(edited, first.auto, next).patch.description).toBeUndefined();
    expect(isAutoFilled("description", edited, first.auto)).toBe(false);
  });

  it("사진을 다 빼면 채운 그대로인 설명만 비운다", () => {
    const first = applyDesignFill(
      empty,
      undefined,
      buildDesignFill([{ design: bento, parts: ["ALL"] }]),
    );
    expect(applyDesignFill({ ...empty, ...first.patch }, first.auto, null).patch).toEqual({
      description: "",
    });
  });
});
