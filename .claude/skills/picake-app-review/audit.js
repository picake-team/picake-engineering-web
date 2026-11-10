// 지금 열린 화면 하나를 디자인 기준으로 점검한다(Playwright MCP `browser_run_code_unsafe`의 filename으로 실행).
// 화면을 옮겨 다니며 여러 번 돌리고, 고친 뒤 다시 돌려 없어졌는지 본다. 값은 코드(tokens)가 정본이라 바뀌면 여기도 맞춘다.
// 손님 앱(web-user)은 #root-scroll-container가 있어 알아본다. 나머지는 판매자 앱 기준.
async (page) => {
  return await page.evaluate(() => {
    const customer = !!document.getElementById("root-scroll-container");
    const rule = customer
      ? {
          app: "손님",
          fontSizes: [11, 12, 13, 14, 16, 18, 20, 24],
          // design-tokens colors (gray·primary·red·blue·green·yellow·흰·검정)
          colors: "FFFFFF 000000 1F1F1E F5F5F5 EBEBEA D4D4D3 BDBFC0 9B9B97 808386 686864 4E4E4B 343432 FF653E FFEFEB FFD2C7 FFAD99 FF896B EBF8FF B8E5FF 80D0FF 2EB2FF 009BF5 ECF9F1 C9EED8 9BDFB7 57CB87 27A55B FEECEC FCCACB F99FA1 F67476 F23A3E FFC83B FEE500",
          minTap: 40,
        }
      : {
          app: "판매자",
          fontSizes: [11, 12, 13, 15, 16, 18, 20],
          colors: "FFFFFF 000000 1F1F1E 4E4E4B 686864 767672 8C8C88 D4D4D3 EBEBEA F5F5F5 FF653E B5401C FF9442",
          minTap: 40,
        };
    const palette = new Set(rule.colors.split(" "));
    const hex = (c) => {
      const m = c.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/);
      if (!m || (m[4] !== undefined && Number(m[4]) === 0)) return null;
      return [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("").toUpperCase();
    };
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0;
    };
    const label = (el) => {
      const t = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24);
      return `${el.tagName.toLowerCase()}「${t}」`;
    };
    const out = { app: rule.app, path: location.pathname, font: [], color: [], tap: [], noName: [], overflow: [], hardMotion: [] };
    const seen = new Set();
    const push = (k, v) => {
      const key = k + v;
      if (!seen.has(key) && out[k].length < 12) {
        seen.add(key);
        out[k].push(v);
      }
    };
    const all = [...document.querySelectorAll("body *")].filter((el) => !el.closest("nextjs-portal, .tsqd-parent-container, svg"));
    for (const el of all) {
      if (!visible(el)) continue;
      const s = getComputedStyle(el);
      const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (ownText) {
        const fs = Math.round(parseFloat(s.fontSize));
        if (!rule.fontSizes.includes(fs)) push("font", `${fs}px ${label(el)}`);
        const c = hex(s.color);
        if (c && !palette.has(c)) push("color", `글자 #${c} ${label(el)}`);
      }
      const bg = hex(s.backgroundColor);
      if (bg && !palette.has(bg)) push("color", `바탕 #${bg} ${label(el)}`);
      const r = el.getBoundingClientRect();
      if (r.right > innerWidth + 1 && s.position !== "fixed" && !el.closest("[class*=overflow-x], .swiper")) push("overflow", `${Math.round(r.right)} > ${innerWidth} ${label(el)}`);
      const d = parseFloat(s.transitionDuration);
      if (d && ![0.1, 0.15, 0.2, 0.25, 0.3, 0.4].includes(d)) push("hardMotion", `${d}s ${label(el)}`);
    }
    for (const el of document.querySelectorAll("button, a[href], [role=button], [role=tab], input[type=checkbox], input[type=radio], [role=switch]")) {
      if (!visible(el) || el.closest("nextjs-portal, .tsqd-parent-container")) continue;
      // 부품이 ::before로 누르는 칸을 넓힌 경우(판매자 앱)는 가상 요소까지 본다
      const r = el.getBoundingClientRect();
      const b = getComputedStyle(el, "::before");
      const extra = b.content !== "none" && b.position === "absolute" ? Math.max(0, -parseFloat(b.top || "0")) * 2 : 0;
      if (Math.min(r.width, r.height) + extra < rule.minTap && !el.closest("p, li > span")) push("tap", `${Math.round(r.width)}×${Math.round(r.height)} ${label(el)}`);
      const name = (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.textContent || el.querySelector("img[alt]")?.alt || el.getAttribute("title") || "").trim();
      if (!name && !el.closest("label")) push("noName", label(el) + " " + (el.className?.toString?.().slice(0, 40) ?? ""));
    }
    for (const k of Object.keys(out)) if (Array.isArray(out[k]) && !out[k].length) delete out[k];
    return out;
  });
}
