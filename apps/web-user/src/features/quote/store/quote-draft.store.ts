"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  QUOTE_DEFAULT_DISTANCE,
  QUOTE_DRAFT_STORAGE_KEY,
  type QuoteDistance,
} from "@/apps/web-user/features/quote/constants/quote.constant";
import type { DesignPart } from "@/apps/web-user/features/design/types/design.type";
import {
  applyDesignFill,
  buildDesignFill,
  revertDesignFill,
  type FillSource,
  type QuoteAutoFill,
} from "@/apps/web-user/features/design/utils/design-fill.util";
import { getDesign } from "@/apps/web-user/features/design/utils/design.util";
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

/** 손님 사진을 AI가 읽은 상태(기획 I-112 ⑥) */
export type PhotoReadState = "reading" | "done" | "failed" | "limit" | "off";

/**
 * 참고 사진: 로그인 전이라 서버에 올리기 전까지 줄인 사진(data URL)으로 둔다.
 * 디자인 모음 사진은 파일 대신 디자인 번호와 사진 주소(/images/designs/…)로 기억한다(저장 공간이 모자라도 남게).
 */
export interface QuoteDraftPhoto {
  id: string;
  dataUrl: string;
  designId?: string;
  /** 이 사진에서 가져올 것(없으면 전체) */
  parts?: DesignPart[];
  /** 손님 사진을 AI가 읽은 값 */
  read?: FillSource | null;
  readState?: PhotoReadState;
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
  /** 사진 보고 마지막으로 채운 값(✦ 표시·되돌리기) */
  autoFill?: QuoteAutoFill;
  /** 되돌리기를 눌렀으면 사진이 바뀔 때까지 다시 채우지 않는다 */
  autoFillDismissed?: boolean;
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
  /** 사진을 바꾸고(넣기·빼기·가져올 것·읽은 값) 그에 맞춰 칸을 다시 채운다 */
  setPhotos: (photos: QuoteDraftPhoto[]) => void;
  /** 사진 보고 채운 칸 되돌리기 */
  revertAutoFill: () => void;
  /** AI가 읽은 결과·읽는 상태만 바꾼다(되돌리기를 누른 뒤면 다시 채우지 않는다) */
  updatePhotoRead: (id: string, patch: Pick<QuoteDraftPhoto, "read" | "readState">) => void;
}

/** 사진들로 칸을 채운 결과(손님이 고친 칸은 그대로) */
export function withAutoFill(draft: QuoteDraft): QuoteDraft {
  if (draft.autoFillDismissed) return draft;
  const next = buildDesignFill(
    draft.photos.map((p) => ({
      design: p.designId ? getDesign(p.designId) : (p.read ?? null),
      parts: p.parts ?? ["ALL"],
    })),
  );
  const { patch, auto } = applyDesignFill(draft, draft.autoFill, next);
  return { ...draft, ...patch, autoFill: auto };
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
      start: (init) =>
        set({ draft: withAutoFill({ ...EMPTY_QUOTE_DRAFT, ...init }), step: 1, started: true }),
      reset: () => set({ draft: EMPTY_QUOTE_DRAFT, step: 1, started: false }),
      setPhotos: (photos) =>
        set((s) => ({
          draft: withAutoFill({
            ...s.draft,
            photos,
            autoFillDismissed: false,
          }),
          started: true,
        })),
      updatePhotoRead: (id, patch) =>
        set((s) => ({
          draft: withAutoFill({
            ...s.draft,
            photos: s.draft.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          }),
        })),
      revertAutoFill: () =>
        set((s) => ({
          draft: {
            ...s.draft,
            ...revertDesignFill(s.draft, s.draft.autoFill),
            autoFill: {},
            autoFillDismissed: true,
          },
        })),
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
              // 디자인 모음 사진은 주소만이라 남긴다
              parsed.state.draft.photos = (parsed.state.draft.photos ?? []).filter(
                (p: QuoteDraftPhoto) => p.designId,
              );
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
