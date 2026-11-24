import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { lockPageScroll } from "@/apps/web-seller/common/hooks/usePageScrollLock";

/** 단위 테스트는 node 환경이라 잠금이 쓰는 것만 흉내 낸다 */
type Style = { overflow: string; paddingRight: string };
function fakeDom({ innerWidth, clientWidth }: { innerWidth: number; clientWidth: number }) {
  const rootStyle: Style = { overflow: "", paddingRight: "" };
  const bodyStyle: Style = { overflow: "", paddingRight: "" };
  Object.assign(globalThis, {
    window: { innerWidth },
    document: { documentElement: { style: rootStyle, clientWidth }, body: { style: bodyStyle } },
  });
  return { rootStyle, bodyStyle };
}

describe("lockPageScroll", () => {
  const saved = { window: globalThis.window, document: globalThis.document };
  beforeEach(() => fakeDom({ innerWidth: 1440, clientWidth: 1440 }));
  afterEach(() => Object.assign(globalThis, saved));

  it("body가 아니라 html을 잠그고, 풀면 원래대로", () => {
    const { rootStyle, bodyStyle } = fakeDom({ innerWidth: 1440, clientWidth: 1440 });
    const release = lockPageScroll();
    expect(rootStyle.overflow).toBe("hidden");
    // body에 hidden을 걸면 body가 스크롤 상자가 되어 sticky 메뉴가 튄다(11-24)
    expect(bodyStyle.overflow).toBe("");
    expect(rootStyle.paddingRight).toBe("");
    release();
    expect(rootStyle.overflow).toBe("");
  });

  it("스크롤 막대가 자리를 차지하면 그만큼 오른쪽을 채우고, 풀면 지운다", () => {
    const { rootStyle } = fakeDom({ innerWidth: 1440, clientWidth: 1425 });
    const release = lockPageScroll();
    expect(rootStyle.paddingRight).toBe("15px");
    release();
    expect(rootStyle.paddingRight).toBe("");
  });

  it("창이 겹쳐 열리면 마지막 창이 닫힐 때 한 번만 푼다", () => {
    const { rootStyle } = fakeDom({ innerWidth: 1440, clientWidth: 1440 });
    const first = lockPageScroll();
    const second = lockPageScroll();
    first();
    expect(rootStyle.overflow).toBe("hidden");
    second();
    expect(rootStyle.overflow).toBe("");
  });

  it("같은 푸는 함수를 두 번 불러도 다른 창의 잠금을 풀지 않는다", () => {
    const { rootStyle } = fakeDom({ innerWidth: 1440, clientWidth: 1440 });
    const first = lockPageScroll();
    const second = lockPageScroll();
    first();
    first();
    expect(rootStyle.overflow).toBe("hidden");
    second();
    expect(rootStyle.overflow).toBe("");
  });

  it("잠그기 전 html에 있던 값으로 돌린다", () => {
    const { rootStyle } = fakeDom({ innerWidth: 1440, clientWidth: 1440 });
    rootStyle.overflow = "auto";
    const release = lockPageScroll();
    release();
    expect(rootStyle.overflow).toBe("auto");
  });
});
