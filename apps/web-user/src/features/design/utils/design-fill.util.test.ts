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
      size: "LUNCHBOX",
      creams: [],
      requestNote: "사진처럼 초 1개",
      conflicts: [],
    });
  });

  it("한 장에서 일부만 고르면 그 줄만", () => {
    const fill = buildDesignFill([{ design: bento, parts: ["DECORATION", "LETTERING"] }]);
    expect(fill?.description).toBe(
      '사진에서 장식·글자만 참고해 주세요\n· 장식: 작은 빨간 하트\n· 글자: 검은 필기체 "happy birthday" 레터링',
    );
    expect(fill?.size).toBeNull();
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
    expect(fill?.size).toBe("LUNCHBOX");
    expect(fill?.requestNote).toBe("사진처럼 초 1개");
  });

  it("읽은 값이 없는 손님 사진은 번호로", () => {
    const fill = buildDesignFill([
      { design: heart, parts: ["SHAPE", "COLOR"] },
      { design: null, parts: ["ALL"] },
    ]);
    expect(fill?.description).toBe(
      "1번 사진에서 모양·색만\n· 모양: 하트 모양 케이크\n· 색: 연분홍 크림\n\n2번 사진도 참고해 주세요",
    );
    expect(fill?.creams).toEqual(["BUTTER_CREAM"]);
  });

  it("크기가 사진마다 다르면 모양을 고른 사진을 따르고 알린다", () => {
    const mini: Design = { ...heart, id: "mini", size: "MINI" };
    const fill = buildDesignFill([
      { design: bento, parts: ["ALL"] },
      { design: mini, parts: ["SHAPE"] },
    ]);
    expect(fill?.size).toBe("MINI");
    expect(fill?.conflicts).toEqual(["size"]);
  });

  it("요청 사항은 200자까지", () => {
    const long = { ...bento, requestNote: "가".repeat(150) };
    const long2 = { ...heart, requestNote: "나".repeat(150) };
    const fill = buildDesignFill([
      { design: long, parts: ["ALL"] },
      { design: long2, parts: ["ALL"] },
    ]);
    expect(fill?.requestNote.length).toBe(200);
  });
});

describe("applyDesignFill", () => {
  const empty = { description: "", size: null, creams: [], requestNote: "" };

  it("빈 칸을 채우고 채운 값을 기억한다", () => {
    const next = buildDesignFill([{ design: bento, parts: ["ALL"] }]);
    const { patch, auto } = applyDesignFill(empty, undefined, next);
    expect(patch).toEqual({
      description: next?.description,
      size: "LUNCHBOX",
      requestNote: "사진처럼 초 1개",
    });
    expect(auto.description).toBe(next?.description);
    const now = { ...empty, ...patch };
    expect(isAutoFilled("description", now, auto)).toBe(true);
    expect(isAutoFilled("creams", now, auto)).toBe(false);
  });

  it("손님이 고친 칸은 건드리지 않는다", () => {
    const first = applyDesignFill(
      empty,
      undefined,
      buildDesignFill([{ design: bento, parts: ["ALL"] }]),
    );
    const edited = { ...empty, ...first.patch, description: "제가 쓴 설명" };
    const next = buildDesignFill([{ design: heart, parts: ["ALL"] }]);
    const { patch } = applyDesignFill(edited, first.auto, next);
    expect(patch.description).toBeUndefined();
    // 크기는 채운 그대로였으니 새 사진(크기 없음)에 맞춰 비운다
    expect(patch.size).toBeNull();
    expect(patch.creams).toEqual(["BUTTER_CREAM"]);
  });

  it("사진을 다 빼면 채운 칸만 비운다", () => {
    const first = applyDesignFill(
      empty,
      undefined,
      buildDesignFill([{ design: bento, parts: ["ALL"] }]),
    );
    const now = { ...empty, ...first.patch, requestNote: "알레르기 없어요" };
    const { patch } = applyDesignFill(now, first.auto, null);
    expect(patch).toEqual({ description: "", size: null });
  });
});
