import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";

/** 글자 복사(휴대폰 앱 안 화면에서 clipboard API가 막히면 예전 방식으로) */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 아래 예전 방식으로
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

/** 복사하고 결과를 안내 띠로. doneMessage 예: "입금자명을 복사했어요" */
export async function copyWithToast(text: string, doneMessage: string) {
  const ok = await copyText(text);
  useAlertStore.getState().addAlert({
    severity: ok ? "success" : "error",
    message: ok ? doneMessage : "복사하지 못했어요. 길게 눌러 복사해 주세요",
    autoHideDuration: 2500,
  });
}
