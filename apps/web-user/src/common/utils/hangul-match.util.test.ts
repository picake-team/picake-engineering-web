import { describe, expect, it } from "vitest";
import { matchHangul } from "@/apps/web-user/common/utils/hangul-match.util";

describe("matchHangul", () => {
  it("치는 중인 마지막 글자도 맞춘다(레 → 렡 → 레털 → 레터링)", () => {
    for (const typing of ["ㄹ", "레", "렡", "레터", "레털", "레터리", "레터링"]) {
      expect(matchHangul(typing, "레터링"), typing).not.toBeNull();
    }
    expect(matchHangul("렡", "레터링")).toMatchObject({ start: 0, end: 2 });
    expect(matchHangul("생이", "생일")).not.toBeNull();
  });

  it("글자 경계에서 시작하는 중간도 맞추고, 앞에서 맞으면 점수가 높다", () => {
    const middle = matchHangul("터링", "레터링");
    const front = matchHangul("레터", "레터링");
    expect(middle).toMatchObject({ start: 1, end: 3 });
    expect(front!.score).toBeGreaterThan(middle!.score);
  });

  it("띄어쓰기는 보지 않고, 굵게 할 곳은 원래 글 기준", () => {
    expect(matchHangul("생일레", "생일 레터링")).toMatchObject({ start: 0, end: 4 });
    expect(matchHangul("크 리스", "크리스마스")).not.toBeNull();
  });

  it("초성만 쳐도 맞춘다(두 글자부터)", () => {
    expect(matchHangul("ㄹㅌㄹ", "레터링")).toMatchObject({ start: 0, end: 3 });
    expect(matchHangul("ㅅㅇ", "생일")).not.toBeNull();
    expect(matchHangul("ㅋ", "하트")).toBeNull();
  });

  it("영문 자판으로 친 말도 맞춘다", () => {
    expect(matchHangul("fpxjfld", "레터링")).not.toBeNull();
    expect(matchHangul("todd", "생일")).not.toBeNull();
    expect(matchHangul("RhcRhc", "꽃")).toBeNull();
  });

  it("겹모음·겹받침을 나눠 비교한다", () => {
    expect(matchHangul("고", "과일")).not.toBeNull();
    expect(matchHangul("화", "화환")).not.toBeNull();
    expect(matchHangul("닭", "닭강정")).not.toBeNull();
    expect(matchHangul("달", "닭강정")).not.toBeNull();
  });

  it("맞지 않으면 null", () => {
    expect(matchHangul("케이", "레터링")).toBeNull();
    expect(matchHangul("", "레터링")).toBeNull();
    expect(matchHangul("ㅎㅌ", "레터링")).toBeNull();
  });
});
