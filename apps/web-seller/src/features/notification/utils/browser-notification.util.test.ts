import { describe, expect, it } from "vitest";
import { shouldShowBrowserNotification } from "./browser-notification.util";

describe("shouldShowBrowserNotification", () => {
  const base = { on: true, permission: "granted" as const, visible: true, focused: true };

  it("화면을 보고 있으면 띄우지 않는다(화면 안 안내 띠로 충분)", () => {
    expect(shouldShowBrowserNotification(base)).toBe(false);
  });

  it("탭이 뒤에 있거나 다른 창을 보고 있으면 띄운다", () => {
    expect(shouldShowBrowserNotification({ ...base, visible: false })).toBe(true);
    expect(shouldShowBrowserNotification({ ...base, focused: false })).toBe(true);
  });

  it("끄거나 허용하지 않았으면 띄우지 않는다", () => {
    expect(shouldShowBrowserNotification({ ...base, visible: false, on: false })).toBe(false);
    expect(shouldShowBrowserNotification({ ...base, visible: false, permission: "denied" })).toBe(
      false,
    );
    expect(shouldShowBrowserNotification({ ...base, visible: false, permission: "default" })).toBe(
      false,
    );
    expect(
      shouldShowBrowserNotification({ ...base, visible: false, permission: "unsupported" }),
    ).toBe(false);
  });
});
