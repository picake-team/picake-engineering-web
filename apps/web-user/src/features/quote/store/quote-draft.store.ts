"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  QUOTE_DEFAULT_DISTANCE,
  QUOTE_DRAFT_STORAGE_KEY,
  type QuoteDistance,
} from "@/apps/web-user/features/quote/constants/quote.constant";
import type {
  QuoteAreaOption,
  QuoteCakeSize,
  QuoteCream,
  QuoteRequestEntry,
} from "@/apps/web-user/features/quote/types/quote.type";

/** 넣은 가게(화면 표시용 정보 포함) */
export interface QuoteDraftStore {
  key: string;
  storeId?: string;
  kakaoPlaceId?: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  placeUrl?: string;
  isPicakeStore: boolean;
}

/** 참고 사진: 로그인 전이라 서버에 올리기 전까지 줄인 사진(data URL)으로 둔다 */
export interface QuoteDraftPhoto {
  id: string;
  dataUrl: string;
}

export interface QuoteDraft {
  entry: QuoteRequestEntry | null;
  pickupDate: string | null;
  hourFrom: number | null;
  hourTo: number | null;
  onlyDesignatedStores: boolean;
  area: QuoteAreaOption | null;
  distance: QuoteDistance;
  stores: QuoteDraftStore[];
  photos: QuoteDraftPhoto[];
  description: string;
  requestNote: string;
  size: QuoteCakeSize | null;
  quantity: number;
  creams: QuoteCream[];
  flavorNote: string;
  budgetMin: number;
  budgetMax: number;
}

export const EMPTY_QUOTE_DRAFT: QuoteDraft = {
  entry: null,
  pickupDate: null,
  hourFrom: null,
  hourTo: null,
  onlyDesignatedStores: false,
  area: null,
  distance: QUOTE_DEFAULT_DISTANCE,
  stores: [],
  photos: [],
  description: "",
  requestNote: "",
  size: null,
  quantity: 1,
  creams: [],
  flavorNote: "",
  budgetMin: 30_000,
  budgetMax: 50_000,
};

interface QuoteDraftState {
  draft: QuoteDraft;
  step: number;
  /** 쓰기 시작했는지(이어 쓰기 묻기용) */
  started: boolean;
  update: (patch: Partial<QuoteDraft>) => void;
  setStep: (step: number) => void;
  start: (init?: Partial<QuoteDraft>) => void;
  reset: () => void;
}

/**
 * 쓰던 요청서. 로그인(카카오·구글·애플)이 다른 사이트를 다녀오므로 기기에 남긴다.
 * 사진이 커서 저장 공간이 모자라면 사진 없이 남긴다.
 */
export const useQuoteDraftStore = create<QuoteDraftState>()(
  persist(
    (set) => ({
      draft: EMPTY_QUOTE_DRAFT,
      step: 1,
      started: false,
      update: (patch) => set((s) => ({ draft: { ...s.draft, ...patch }, started: true })),
      setStep: (step) => set({ step }),
      start: (init) => set({ draft: { ...EMPTY_QUOTE_DRAFT, ...init }, step: 1, started: true }),
      reset: () => set({ draft: EMPTY_QUOTE_DRAFT, step: 1, started: false }),
    }),
    {
      name: QUOTE_DRAFT_STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (name) => window.localStorage.getItem(name),
        setItem: (name, value) => {
          try {
            window.localStorage.setItem(name, value);
          } catch {
            // 저장 공간이 모자라면 사진을 빼고 남긴다
            try {
              const parsed = JSON.parse(value);
              parsed.state.draft.photos = [];
              window.localStorage.setItem(name, JSON.stringify(parsed));
            } catch {
              /* 저장 못 해도 화면은 계속 쓴다 */
            }
          }
        },
        removeItem: (name) => window.localStorage.removeItem(name),
      })),
    },
  ),
);
