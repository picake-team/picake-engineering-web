"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { SearchBar } from "@/apps/web-user/common/components/search/SearchBar";
import { storeApi } from "@/apps/web-user/features/store/apis/store.api";
import { quoteLocalApi } from "@/apps/web-user/features/quote/apis/quote.api";
import type {
  QuoteAreaOption,
  QuotePlaceOption,
} from "@/apps/web-user/features/quote/types/quote.type";
import type { QuoteDraftStore } from "@/apps/web-user/features/quote/store/quote-draft.store";
import { distanceKm, formatKm } from "@/apps/web-user/features/quote/utils/quote-geo.util";

/** 동네 찾기: 동 이름으로 찾는다 */
export function AreaSearchSheet({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (area: QuoteAreaOption) => void;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<QuoteAreaOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setItems([]);
      setSearched(false);
    }
  }, [isOpen]);

  const search = async (term: string) => {
    const q = term.trim();
    setQuery(q);
    if (!q) return;
    setLoading(true);
    try {
      setItems(await quoteLocalApi.searchAreas(q));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="동네 찾기" fullScreen>
      <div className="px-[20px] pt-[12px]">
        <SearchBar placeholder="동 이름으로 찾기 (예: 연남동)" onSearch={search} />
        <ul className="mt-[12px]">
          {items.map((item) => (
            <li key={`${item.fullName}-${item.latitude}`}>
              <button
                type="button"
                className="w-full border-b border-gray-50 py-[14px] text-left"
                onClick={() => onSelect(item)}
              >
                <span className="block text-sm font-bold text-gray-900">{item.name}</span>
                <span className="block text-xs text-gray-500">{item.fullName}</span>
              </button>
            </li>
          ))}
        </ul>
        {loading && <p className="py-[24px] text-center text-sm text-gray-400">찾는 중…</p>}
        {!loading && searched && items.length === 0 && (
          <p className="py-[24px] text-center text-sm text-gray-500">
            &quot;{query}&quot; 동네를 찾지 못했어요. 동 이름으로 찾아 주세요.
          </p>
        )}
      </div>
    </BottomSheet>
  );
}

type StoreResult = QuoteDraftStore & { distanceText?: string };

/** 가게 찾기: Picake 가게와 지도의 입점 전 가게를 같은 검색으로 */
export function StoreSearchSheet({
  isOpen,
  onClose,
  onSelect,
  selectedKeys,
  near,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (store: QuoteDraftStore) => void;
  selectedKeys: string[];
  near: { latitude: number; longitude: number } | null;
}) {
  const [items, setItems] = useState<StoreResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setItems([]);
      setSearched(false);
    }
  }, [isOpen]);

  const search = async (term: string) => {
    const q = term.trim();
    if (!q) return;
    setLoading(true);
    try {
      const [picake, places] = await Promise.all([
        storeApi.getList({ page: 1, limit: 10, search: q }).catch(() => null),
        quoteLocalApi.searchPlaces(q, near ?? undefined).catch(() => [] as QuotePlaceOption[]),
      ]);
      const picakeItems: StoreResult[] = (picake?.data ?? []).map((s) => ({
        key: `store:${s.id}`,
        storeId: s.id,
        name: s.name,
        address: s.roadAddress || s.address,
        latitude: s.latitude,
        longitude: s.longitude,
        isPicakeStore: true,
        distanceText:
          near && s.latitude && s.longitude
            ? formatKm(distanceKm(near, { latitude: s.latitude, longitude: s.longitude }))
            : undefined,
      }));
      const placeItems: StoreResult[] = places.map((p) => ({
        key: `place:${p.kakaoPlaceId}`,
        kakaoPlaceId: p.kakaoPlaceId,
        name: p.name,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        phone: p.phone,
        placeUrl: p.placeUrl,
        isPicakeStore: false,
        distanceText: near ? formatKm(distanceKm(near, p)) : undefined,
      }));
      setItems([...picakeItems, ...placeItems]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="가게 찾기" fullScreen>
      <div className="px-[20px] pt-[12px]">
        <SearchBar placeholder="가게 이름으로 찾기" onSearch={search} />
        <ul className="mt-[12px]">
          {items.map((item) => {
            const added = selectedKeys.includes(item.key);
            return (
              <li key={item.key}>
                <button
                  type="button"
                  disabled={added}
                  className="flex w-full items-center justify-between gap-[12px] border-b border-gray-50 py-[14px] text-left disabled:opacity-50"
                  onClick={() => onSelect({ ...item, distanceText: undefined } as QuoteDraftStore)}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-[6px]">
                      <span className="truncate text-sm font-bold text-gray-900">{item.name}</span>
                      <StoreBadge isPicake={item.isPicakeStore} />
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                      {[item.distanceText, item.address].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-primary">
                    {added ? "넣었어요" : "넣기"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {loading && <p className="py-[24px] text-center text-sm text-gray-400">찾는 중…</p>}
        {!loading && searched && items.length === 0 && (
          <p className="py-[24px] text-center text-sm text-gray-500">
            가게를 찾지 못했어요. 이름을 다시 확인해 주세요.
          </p>
        )}
      </div>
    </BottomSheet>
  );
}

/** Picake(입점) / 미입점 표시 */
export function StoreBadge({ isPicake }: { isPicake: boolean }) {
  return isPicake ? (
    <span className="shrink-0 rounded-[4px] bg-primary-50 px-[5px] py-[1px] text-2xs font-bold text-primary">
      Picake
    </span>
  ) : (
    <span className="shrink-0 rounded-[4px] bg-gray-50 px-[5px] py-[1px] text-2xs font-bold text-gray-500">
      미입점
    </span>
  );
}
