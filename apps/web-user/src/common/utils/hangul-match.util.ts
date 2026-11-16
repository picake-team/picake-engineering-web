/**
 * 검색 자동완성의 한글 맞추기(2026-11-16).
 * 글자를 자모로 나눠 비교해, 치는 중인 글자("렡" → 레터링), 초성("ㄹㅌㄹ"), 영문 자판으로 친 말("fpxjfld")도 찾는다.
 */

const SYLLABLE_START = 0xac00;
const SYLLABLE_END = 0xd7a3;

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = [
  "ㅏ",
  "ㅐ",
  "ㅑ",
  "ㅒ",
  "ㅓ",
  "ㅔ",
  "ㅕ",
  "ㅖ",
  "ㅗ",
  "ㅗㅏ",
  "ㅗㅐ",
  "ㅗㅣ",
  "ㅛ",
  "ㅜ",
  "ㅜㅓ",
  "ㅜㅔ",
  "ㅜㅣ",
  "ㅠ",
  "ㅡ",
  "ㅡㅣ",
  "ㅣ",
];
const JONG = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄱㅅ",
  "ㄴ",
  "ㄴㅈ",
  "ㄴㅎ",
  "ㄷ",
  "ㄹ",
  "ㄹㄱ",
  "ㄹㅁ",
  "ㄹㅂ",
  "ㄹㅅ",
  "ㄹㅌ",
  "ㄹㅍ",
  "ㄹㅎ",
  "ㅁ",
  "ㅂ",
  "ㅂㅅ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

/** 따로 친 겹모음·겹받침(ㅘ, ㄳ)도 나눠 둔다 */
const COMPOUND_JAMO: Record<string, string> = {
  ㅘ: "ㅗㅏ",
  ㅙ: "ㅗㅐ",
  ㅚ: "ㅗㅣ",
  ㅝ: "ㅜㅓ",
  ㅞ: "ㅜㅔ",
  ㅟ: "ㅜㅣ",
  ㅢ: "ㅡㅣ",
  ㄳ: "ㄱㅅ",
  ㄵ: "ㄴㅈ",
  ㄶ: "ㄴㅎ",
  ㄺ: "ㄹㄱ",
  ㄻ: "ㄹㅁ",
  ㄼ: "ㄹㅂ",
  ㄽ: "ㄹㅅ",
  ㄾ: "ㄹㅌ",
  ㄿ: "ㄹㅍ",
  ㅀ: "ㄹㅎ",
  ㅄ: "ㅂㅅ",
};

/** 두벌식 자판: 영문 자판 상태로 친 글자 → 자모 */
const QWERTY: Record<string, string> = {
  q: "ㅂ",
  w: "ㅈ",
  e: "ㄷ",
  r: "ㄱ",
  t: "ㅅ",
  y: "ㅛ",
  u: "ㅕ",
  i: "ㅑ",
  o: "ㅐ",
  p: "ㅔ",
  a: "ㅁ",
  s: "ㄴ",
  d: "ㅇ",
  f: "ㄹ",
  g: "ㅎ",
  h: "ㅗ",
  j: "ㅓ",
  k: "ㅏ",
  l: "ㅣ",
  z: "ㅋ",
  x: "ㅌ",
  c: "ㅊ",
  v: "ㅍ",
  b: "ㅠ",
  n: "ㅜ",
  m: "ㅡ",
  Q: "ㅃ",
  W: "ㅉ",
  E: "ㄸ",
  R: "ㄲ",
  T: "ㅆ",
  O: "ㅒ",
  P: "ㅖ",
};

/** 글자 하나 → 자모 문자열(한글이 아니면 소문자 그대로) */
function charToJamo(ch: string): string {
  const code = ch.charCodeAt(0);
  if (code >= SYLLABLE_START && code <= SYLLABLE_END) {
    const index = code - SYLLABLE_START;
    return CHO[Math.floor(index / 588)] + JUNG[Math.floor((index % 588) / 28)] + JONG[index % 28];
  }
  return COMPOUND_JAMO[ch] ?? ch.toLowerCase();
}

/** 글자 하나의 초성(한글이 아니면 소문자 그대로) */
function charToChoseong(ch: string): string {
  const code = ch.charCodeAt(0);
  if (code >= SYLLABLE_START && code <= SYLLABLE_END) {
    return CHO[Math.floor((code - SYLLABLE_START) / 588)];
  }
  return ch.toLowerCase();
}

const CONSONANTS_ONLY = /^[ㄱ-ㅎ]+$/;
const LATIN_ONLY = /^[a-zA-Z]+$/;

/** 띄어쓰기를 빼고 비교한다. 원래 글에서 몇 번째 글자였는지 함께 둔다 */
function compactChars(text: string): { ch: string; at: number }[] {
  return [...text].flatMap((ch, at) => (/\s/.test(ch) ? [] : [{ ch, at }]));
}

export interface HangulMatch {
  /** 원래 글에서 맞은 곳(굵게 보일 곳) [start, end) */
  start: number;
  end: number;
  /** 클수록 위에: 앞에서 맞음 > 중간에서 맞음, 그대로 친 말 > 초성 > 영문 자판 */
  score: number;
}

/** 자모를 이어 붙인 것으로 글자 경계에서 시작해 맞는지 본다(치는 중인 마지막 글자 포함) */
function matchJamo(
  queryJamo: string,
  chars: { ch: string; at: number }[],
  toJamo: (ch: string) => string,
): { from: number; to: number } | null {
  const pieces = chars.map((c) => toJamo(c.ch));
  for (let i = 0; i < pieces.length; i += 1) {
    let rest = queryJamo;
    let j = i;
    while (rest && j < pieces.length) {
      const piece = pieces[j];
      if (rest.length >= piece.length) {
        if (!rest.startsWith(piece)) break;
        rest = rest.slice(piece.length);
      } else {
        if (!piece.startsWith(rest)) break;
        rest = "";
      }
      j += 1;
    }
    if (!rest) return { from: i, to: j };
  }
  return null;
}

/**
 * 검색어가 target에 맞는지와 맞은 곳. 맞지 않으면 null.
 * 예: ("렡", "레터링") · ("터링", "레터링") · ("ㄹㅌㄹ", "레터링") · ("fpxj", "레터링")
 */
export function matchHangul(query: string, target: string): HangulMatch | null {
  const q = query.replace(/\s+/g, "");
  if (!q) return null;
  const chars = compactChars(target);
  const toRange = (m: { from: number; to: number }, base: number): HangulMatch => ({
    start: chars[m.from].at,
    end: chars[m.to - 1].at + 1,
    score: base + (m.from === 0 ? 50 : 0) + (m.from === 0 && m.to === chars.length ? 5 : 0),
  });

  const direct = matchJamo([...q].map(charToJamo).join(""), chars, charToJamo);
  if (direct) return toRange(direct, 40);

  if (q.length >= 2 && CONSONANTS_ONLY.test(q)) {
    const cho = matchJamo(q, chars, charToChoseong);
    if (cho) return toRange(cho, 20);
  }

  if (LATIN_ONLY.test(q)) {
    const converted = [...q].map((ch) => QWERTY[ch] ?? QWERTY[ch.toLowerCase()] ?? ch).join("");
    const qwerty = matchJamo([...converted].map(charToJamo).join(""), chars, charToJamo);
    if (qwerty) return toRange(qwerty, 10);
  }
  return null;
}
