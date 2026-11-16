"use client";

import { useCallback, useEffect, useState } from "react";

/** 최근 검색어: 이 기기에만 남긴다(서버에 보내지 않음). 검색 화면과 지도 검색이 같은 목록을 쓴다 */
const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT = 10;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

function write(items: string[]) {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items));
  } catch {
    // 저장소를 막은 기기에서는 남기지 않는다
  }
}

export function useRecentSearches() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    setItems(read());
  }, []);

  /** 같은 말을 다시 찾으면 맨 앞으로 */
  const add = useCallback((term: string) => {
    const next = [term, ...read().filter((t) => t !== term)].slice(0, MAX_RECENT);
    write(next);
    setItems(next);
  }, []);

  const remove = useCallback((term: string) => {
    const next = read().filter((t) => t !== term);
    write(next);
    setItems(next);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setItems([]);
  }, []);

  return { items, add, remove, clear };
}
