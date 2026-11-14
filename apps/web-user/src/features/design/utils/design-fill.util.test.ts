import { describe, expect, it } from "vitest";
import type { Design } from "@/apps/web-user/features/design/types/design.type";
import {
  applyDesignFill,
  buildDesignFill,
  isAutoFilled,
  partsChipLabel,
  revertDesignFill,
} from "@/apps/web-user/features/design/utils/design-fill.util";

const base: Omit<Design, "id" | "parts" | "description" | "size" | "creams" | "requestNote"> = {
  name: "",
  occasions: [],
  style: "",
  seasonal: null,
  image: { file: "", thumb: "", width: 1, height: 1 },
  credit: { kind: "FREE_PHOTO", author: "", site: "Pexels", pageUrl: "", checkedAt: "2026-11-14" },
  read: [],
  tip: null,
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
  it("디자인 한 장이면 미리 읽은 값 그대로", () => {
    expect(buildDesignFill([{ design: bento, parts: ["ALL"] }])).toEqual({
      description: bento.description,
      size: "LUNCHBOX",
      creams: [],
      requestNote: "사진처럼 초 1개",
      conflicts: [],
    });
  });

  it("손님 사진만 있고 모두 전체면 채우지 않는다", () => {
    expect(buildDesignFill([{ design: null, parts: ["ALL"] }])).toBeNull();
  });

  it("여러 장은 사진 번호를 붙여 합친다", () => {
    const fill = buildDesignFill([
      { design: bento, parts: ["ALL"] },
      { design: heart, parts: ["DECORATION"] },
    ]);
    expect(fill?.description).toBe(
      '1번 사진처럼 흰 크림 도시락 케이크에 작은 빨간 하트, 가운데 "happy birthday" 레터링, 장식은 2번 사진처럼 분홍 크림 프릴 테두리',
    );
    expect(fill?.size).toBe("LUNCHBOX");
    // 2번은 장식만이라 크림을 가져오지 않는다
    expect(fill?.creams).toEqual([]);
    expect(fill?.requestNote).toBe("사진처럼 초 1개");
  });

  it("손님 사진의 가져올 것은 설명에 번호로만 적는다", () => {
    const fill = buildDesignFill([
      { design: heart, parts: ["SHAPE", "COLOR"] },
      { design: null, parts: ["LETTERING"] },
    ]);
    expect(fill?.description).toBe(
      "모양·색은 1번 사진처럼 하트 모양 케이크, 연분홍 크림, 글자는 2번 사진처럼",
    );
    expect(fill?.creams).toEqual(["BUTTER_CREAM"]);
  });

  it("크기가 사진마다 다르면 앞 사진을 따르고 알린다", () => {
    const mini: Design = { ...heart, id: "mini", size: "MINI" };
    const fill = buildDesignFill([
      { design: bento, parts: ["ALL"] },
      { design: mini, parts: ["SHAPE"] },
    ]);
    expect(fill?.size).toBe("LUNCHBOX");
    expect(fill?.conflicts).toEqual(["size"]);
  });
});

describe("applyDesignFill", () => {
  const empty = { description: "", size: null, creams: [], requestNote: "" };

  it("빈 칸을 채우고 채운 값을 기억한다", () => {
    const next = buildDesignFill([{ design: bento, parts: ["ALL"] }]);
    const { patch, auto } = applyDesignFill(empty, undefined, next);
    expect(patch).toEqual({
      description: bento.description,
      size: "LUNCHBOX",
      requestNote: "사진처럼 초 1개",
    });
    expect(auto.description).toBe(bento.description);
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

  it("되돌리기는 채운 값 그대로인 칸만 비운다", () => {
    const first = applyDesignFill(
      empty,
      undefined,
      buildDesignFill([{ design: bento, parts: ["ALL"] }]),
    );
    const now = { ...empty, ...first.patch, description: "고친 설명" };
    expect(revertDesignFill(now, first.auto)).toEqual({ size: null, requestNote: "" });
  });
});
