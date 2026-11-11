import type { OrderItem } from "@/apps/web-user/features/product/components/sections/reservation-bottom-sheet/types";

/**
 * 로그인 전에 예약 창에서 고른 내용(I-59 A "고른 다음에 로그인").
 * 카카오·구글·애플 로그인은 다른 사이트를 다녀오므로 기기(IndexedDB)에 잠깐 둔다.
 * 사진(File)도 그대로 담을 수 있어 로그인하고 돌아온 뒤 주문할 때 올린다.
 */
export interface ReservationDraft {
  productId: string;
  /** 고를 때 본 상품 옵션 버전. 그사이 사장님이 옵션을 바꿨으면 이어 쓰지 않는다 */
  optionsVersion: number;
  savedAt: number;
  /** 픽업 일시 ISO */
  selectedDate: string | null;
  orderItems: OrderItem[];
  reserverName: string;
  reserverPhone: string;
  agreements: { payment: boolean; refund: boolean; optionChange: boolean };
}

/** 로그인을 다녀오는 데 충분한 시간. 지나면 버린다(나중에 우연히 다시 열리지 않게) */
export const RESERVATION_DRAFT_TTL_MS = 30 * 60 * 1000;

const DB_NAME = "picake-reservation-draft";
const STORE = "drafts";

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) return resolve(null);
    try {
      const req = window.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise((resolve) => {
        if (!db) return resolve(null);
        try {
          const tx = db.transaction(STORE, mode);
          const req = fn(tx.objectStore(STORE));
          req.onsuccess = () => resolve(req.result ?? null);
          req.onerror = () => resolve(null);
          tx.oncomplete = () => db.close();
        } catch {
          db.close();
          resolve(null);
        }
      }),
  );
}

/**
 * 사진은 내용(바이트)을 복사해 둔다. File을 그대로 넣으면 브라우저에 따라 원본 파일을 가리키기만 해서
 * 로그인하고 돌아왔을 때 읽지 못하는 일이 있다(로컬 확인에서 미리보기가 깨짐).
 */
interface StoredFile {
  name: string;
  type: string;
  lastModified: number;
  data: ArrayBuffer;
}

type StoredDraft = Omit<ReservationDraft, "orderItems"> & {
  orderItems: (Omit<OrderItem, "selections"> & {
    selections: Record<
      string,
      Omit<OrderItem["selections"][string], "imageFiles"> & { imageFiles?: StoredFile[] }
    >;
  })[];
};

async function toStored(draft: ReservationDraft): Promise<StoredDraft> {
  const orderItems = await Promise.all(
    draft.orderItems.map(async (item) => {
      const entries = await Promise.all(
        Object.entries(item.selections).map(async ([id, sel]) => {
          const imageFiles = sel.imageFiles
            ? await Promise.all(
                sel.imageFiles.map(async (f) => ({
                  name: f.name,
                  type: f.type,
                  lastModified: f.lastModified,
                  data: await f.arrayBuffer(),
                })),
              )
            : undefined;
          return [id, { ...sel, imageFiles }] as const;
        }),
      );
      return { ...item, selections: Object.fromEntries(entries) };
    }),
  );
  return { ...draft, orderItems };
}

function fromStored(stored: StoredDraft): ReservationDraft {
  return {
    ...stored,
    orderItems: stored.orderItems.map((item) => ({
      ...item,
      selections: Object.fromEntries(
        Object.entries(item.selections).map(([id, sel]) => [
          id,
          {
            ...sel,
            imageFiles: sel.imageFiles?.map(
              (f) => new File([f.data], f.name, { type: f.type, lastModified: f.lastModified }),
            ),
          },
        ]),
      ),
    })),
  };
}

/** 저장. 사생활 보호 모드 등으로 저장하지 못하면 false(로그인은 그대로 이어 간다) */
export async function saveReservationDraft(draft: ReservationDraft): Promise<boolean> {
  try {
    const stored = await toStored(draft);
    const result = await run("readwrite", (store) => store.put(stored, draft.productId));
    return result !== null;
  } catch {
    return false;
  }
}

/** 꺼내면서 지운다. 없거나 오래됐으면 null */
export async function takeReservationDraft(productId: string): Promise<ReservationDraft | null> {
  const stored = (await run("readonly", (store) => store.get(productId))) as StoredDraft | null;
  if (!stored) return null;
  await run("readwrite", (store) => store.delete(productId));
  if (Date.now() - stored.savedAt > RESERVATION_DRAFT_TTL_MS) return null;
  try {
    return fromStored(stored);
  } catch {
    return null;
  }
}
