import { REGION_COORDINATES } from "@/apps/web-user/common/constants/region-coordinates.constant";
import { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";

/** 지도 기본 중심 (현재위치 없을 때, 강남구) */
export const DEFAULT_MAP_CENTER = REGION_COORDINATES["서울"]?.["강남구"] ?? {
  lat: 37.5172,
  lng: 127.0473,
};

/** 목록 패널 핸들 높이(px) */
export const LIST_SHEET_HANDLE_HEIGHT = 32;

/** 하단 네비 영역 높이(px) - 패널이 채우는 최대 높이 계산용 */
export const LIST_SHEET_BOTTOM_NAV_HEIGHT = 60;

/** 지도 스토어 선택 카드 — 하단 네비 위 여백(px) */
export const MAP_STORE_CARD_BOTTOM_GAP = 28;

/** 스토어 선택 시 카드 bottom (목록 시트 핸들 숨김 상태) */
export const MAP_SELECTED_STORE_CARD_BOTTOM =
  LIST_SHEET_BOTTOM_NAV_HEIGHT + MAP_STORE_CARD_BOTTOM_GAP;

/** 목록 패널 중간단계: 화면 높이 대비 비율 (0.45 = 45vh) */
export const LIST_SHEET_OPEN_RATIO = 0.45;

/**
 * 목록 시트 스냅 높이 계산용 레이아웃 높이(px).
 * 웹뷰·모바일에서 innerHeight가 일시적으로 작게 잡히는 경우를 줄이기 위해
 * visualViewport와 innerHeight 중 큰 값을 사용합니다.
 */
export function getMapLayoutViewportHeight(): number {
  if (typeof window === "undefined") return 800;
  const inner = window.innerHeight;
  const client = document.documentElement.clientHeight;
  const vv = window.visualViewport;
  const visual = vv?.height ?? 0;
  /** iOS 웹뷰: offsetTop 포함 시 실제 가시 영역에 가깝다 */
  const visualWithChrome = vv && visual > 0 ? Math.round(visual + vv.offsetTop) : 0;
  return Math.round(Math.max(inner, visual, visualWithChrome, client));
}

/** 드래그 직전 등 짧은 구간에서 여러 번 읽어 최대값 사용 (웹뷰 뷰포트 지연 보정) */
export function measureMapLayoutViewportHeightSync(): number {
  if (typeof window === "undefined") return 800;
  let max = 400;
  for (let i = 0; i < 4; i += 1) {
    max = Math.max(max, getMapLayoutViewportHeight());
  }
  return max;
}

/** 시트 오픈 직전 레이아웃 높이 — 여러 프레임 샘플 중 최대값 (웹뷰 검색 진입 등) */
export function sampleMapLayoutViewportHeight(): Promise<number> {
  if (typeof window === "undefined") return Promise.resolve(800);

  return new Promise((resolve) => {
    const heights: number[] = [];
    const push = () => heights.push(getMapLayoutViewportHeight());

    push();
    requestAnimationFrame(() => {
      push();
      requestAnimationFrame(() => {
        push();
        resolve(Math.max(...heights, 400));
      });
    });
  });
}

/**
 * 지도 타일 프리로드 버퍼(px).
 * 카카오 지도 SDK는 컨테이너 크기만큼만 타일을 로드해 드래그 시 가장자리에
 * 회색/흰색 영역이 잠깐 보인다. 컨테이너를 뷰포트보다 상하좌우 이 값만큼 크게 만들어
 * 화면 밖 타일을 미리 로드한다. (값이 클수록 부드럽지만 타일 다운로드량 증가)
 */
export const MAP_TILE_PRELOAD_BUFFER_PX = 250;

/**
 * 지도 bounds 패딩(px) - 검색 결과 전체가 보이도록 할 때.
 * 컨테이너가 뷰포트보다 MAP_TILE_PRELOAD_BUFFER_PX씩 크므로 그만큼 보정한다.
 */
export const MAP_BOUNDS_PADDING = 80 + MAP_TILE_PRELOAD_BUFFER_PX;

/** 지도 목록 필터 모달 루트 id (포털·시트 제스처 충돌 방지용) */
export const MAP_STORE_LIST_FILTER_MODAL_ID = "map-store-list-filter-modal";

/** 지도 마커 라벨(스토어명·미입점·영업 상태) 공통 흰색 외곽선 */
export const MAP_MARKER_LABEL_TEXT_SHADOW =
  "-1px 0px #fff, 0px 1px #fff, 1px 0px #fff, 0px -1px #fff";

/** 카카오 키워드 검색 시 사용하는 키워드 (미입점 마커) */
export const KAKAO_PLACES_KEYWORD = "주문제작 케이크";

/** 지도 idle(이동·줌 종료) 후 마커 갱신까지의 디바운스(ms) — 연속 드래그 시 중복 작업 방지 */
export const MAP_IDLE_DEBOUNCE_MS = 200;

/**
 * 미입점(카카오 검색)을 지도 칸보다 사방으로 이 비율(칸 너비·높이 기준)만큼 넓게 검색해 기억해 둔다.
 * 카카오 지도는 칸 밖 마커를 스스로 숨기고(display: none) 손을 뗀 뒤에야 다시 계산하므로 마커는 칸 안만 그린다.
 * 대신 근처로 옮기면 검색을 기다리지 않고 기억해 둔 장소를 바로 그린다.
 */
export const MAP_UNENTERED_SEARCH_PAD_RATIO = 0.25;

/**
 * 카카오 키워드 재검색 최소 이동 비율.
 * 같은 줌 레벨에서 지도 중심이 화면 span의 이 비율 미만으로 움직였으면 미입점 재검색을 생략합니다.
 * 검색을 MAP_UNENTERED_SEARCH_PAD_RATIO만큼 넓게 하므로, 그 안에서 움직이는 동안은 다시 검색하지 않아도 됩니다.
 */
export const MAP_KEYWORD_SEARCH_MIN_MOVE_RATIO = 0.25;

/** 미입점 검색 결과를 몇 쪽(한 쪽 15곳)까지 받을지 — 넓힌 범위에서도 화면 안이 비지 않게 */
export const MAP_UNENTERED_SEARCH_PAGES = 2;

/**
 * 미입점 마커를 한 번에 그리는 최대 수(지도 가운데에서 가까운 순).
 * 예전(검색 1쪽 15곳, 화면 안 14곳쯤)과 비슷한 밀도로 두어 입점 가게가 묻히지 않게 한다.
 */
export const MAP_UNENTERED_MAX_MARKERS = 20;

/** 미입점 검색 결과를 기억해 두는 최대 수 — 지나온 곳으로 돌아가면 검색을 기다리지 않고 바로 그린다 */
export const MAP_UNENTERED_CACHE_MAX = 300;

/** 지도 목록 필터: 사이즈 옵션 (백엔드 CakeSizeDisplayName 표시명과 동일) */
export const MAP_LIST_SIZE_OPTIONS: string[] = ["도시락", "미니", "1호", "2호", "3호"];

/**
 * 유형 옵션 (API ProductCategoryType 값, 라벨). 검색·지도 필터 "유형"과 홈 카테고리가 같이 쓴다.
 * 사장님이 상품에 직접 고르는 10개만 둔다. "커스텀"(LETTERING)은 상품 종류(기본·커스텀 케이크)를 따라
 * 서버가 저절로 붙이는 값이라 빼고, 기본·커스텀은 가게 상세의 탭으로 나눠 본다.
 */
export const MAP_LIST_CATEGORY_OPTIONS: { value: ProductCategoryType; label: string }[] = [
  { value: ProductCategoryType.BIRTHDAY, label: "생일" },
  { value: ProductCategoryType.LOVER, label: "연인" },
  { value: ProductCategoryType.FRIEND, label: "친구" },
  { value: ProductCategoryType.FAMILY, label: "가족" },
  { value: ProductCategoryType.ANNIVERSARY, label: "기념일" },
  { value: ProductCategoryType.SAME_DAY_PICKUP, label: "당일픽업" },
  { value: ProductCategoryType.CHARACTER, label: "캐릭터" },
  { value: ProductCategoryType.SIMPLE, label: "심플" },
  { value: ProductCategoryType.FLOWER, label: "꽃" },
  { value: ProductCategoryType.PHOTO, label: "사진" },
];
