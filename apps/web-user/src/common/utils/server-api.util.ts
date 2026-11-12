const CONSUMER_API_PREFIX = "/v1/consumer";

/** 서버 fetch 제한 시간. 백엔드가 응답하지 않아도 서버 렌더링이 무한정 기다리지 않게 한다 */
const SERVER_API_TIMEOUT_MS = 3000;

/**
 * 다시 해 볼 만한 연결 끊김. 서버가 쉬던 연결(keep-alive)을 닫는 순간 그 연결을 다시 쓰면
 * "fetch failed · other side closed"가 난다(Vercel 운영 오류 7일 20번·4명, 상품·가게 화면, 2026-11-12 확인).
 * 시간 초과(AbortSignal)는 다시 하지 않는다 — 기다림만 길어진다
 */
const STALE_CONNECTION_CODES = new Set([
  "UND_ERR_SOCKET",
  "UND_ERR_CLOSED",
  "ECONNRESET",
  "EPIPE",
  "ETIMEDOUT",
]);

export function isStaleConnectionError(error: unknown): boolean {
  if (!(error instanceof TypeError)) return false;
  const code = (error as { cause?: { code?: unknown } }).cause?.code;
  return typeof code === "string" && STALE_CONNECTION_CODES.has(code);
}

/** metadata 등 서버 전용 API fetch (axios/Zustand 미사용) */
export function getConsumerApiOrigin(): string | null {
  const domain = process.env.NEXT_PUBLIC_API_DOMAIN;
  if (!domain) return null;
  return domain.replace(/\/$/, "");
}

/**
 * 서버 API 호출 결과
 * - not_found: 백엔드가 404로 응답 (없는 리소스)
 * - error: 시간 초과·네트워크·5xx 등 일시적 실패 — "없는 리소스"와 구분해서 다뤄야 한다
 */
export type ServerApiResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_found" }
  | { status: "error" };

export async function fetchConsumerApiResult<T>(
  path: string,
  options?: { revalidate?: number },
): Promise<ServerApiResult<T>> {
  const origin = getConsumerApiOrigin();
  if (!origin) return { status: "error" };

  try {
    const url = `${origin}${CONSUMER_API_PREFIX}${path}`;
    const init = {
      next: { revalidate: options?.revalidate ?? 3600 },
      headers: { Accept: "application/json" },
      // 다시 해 볼 때도 처음 3초 안에서(서버 렌더링이 오래 멈추지 않게)
      signal: AbortSignal.timeout(SERVER_API_TIMEOUT_MS),
    };
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (error) {
      // 읽기(GET)라 한 번 더 해도 안전하다. 끊긴 연결은 버려지고 새 연결로 간다
      if (!isStaleConnectionError(error)) throw error;
      response = await fetch(url, init);
    }

    if (response.status === 404) return { status: "not_found" };
    if (!response.ok) return { status: "error" };

    const body = (await response.json()) as { data?: T };
    return body.data == null ? { status: "error" } : { status: "ok", data: body.data };
  } catch {
    return { status: "error" };
  }
}

/** 결과 구분이 필요 없을 때(목록 수집 등) 쓰는 단순 버전: 성공이 아니면 null */
export async function fetchConsumerApi<T>(
  path: string,
  options?: { revalidate?: number },
): Promise<T | null> {
  const result = await fetchConsumerApiResult<T>(path, options);
  return result.status === "ok" ? result.data : null;
}
