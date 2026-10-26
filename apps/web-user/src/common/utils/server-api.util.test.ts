import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchConsumerApi, fetchConsumerApiResult } from "./server-api.util";

function mockFetchOnce(response: Partial<Response> | Error) {
  const fetchMock = vi.fn<(...args: unknown[]) => Promise<Response>>(async () => {
    if (response instanceof Error) throw response;
    return response as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchConsumerApiResult", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_DOMAIN", "https://api.example.com/");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("성공하면 data를 돌려준다", async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: "p1" } }),
    });

    await expect(fetchConsumerApiResult("/products/p1")).resolves.toEqual({
      status: "ok",
      data: { id: "p1" },
    });
    expect(fetchMock.mock.calls[0]).toEqual([
      "https://api.example.com/v1/consumer/products/p1",
      expect.objectContaining({ next: { revalidate: 3600 }, signal: expect.any(AbortSignal) }),
    ]);
  });

  it("revalidate 옵션을 fetch 캐시 시간으로 전달한다", async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: "p1" } }),
    });

    await fetchConsumerApiResult("/products/p1", { revalidate: 300 });

    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({ next: { revalidate: 300 } }),
    );
  });

  it("404는 없는 리소스(not_found)로 구분한다", async () => {
    mockFetchOnce({ ok: false, status: 404 });

    await expect(fetchConsumerApiResult("/products/x")).resolves.toEqual({ status: "not_found" });
  });

  it("5xx는 일시 오류(error)로 구분한다", async () => {
    mockFetchOnce({ ok: false, status: 503 });

    await expect(fetchConsumerApiResult("/products/x")).resolves.toEqual({ status: "error" });
  });

  it("시간 초과·네트워크 예외는 일시 오류(error)로 구분한다", async () => {
    mockFetchOnce(new DOMException("timeout", "TimeoutError"));

    await expect(fetchConsumerApiResult("/products/x")).resolves.toEqual({ status: "error" });
  });

  it("응답에 data가 없으면 오류로 본다", async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({}) });

    await expect(fetchConsumerApiResult("/products/x")).resolves.toEqual({ status: "error" });
  });

  it("API 주소가 설정돼 있지 않으면 호출하지 않고 오류로 본다", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_DOMAIN", "");
    const fetchMock = mockFetchOnce({ ok: true, status: 200 });

    await expect(fetchConsumerApiResult("/products/x")).resolves.toEqual({ status: "error" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("fetchConsumerApi", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_DOMAIN", "https://api.example.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("성공이 아니면 null을 돌려준다", async () => {
    mockFetchOnce({ ok: false, status: 404 });

    await expect(fetchConsumerApi("/products/x")).resolves.toBeNull();
  });

  it("성공하면 data를 그대로 돌려준다", async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({ data: [1, 2] }) });

    await expect(fetchConsumerApi("/products")).resolves.toEqual([1, 2]);
  });
});
