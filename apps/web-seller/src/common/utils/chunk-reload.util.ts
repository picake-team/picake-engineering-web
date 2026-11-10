/**
 * 화면 조각(lazy로 나눈 JS·CSS)을 못 받았을 때.
 * - 새 버전이 배포되면 Vercel은 옛 조각 파일을 주지 않아, 앱을 켜 둔 채 처음 여는 화면에서 실패한다.
 *   → 인터넷이 되면 한 번 새로고침해 새 버전으로 연다(10초 안에 또 실패하면 멈추고 오류 화면).
 * - 인터넷이 끊겨서 못 받았으면 새로고침하지 않는다(웹뷰 오류 화면이 뜨므로). 오류 화면이 연결되면 다시 연다.
 */

const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;

const RELOAD_AT_KEY = "picake-seller:chunk-reload-at";
const RELOAD_GUARD_MS = 10_000;

export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : undefined;
  return Boolean(message && CHUNK_ERROR.test(message));
}

/** 방금(10초 안) 이 이유로 새로고침했으면 또 하지 않는다(무한 새로고침 막기) */
export function shouldReloadForChunk(now: number, lastReloadAt: number | null, online: boolean) {
  if (!online) return false;
  return lastReloadAt === null || now - lastReloadAt >= RELOAD_GUARD_MS;
}

function readLastReloadAt(): number | null {
  try {
    const v = sessionStorage.getItem(RELOAD_AT_KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

/** 새로고침했으면 true */
export function reloadForChunkError(): boolean {
  const now = Date.now();
  if (!shouldReloadForChunk(now, readLastReloadAt(), navigator.onLine)) return false;
  try {
    sessionStorage.setItem(RELOAD_AT_KEY, String(now));
  } catch {
    // 저장이 막혀도 한 번은 새로고침
  }
  window.location.reload();
  return true;
}

/** main에서 한 번: Vite가 조각을 못 받으면 내는 이벤트 */
export function installChunkReload() {
  window.addEventListener("vite:preloadError", (event) => {
    if (reloadForChunkError()) event.preventDefault();
  });
}
