"use client";

import { useCallback, useSyncExternalStore } from "react";

/** 최근 검색어: 이 기기에만 남긴다(서버에 보내지 않음). 검색 화면과 지도 검색이 같은 목록을 쓴다 */
const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT = 10;
const CHANGE_EVENT = "picake:recent-searches";
const EMPTY: string[] = [];

function readRaw(): string | null {
  try {
    return localStorage.getItem(RECENT_SEARCHES_KEY);
  } catch {
    return null;
  }
}

/** 같은 저장값이면 같은 배열을 돌려준다(useSyncExternalStore가 매번 다시 그리지 않게) */
let cache: { raw: string | null; items: string[] } = { raw: null, items: EMPTY };
function getSnapshot(): string[] {
  const raw = readRaw();
  if (raw === cache.raw) return cache.items;
  let items = EMPTY;
  try {
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed)) items = parsed.filter((t): t is string => typeof t === "string");
  } catch {
    // 깨진 값은 빈 목록으로 본다
  }
  cache = { raw, items };
  return items;
}

const getServerSnapshot = () => EMPTY;

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function write(items: string[]) {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items));
  } catch {
    // 저장소를 막은 기기에서는 남기지 않는다
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** 첫 그림부터 저장된 목록으로 그린다(빈 목록을 그렸다가 칩이 끼어들며 아래가 밀리지 않게) */
export function useRecentSearches() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /** 같은 말을 다시 찾으면 맨 앞으로 */
  const add = useCallback((term: string) => {
    write([term, ...getSnapshot().filter((t) => t !== term)].slice(0, MAX_RECENT));
  }, []);

  const remove = useCallback((term: string) => {
    write(getSnapshot().filter((t) => t !== term));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { items, add, remove, clear };
}
