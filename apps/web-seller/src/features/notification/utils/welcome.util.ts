/** 처음 사용 안내(SC-69)를 봤는지(이 휴대폰에서 한 번만). 저장이 막히면 매번 보지 않게 본 것으로 친다 */
const KEY = "picake.seller.welcomeSeen";

export function hasSeenWelcome(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

export function markWelcomeSeen() {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // 저장 못 해도 화면은 그대로
  }
}
