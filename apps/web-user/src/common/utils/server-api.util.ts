const CONSUMER_API_PREFIX = "/v1/consumer";

/** 서버 fetch 제한 시간. 백엔드가 응답하지 않아도 서버 렌더링이 무한정 기다리지 않게 한다 */
const SERVER_API_TIMEOUT_MS = 3000;

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
    const response = await fetch(`${origin}${CONSUMER_API_PREFIX}${path}`, {
      next: { revalidate: options?.revalidate ?? 3600 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(SERVER_API_TIMEOUT_MS),
    });

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
