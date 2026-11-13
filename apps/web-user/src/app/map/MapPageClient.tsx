"use client";

/**
 * 지도 페이지
 * - 플랫폼 입점 스토어: API 전체 조회 후 현재 지도 범위 내 마커 표시
 * - URL ?q= 검색 시: 스토어 검색 API로 결과 표시 + 목록 패널 자동 오픈
 * - 카카오 키워드 검색: 주변 미입점 마커 (플랫폼과 겹치면 제외)
 * - 현재위치: 있으면 중심, 없으면 강남구 / 버튼으로 재요청
 * - 픽업 날짜·구간(하루종일/오전/오후) 필터: 영업 캘린더 기준으로 마커·목록·라벨 반영
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { BottomNav } from "@/apps/web-user/common/components/navigation/BottomNav";
import { useUserLocation } from "@/apps/web-user/common/hooks/useUserLocation";
import { Icon } from "@/apps/web-user/common/components/icons";
import { storeApi } from "@/apps/web-user/features/store/apis/store.api";
import type { StoreInfo, StoreListFilter } from "@/apps/web-user/features/store/types/store.type";
import { MapStoreCard } from "@/apps/web-user/features/store/components/map/MapStoreCard";
import {
  MapUnenteredStoreCard,
  type MapUnenteredStore,
} from "@/apps/web-user/features/store/components/map/MapUnenteredStoreCard";
import { MapStoreListSection } from "@/apps/web-user/features/store/components/map/MapStoreListSection";
import { MapTopSearchBar } from "@/apps/web-user/features/store/components/map/MapTopSearchBar";
import { MapPickupDateBottomSheet } from "@/apps/web-user/features/store/components/map/MapPickupDateBottomSheet";
import { MapListSheetPanel } from "@/apps/web-user/features/store/components/map/MapListSheetPanel";
import { useMapListSheet } from "@/apps/web-user/features/store/hooks/useMapListSheet";
import { useMapPlatformStores } from "@/apps/web-user/features/store/hooks/queries/useMapPlatformStores";
import {
  DEFAULT_MAP_CENTER,
  MAP_BOUNDS_PADDING,
  KAKAO_PLACES_KEYWORD,
  MAP_MARKER_LABEL_TEXT_SHADOW,
  MAP_SELECTED_STORE_CARD_BOTTOM,
  MAP_IDLE_DEBOUNCE_MS,
  MAP_KEYWORD_SEARCH_MIN_MOVE_RATIO,
  MAP_TILE_PRELOAD_BUFFER_PX,
  MAP_UNENTERED_SEARCH_PAD_RATIO,
  MAP_UNENTERED_SEARCH_PAGES,
  MAP_UNENTERED_MAX_MARKERS,
  MAP_UNENTERED_CACHE_MAX,
} from "@/apps/web-user/features/store/constants/map.constant";
import {
  escapeHtmlForOverlay,
  getPositionKey,
  isStoreNameSimilar,
  getStoresInMapBounds,
  getStoresInBox,
  getMapBox,
  pickNearestInBox,
  type MapBox,
  filterStoresWithCoordinates,
  mapPickupFilterToOverlayInstant,
  mapPickupFilterToStoreListQuery,
  buildMapPlatformStoreStatusOverlayHtml,
  shouldUseDimPlatformMapMarker,
  buildMapPageUrl,
  buildMapSearchUrl,
  buildMapSearchUrlWithOptionalQuery,
  parseMapPickupFilterFromUrlSearchParams,
  MAP_PICKUP_URL_DATE_KEY,
  MAP_PICKUP_URL_PERIOD_KEY,
  type MapListSortBy,
  type MapPickupFilter,
} from "@/apps/web-user/features/store/utils/map.util";
import {
  isStoreOpenOnSeoulCalendarDay,
  storeCalendarOverlapsMapPickupHalfDay,
} from "@/apps/web-user/features/store/utils/store-business-calendar.util";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import type { MapAreaSearchTrigger } from "@/apps/web-user/common/types/analytics.type";

declare global {
  interface Window {
    kakao: any;
  }
}

export default function MapPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q")?.trim() || null;
  const kakaoJavascriptKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
  const { location: userLocation, refresh: refreshUserLocation } = useUserLocation();

  const [kakaoLoaded, setKakaoLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreInfo | null>(null);
  const [selectedUnenteredStore, setSelectedUnenteredStore] = useState<MapUnenteredStore | null>(
    null,
  );
  const [listSortBy, setListSortBy] = useState<MapListSortBy>("distance");
  const [listFilter, setListFilter] = useState<StoreListFilter>({});
  const [pickupFilter, setPickupFilter] = useState<MapPickupFilter | null>(null);
  const [pickupCalendarOpen, setPickupCalendarOpen] = useState(false);
  const [mapListFilterPanelOpen, setMapListFilterPanelOpen] = useState(false);

  // 지도 화면 노출
  useEffect(() => {
    trackEvent("view_map");
  }, []);

  // 마지막 지도 이동 트리거 (드래그/줌/현재위치) — success_map_area_search용
  const lastMapGestureRef = useRef<MapAreaSearchTrigger | null>(null);
  // 필터 적용 직후 다음 스토어 개수 갱신을 success_filter_apply로 처리하기 위한 플래그
  const pendingFilterApplyRef = useRef(false);
  // view_map_search_result 중복 발화 방지
  const lastViewedMapSearchKeyRef = useRef<string | null>(null);

  /** URL에 픽업이 있으면 상태에 반영 (검색 페이지 등에서 돌아올 때) */
  useEffect(() => {
    const hasPickupInUrl =
      searchParams.has(MAP_PICKUP_URL_DATE_KEY) && searchParams.has(MAP_PICKUP_URL_PERIOD_KEY);
    if (!hasPickupInUrl) return;
    const parsed = parseMapPickupFilterFromUrlSearchParams(searchParams);
    setPickupFilter(parsed);
  }, [searchParams]);

  /** 픽업/검색어와 URL을 맞춤 */
  const applyPickupToUrl = useCallback(
    (next: MapPickupFilter | null) => {
      router.replace(buildMapPageUrl(searchQuery, next));
    },
    [router, searchQuery],
  );

  const handlePickupConfirm = useCallback(
    (f: MapPickupFilter) => {
      trackEvent("success_pickup_date_select", {
        selected_date: f.date.toISOString(),
        selected_time_slot: f.kind,
      });
      setPickupFilter(f);
      applyPickupToUrl(f);
    },
    [applyPickupToUrl],
  );

  const handlePickupClear = useCallback(() => {
    setPickupFilter(null);
    applyPickupToUrl(null);
  }, [applyPickupToUrl]);

  // ---- Refs: 지도·마커 ----
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const placesServiceRef = useRef<any | null>(null);
  /** 카카오 키워드 검색(미입점) 마커·오버레이 — place id 기준으로 재사용(diff)해 재검색마다 전체 재생성하지 않음 */
  const kakaoMarkerEntriesRef = useRef<Map<string, { marker: any; overlay: any }>>(new Map());
  const isUserInteractingRef = useRef(false); // 드래그·줌 제스처 진행 중 여부 (제스처 중 DOM 갱신 보류용)
  /** 미입점 검색 결과 기억(place id → 장소, 오래된 것부터 지움). 지나온 곳으로 돌아가면 검색을 기다리지 않고 바로 그린다 */
  const kakaoPlacesCacheRef = useRef<Map<string, any>>(new Map());
  const keywordSearchSeqRef = useRef(0); // 마지막 미입점 검색 번호 — 늦게 온 이전 검색 결과·다음 쪽 요청을 버린다
  /** 플랫폼 입점 스토어 마커·오버레이 — storeId 기준으로 재사용(diff)해 idle마다 전체 재생성하지 않음 */
  const platformMarkerEntriesRef = useRef<
    Map<string, { marker: any; overlay: any; dim: boolean; overlayHtml: string; store: StoreInfo }>
  >(new Map());
  const platformStoresRef = useRef<StoreInfo[]>([]); // API 전체 스토어 캐시
  const searchStoresRef = useRef<StoreInfo[] | null>(null); // null=검색아님, []=검색결과0개, [...]=검색결과
  const markerImageRef = useRef<any | null>(null);
  const focusedMarkerImageRef = useRef<any | null>(null);
  const openedMarkerImageRef = useRef<any | null>(null);
  const openedFocusedMarkerImageRef = useRef<any | null>(null);
  const openedDimMarkerImageRef = useRef<any | null>(null);
  const openedDimFocusedMarkerImageRef = useRef<any | null>(null);
  const selectedMarkerRef = useRef<any | null>(null);
  const lastKeywordSearchRef = useRef<{ lat: number; lng: number; level: number } | null>(null); // 마지막 카카오 키워드 검색 시점의 중심·줌
  const idleDebounceTimerRef = useRef<number | null>(null); // idle 마커 갱신 디바운스 타이머
  const isCenteringFromClickRef = useRef(false); // 마커 클릭으로 panTo 한 직후 idle에서 재처리 방지
  const usedUserLocationForCenterRef = useRef(false); // 이미 현재위치로 중심 잡았는지
  const userLocationMarkerRef = useRef<any | null>(null); // 현재위치(파란 점) 마커
  const userLocationMarkerImageRef = useRef<any | null>(null); // 현재위치 마커 이미지(1회 생성 후 재사용)
  const userLocationRef = useRef<{ latitude: number; longitude: number } | null>(null); // load 콜백에서 최신 위치 참조용
  const searchQueryRef = useRef<string | null>(searchQuery);
  const pickupFilterRef = useRef<MapPickupFilter | null>(pickupFilter);
  searchQueryRef.current = searchQuery;
  pickupFilterRef.current = pickupFilter;

  /**
   * 화면에 실제로 보이는 지도 범위. 지도 칸은 타일을 미리 받으려고 화면보다 사방 MAP_TILE_PRELOAD_BUFFER_PX씩 커서
   * map.getBounds()는 화면 밖까지 들어 있다 → 칸 안쪽 좌표로 다시 구한다(못 구하면 칸 전체).
   */
  const getVisibleMapBox = useCallback((map: any): MapBox | null => {
    const node = mapContainerRef.current;
    const proj = map?.getProjection?.();
    const b = MAP_TILE_PRELOAD_BUFFER_PX;
    if (node && proj?.coordsFromContainerPoint && window.kakao?.maps?.Point) {
      const w = node.clientWidth;
      const h = node.clientHeight;
      if (w > 2 * b && h > 2 * b) {
        const sw = proj.coordsFromContainerPoint(new window.kakao.maps.Point(b, h - b));
        const ne = proj.coordsFromContainerPoint(new window.kakao.maps.Point(w - b, b));
        return {
          minLat: Math.min(sw.getLat(), ne.getLat()),
          maxLat: Math.max(sw.getLat(), ne.getLat()),
          minLng: Math.min(sw.getLng(), ne.getLng()),
          maxLng: Math.max(sw.getLng(), ne.getLng()),
        };
      }
    }
    return getMapBox(map);
  }, []);

  // 목록에 쓸 스토어: 검색 모드면 검색 결과 중 화면에 보이는 것, 아니면 화면에 보이는 플랫폼 스토어(픽업 필터는 API에서 반영)
  const getStoresForList = useCallback((): StoreInfo[] => {
    const map = mapInstanceRef.current;
    if (!map) return [];
    const source =
      searchStoresRef.current !== null ? searchStoresRef.current : platformStoresRef.current;
    const box = getVisibleMapBox(map);
    return box ? getStoresInBox(source, box) : [];
  }, [getVisibleMapBox]);

  const getStoresForListRef = useRef(getStoresForList);
  getStoresForListRef.current = getStoresForList;

  const listSheet = useMapListSheet(getStoresForList); // 하단 목록 시트(드래그 패널) 상태

  const {
    listSheetStores,
    setListSheetStores,
    listSheetPanelOffset,
    isListSheetPanelDragging,
    listSheetPanelOffsetRef,
    getListSheetMaxOffset,
    openListSheet,
    closeListSheet,
    handlePointerDown: listSheetHandlePointerDown,
    handlePointerMove: listSheetHandlePointerMove,
    handlePointerUp: listSheetHandlePointerUp,
  } = listSheet;

  // ---- 마커로 그릴 스토어: 검색 모드면 검색 결과만, 아니면 지도 칸 범위의 플랫폼 스토어(픽업 필터는 API에서 반영).
  // 지도 칸은 화면보다 사방 MAP_TILE_PRELOAD_BUFFER_PX 커서 그만큼 화면 밖도 미리 그려진다. 칸 밖은 카카오가 숨기므로 더 넓히지 않는다.
  const getStoresToShow = useCallback((map: any): StoreInfo[] => {
    return searchStoresRef.current !== null
      ? searchStoresRef.current
      : getStoresInMapBounds(map, platformStoresRef.current);
  }, []);

  /** 미입점(카카오 검색) 마커를 보여도 되는지: 지도 검색·픽업 필터 중에는 안 보임 */
  const isUnenteredAllowed = useCallback(
    () =>
      searchStoresRef.current === null &&
      !searchQueryRef.current &&
      pickupFilterRef.current == null,
    [],
  );

  /** 카카오 검색 장소가 플랫폼 스토어와 같은 위치/이름이면 미입점 마커에서 제외 */
  const isPlatformStoreDuplicate = useCallback((lat: number, lng: number, placeName: string) => {
    return platformStoresRef.current.some((s) => {
      const samePos =
        getPositionKey(lat, lng, 5) === getPositionKey(s.latitude!, s.longitude!, 5) ||
        getPositionKey(lat, lng, 4) === getPositionKey(s.latitude!, s.longitude!, 4);
      if (!samePos) return false;
      return isStoreNameSimilar(placeName, s.name ?? "");
    });
  }, []);

  /** 플랫폼 마커 이미지를 기본(영업/마감) 상태로 복원 */
  const resetPlatformMarkerImages = useCallback(() => {
    platformMarkerEntriesRef.current.forEach((entry) => {
      const img = entry.dim ? openedDimMarkerImageRef.current : openedMarkerImageRef.current;
      if (img) entry.marker.setImage(img);
    });
  }, []);

  /** 미입점(카카오 키워드 검색) 마커·오버레이만 제거, 플랫폼 마커는 유지 */
  const clearKakaoMarkers = useCallback(() => {
    kakaoMarkerEntriesRef.current.forEach((entry) => {
      entry.marker.setMap(null);
      entry.overlay.setMap(null);
    });
    kakaoMarkerEntriesRef.current.clear();
    resetPlatformMarkerImages();
    selectedMarkerRef.current = null;
  }, [resetPlatformMarkerImages]);

  /**
   * 검색 모드면 검색 결과 전체, 아니면 현재 지도 bounds 내 플랫폼 스토어만 마커로 그림.
   * storeId 기준 diff — 이미 그려진 마커는 재사용하고, 범위를 벗어난 마커만 제거해
   * 드래그마다 전체 마커·오버레이를 재생성하지 않는다.
   */
  const drawPlatformStoreMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!window.kakao?.maps || !map) return;
    // 제스처(드래그·줌) 중에는 DOM 갱신을 하지 않음 — 제스처 종료 후 idle에서 다시 그린다 (터치 끊김 방지)
    if (isUserInteractingRef.current) return;

    if (!openedMarkerImageRef.current) {
      openedMarkerImageRef.current = new window.kakao.maps.MarkerImage(
        "/images/contents/map-opened.png",
        new window.kakao.maps.Size(32, 37),
        { offset: new window.kakao.maps.Point(16, 37) },
      );
    }
    if (!openedFocusedMarkerImageRef.current) {
      openedFocusedMarkerImageRef.current = new window.kakao.maps.MarkerImage(
        "/images/contents/map-opened-focus.png",
        new window.kakao.maps.Size(35, 40),
        { offset: new window.kakao.maps.Point(17.5, 40) },
      );
    }
    if (!openedDimMarkerImageRef.current) {
      openedDimMarkerImageRef.current = new window.kakao.maps.MarkerImage(
        "/images/contents/map-opened-dim.png",
        new window.kakao.maps.Size(32, 37),
        { offset: new window.kakao.maps.Point(16, 37) },
      );
    }
    if (!openedDimFocusedMarkerImageRef.current) {
      openedDimFocusedMarkerImageRef.current = new window.kakao.maps.MarkerImage(
        "/images/contents/map-opened-dim-focus.png",
        new window.kakao.maps.Size(35, 40),
        { offset: new window.kakao.maps.Point(17.5, 40) },
      );
    }

    const stores = getStoresToShow(map);
    const statusAt = mapPickupFilterToOverlayInstant(pickupFilter);
    const entries = platformMarkerEntriesRef.current;

    // 범위를 벗어난 스토어의 마커·오버레이만 제거
    const nextIds = new Set(stores.map((s) => s.id));
    entries.forEach((entry, id) => {
      if (nextIds.has(id)) return;
      entry.marker.setMap(null);
      entry.overlay.setMap(null);
      if (selectedMarkerRef.current === entry.marker) selectedMarkerRef.current = null;
      entries.delete(id);
    });

    stores.forEach((store) => {
      if (store.latitude == null || store.longitude == null) return;
      const useDim = shouldUseDimPlatformMapMarker(store.businessCalendar, statusAt, pickupFilter);
      const safeName = escapeHtmlForOverlay(store.name ?? "");
      const statusHtml = buildMapPlatformStoreStatusOverlayHtml(
        store.businessCalendar,
        statusAt,
        pickupFilter,
      );
      const overlayHtml = `<div class="flex flex-col items-center pointer-events-none" style="margin-top:-4px;"><p class="text-center text-[14px] leading-[1.4] font-bold text-gray-900" style="text-shadow:${MAP_MARKER_LABEL_TEXT_SHADOW}">${safeName}</p>${statusHtml}</div>`;

      const existing = entries.get(store.id);
      if (existing) {
        // 이미 그려진 마커는 재사용 — 바뀐 부분(마감 여부·오버레이 내용)만 갱신
        existing.store = store;
        if (existing.dim !== useDim) {
          existing.dim = useDim;
          const isSelected = selectedMarkerRef.current === existing.marker;
          const img = useDim
            ? isSelected
              ? openedDimFocusedMarkerImageRef.current
              : openedDimMarkerImageRef.current
            : isSelected
              ? openedFocusedMarkerImageRef.current
              : openedMarkerImageRef.current;
          if (img) existing.marker.setImage(img);
        }
        if (existing.overlayHtml !== overlayHtml) {
          existing.overlay.setContent(overlayHtml);
          existing.overlayHtml = overlayHtml;
        }
        return;
      }

      const defaultMarkerImage = useDim
        ? openedDimMarkerImageRef.current
        : openedMarkerImageRef.current;
      const position = new window.kakao.maps.LatLng(store.latitude, store.longitude);
      const marker = new window.kakao.maps.Marker({
        map,
        position,
        image: defaultMarkerImage,
      });
      const overlay = new window.kakao.maps.CustomOverlay({
        map,
        position,
        yAnchor: 0,
        content: overlayHtml,
      });
      const entry = { marker, overlay, dim: useDim, overlayHtml, store };
      entries.set(store.id, entry);

      window.kakao.maps.event.addListener(marker, "click", () => {
        trackEvent("engage_store_pin", { store_id: entry.store.id });
        if (markerImageRef.current)
          kakaoMarkerEntriesRef.current.forEach((e) => e.marker.setImage(markerImageRef.current));
        resetPlatformMarkerImages();
        const focusedImg = entry.dim
          ? openedDimFocusedMarkerImageRef.current
          : openedFocusedMarkerImageRef.current;
        if (focusedImg) {
          marker.setImage(focusedImg);
          selectedMarkerRef.current = marker;
        }
        if (map?.panTo) {
          isCenteringFromClickRef.current = true;
          map.panTo(position);
        }
        if (listSheetPanelOffsetRef.current > 0) closeListSheet();
        setSelectedUnenteredStore(null);
        setSelectedStore(entry.store);
      });
    });
  }, [getStoresToShow, pickupFilter, closeListSheet, resetPlatformMarkerImages]);

  const drawPlatformStoreMarkersRef = useRef(drawPlatformStoreMarkers);
  drawPlatformStoreMarkersRef.current = drawPlatformStoreMarkers;

  /** 영업 상태 라벨이 시간 경과에 맞게 갱신되도록 1분마다 플랫폼 마커·오버레이 재생성 */
  useEffect(() => {
    const id = window.setInterval(() => {
      drawPlatformStoreMarkersRef.current();
    }, 60_000);
    return () => {
      window.clearInterval(id);
      // 언마운트 시 idle 디바운스 타이머도 정리
      if (idleDebounceTimerRef.current != null) window.clearTimeout(idleDebounceTimerRef.current);
    };
  }, []);

  /**
   * 현재위치(파란 점) 마커 표시/제거.
   * CustomOverlay(HTML img)는 지도 생성 직후·panTo 도중 렌더되지 않는 카카오 타이밍 이슈가 있어
   * 스토어 마커와 동일하게 Marker + MarkerImage로 그린다.
   */
  const updateUserLocationMarker = useCallback(
    (location: { latitude: number; longitude: number } | null) => {
      const map = mapInstanceRef.current;
      if (!window.kakao?.maps || !map) return;
      if (!location) {
        if (userLocationMarkerRef.current) {
          userLocationMarkerRef.current.setMap(null);
          userLocationMarkerRef.current = null;
        }
        return;
      }
      const position = new window.kakao.maps.LatLng(location.latitude, location.longitude);
      if (!userLocationMarkerImageRef.current) {
        userLocationMarkerImageRef.current = new window.kakao.maps.MarkerImage(
          "/images/contents/map-current-position.png",
          new window.kakao.maps.Size(34, 34),
          { offset: new window.kakao.maps.Point(17, 17) }, // 좌표가 점 중앙에 오도록
        );
      }
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setPosition(position);
        userLocationMarkerRef.current.setMap(map);
      } else {
        userLocationMarkerRef.current = new window.kakao.maps.Marker({
          map,
          position,
          image: userLocationMarkerImageRef.current,
          clickable: false,
          zIndex: 1, // 스토어 마커 위에 항상 보이도록
        });
      }
    },
    [],
  );

  /** 미입점 검색 결과를 기억해 둔다. 다시 본 곳은 최근으로 옮기고, 넘치면 오래된 것부터 지운다 */
  const rememberKakaoPlaces = useCallback((data: any[]) => {
    const cache = kakaoPlacesCacheRef.current;
    data.forEach((place) => {
      const id = String(place.id ?? `${place.y},${place.x}`);
      cache.delete(id);
      cache.set(id, place);
    });
    while (cache.size > MAP_UNENTERED_CACHE_MAX) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) break;
      cache.delete(oldest);
    }
  }, []);

  /**
   * 기억해 둔 미입점 장소 중 지도 칸 안에서 가운데와 가까운 순으로 최대 MAP_UNENTERED_MAX_MARKERS개를 그린다.
   * place id 기준 diff — 이미 그려진 마커는 재사용하고 빠진 것만 제거해
   * 재검색마다 전체 마커·오버레이를 제거·재생성하는 무거운 DOM 작업(터치 끊김 원인)을 없앤다.
   * 제스처(드래그·줌) 중에는 그리지 않고 idle에서 다시 부른다.
   */
  const drawKakaoMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!window.kakao?.maps || !map) return;
    if (isUserInteractingRef.current) return;
    const box = getMapBox(map); // 칸 밖은 카카오가 숨기므로 칸 안만
    const center = map.getCenter?.();
    if (!box || !center) return;
    if (!markerImageRef.current) {
      markerImageRef.current = new window.kakao.maps.MarkerImage(
        "/images/contents/map-unopened.png",
        new window.kakao.maps.Size(32, 37),
        { offset: new window.kakao.maps.Point(16, 37) },
      );
    }
    if (!focusedMarkerImageRef.current) {
      focusedMarkerImageRef.current = new window.kakao.maps.MarkerImage(
        "/images/contents/map-unopened-focus.png",
        new window.kakao.maps.Size(35, 40),
        { offset: new window.kakao.maps.Point(17.5, 40) },
      );
    }
    const entries = kakaoMarkerEntriesRef.current;

    const candidates = [...kakaoPlacesCacheRef.current.values()].filter(
      (place) =>
        !isPlatformStoreDuplicate(Number(place.y), Number(place.x), place.place_name ?? ""),
    );
    const places = pickNearestInBox(
      candidates,
      (place) => ({ lat: Number(place.y), lng: Number(place.x) }),
      box,
      { lat: center.getLat(), lng: center.getLng() },
      MAP_UNENTERED_MAX_MARKERS,
    );
    const getPlaceKey = (place: any) => String(place.id ?? `${place.y},${place.x}`);
    const nextIds = new Set(places.map(getPlaceKey));

    // 범위에서 빠진 마커·오버레이만 제거
    entries.forEach((entry, id) => {
      if (nextIds.has(id)) return;
      entry.marker.setMap(null);
      entry.overlay.setMap(null);
      if (selectedMarkerRef.current === entry.marker) selectedMarkerRef.current = null;
      entries.delete(id);
    });

    places.forEach((place) => {
      const id = getPlaceKey(place);
      if (entries.has(id)) return; // 이미 그려진 마커 재사용
      const lat = Number(place.y);
      const lng = Number(place.x);
      const position = new window.kakao.maps.LatLng(lat, lng);
      const marker = new window.kakao.maps.Marker({
        map,
        position,
        image: markerImageRef.current,
      });
      window.kakao.maps.event.addListener(marker, "click", () => {
        trackEvent("engage_store_pin", { store_id: "none" });
        setSelectedStore(null);
        setSelectedUnenteredStore({
          kakaoPlaceId: String(place.id ?? ""),
          name: place.place_name ?? "",
          address: place.address_name || undefined,
          roadAddress: place.road_address_name || undefined,
          phone: place.phone || undefined,
          categoryName: place.category_name || undefined,
          placeUrl: place.place_url || undefined,
          latitude: lat,
          longitude: lng,
        });
        if (listSheetPanelOffsetRef.current > 0) closeListSheet();
        if (markerImageRef.current)
          kakaoMarkerEntriesRef.current.forEach((e) => e.marker.setImage(markerImageRef.current));
        resetPlatformMarkerImages();
        if (focusedMarkerImageRef.current) {
          marker.setImage(focusedMarkerImageRef.current);
          selectedMarkerRef.current = marker;
        }
        if (map?.panTo) {
          isCenteringFromClickRef.current = true;
          map.panTo(position);
        }
      });
      const safeName = escapeHtmlForOverlay(place.place_name ?? "");
      const overlay = new window.kakao.maps.CustomOverlay({
        map,
        position,
        yAnchor: 0,
        content: `<div class="flex flex-col items-center pointer-events-none" style="margin-top:-4px;"><p class="text-center text-[14px] leading-[1.4] font-bold text-gray-900" style="text-shadow:${MAP_MARKER_LABEL_TEXT_SHADOW}">${safeName}</p><p class="text-center text-[11px] leading-[1.4] font-bold text-gray-500" style="text-shadow:${MAP_MARKER_LABEL_TEXT_SHADOW}">미입점</p></div>`,
      });
      entries.set(id, { marker, overlay });
    });
  }, [
    isPlatformStoreDuplicate,
    closeListSheet,
    resetPlatformMarkerImages,
    listSheetPanelOffsetRef,
  ]);

  const drawKakaoMarkersRef = useRef(drawKakaoMarkers);
  drawKakaoMarkersRef.current = drawKakaoMarkers;

  /**
   * 카카오 키워드 검색으로 주변 미입점(주문제작 케이크) 장소를 받아 기억하고 마커로 그린다. 지도 검색·픽업 필터 시에는 표시하지 않음.
   * 지도 칸보다 조금 넓은 범위에서 가운데와 가까운 순으로 MAP_UNENTERED_SEARCH_PAGES쪽(쪽마다 15곳)까지 받는다.
   * skipIfNearLastSearch: 같은 줌에서 지도가 조금만 움직였으면 재검색을 생략해 드래그마다 네트워크 요청이 발생하지 않게 함.
   */
  const searchPlaces = useCallback(
    (centerLatLng: any, opts?: { skipIfNearLastSearch?: boolean }) => {
      if (searchQueryRef.current || pickupFilterRef.current != null) {
        clearKakaoMarkers();
        return;
      }
      if (!window.kakao?.maps?.services) return;
      const currentMap = mapInstanceRef.current;
      if (opts?.skipIfNearLastSearch && currentMap && lastKeywordSearchRef.current) {
        const last = lastKeywordSearchRef.current;
        const bounds = currentMap.getBounds?.();
        const sw = bounds?.getSouthWest?.();
        const ne = bounds?.getNorthEast?.();
        if (last.level === currentMap.getLevel?.() && sw && ne) {
          const latSpan = Math.abs(ne.getLat() - sw.getLat());
          const lngSpan = Math.abs(ne.getLng() - sw.getLng());
          const movedLat = Math.abs(centerLatLng.getLat() - last.lat);
          const movedLng = Math.abs(centerLatLng.getLng() - last.lng);
          if (
            movedLat < latSpan * MAP_KEYWORD_SEARCH_MIN_MOVE_RATIO &&
            movedLng < lngSpan * MAP_KEYWORD_SEARCH_MIN_MOVE_RATIO
          ) {
            return;
          }
        }
      }
      lastKeywordSearchRef.current = {
        lat: centerLatLng.getLat(),
        lng: centerLatLng.getLng(),
        level: currentMap?.getLevel?.() ?? 0,
      };
      if (!placesServiceRef.current)
        placesServiceRef.current = new window.kakao.maps.services.Places();

      const seq = ++keywordSearchSeqRef.current;
      const box = currentMap ? getMapBox(currentMap, MAP_UNENTERED_SEARCH_PAD_RATIO) : null;
      const options: Record<string, unknown> = {
        location: centerLatLng,
        sort: window.kakao.maps.services.SortBy.DISTANCE,
      };
      if (box) {
        options.bounds = new window.kakao.maps.LatLngBounds(
          new window.kakao.maps.LatLng(box.minLat, box.minLng),
          new window.kakao.maps.LatLng(box.maxLat, box.maxLng),
        );
      } else {
        options.useMapBounds = true;
      }

      placesServiceRef.current.keywordSearch(
        KAKAO_PLACES_KEYWORD,
        (data: any[], status: string, pagination: any) => {
          if (seq !== keywordSearchSeqRef.current) return; // 그 사이 새 검색을 시작함
          // 결과 없음·오류: 기억해 둔 장소만 그대로(범위를 벗어난 마커는 idle에서 빠진다)
          if (status !== window.kakao.maps.services.Status.OK || !Array.isArray(data)) return;
          if (!mapInstanceRef.current) return;
          rememberKakaoPlaces(data);
          // 드래그·줌 도중이면 그리기를 건너뛰고 다음 idle에서 그린다 (프레임 드랍·터치 끊김 방지)
          if (isUnenteredAllowed()) drawKakaoMarkersRef.current();
          if (pagination?.hasNextPage && pagination.current < MAP_UNENTERED_SEARCH_PAGES) {
            pagination.nextPage();
          }
        },
        options,
      );
    },
    [clearKakaoMarkers, rememberKakaoPlaces, isUnenteredAllowed],
  );

  /** URL 검색 또는 픽업 필터 시 미입점 마커 제거, 해제 시에만 키워드 검색 재실행 */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapInstanceRef.current || !window.kakao?.maps) return;
    const suppress = Boolean(searchQuery || pickupFilter);
    if (suppress) {
      clearKakaoMarkers();
      setSelectedUnenteredStore(null);
    } else if (searchStoresRef.current === null) {
      drawKakaoMarkersRef.current(); // 기억해 둔 미입점부터 바로
      searchPlaces(mapInstanceRef.current.getCenter());
    }
  }, [searchQuery, pickupFilter, clearKakaoMarkers, searchPlaces]);

  /** 지도 최초 중심: 현재위치 있으면 그곳, 없으면 강남구 */
  const getInitialCenter = useCallback((): { lat: number; lng: number } => {
    if (userLocation) {
      usedUserLocationForCenterRef.current = true;
      return { lat: userLocation.latitude, lng: userLocation.longitude };
    }
    return DEFAULT_MAP_CENTER;
  }, [userLocation]);

  /**
   * 카카오 지도 생성 및 이벤트 등록.
   * suppressKakaoUnopenedMarkers: true면 미입점 검색(searchPlaces) 호출 안 함(지도 검색·픽업 필터와 동일).
   */
  const initializeMap = useCallback(
    (center: { lat: number; lng: number }, suppressKakaoUnopenedMarkers: boolean) => {
      if (!window.kakao?.maps || !mapContainerRef.current || mapInstanceRef.current) return;
      window.kakao.maps.load(() => {
        // userLocation 도착 전·후로 initializeMap이 중복 호출되면 load 콜백이 2번 실행될 수 있음
        if (mapInstanceRef.current) return;

        const map = new window.kakao.maps.Map(mapContainerRef.current, {
          center: new window.kakao.maps.LatLng(center.lat, center.lng),
          level: 5,
          // 타일 페이드인 애니메이션 비활성화 — 드래그 시 새 타일이 서서히 나타나며 흰색으로 보이는 구간 제거
          tileAnimation: false,
        });
        mapInstanceRef.current = map;
        setMapReady(true);

        if (typeof map.relayout === "function") {
          map.relayout();
        }

        if (suppressKakaoUnopenedMarkers) clearKakaoMarkers();
        drawPlatformStoreMarkersRef.current();
        if (!suppressKakaoUnopenedMarkers) {
          searchPlaces(new window.kakao.maps.LatLng(center.lat, center.lng));
        }
        // load 콜백은 비동기라 클로저의 userLocation이 null일 수 있음 → ref로 최신 위치 사용
        updateUserLocationMarker(userLocationRef.current ?? null);

        // 제스처(드래그·줌) 진행 여부 추적 — 제스처 중에는 마커 DOM 갱신을 전부 보류해 터치 끊김을 방지
        window.kakao.maps.event.addListener(map, "dragstart", () => {
          lastMapGestureRef.current = "drag";
          isUserInteractingRef.current = true;
        });
        window.kakao.maps.event.addListener(map, "dragend", () => {
          isUserInteractingRef.current = false;
        });
        window.kakao.maps.event.addListener(map, "zoom_start", () => {
          lastMapGestureRef.current = "zoom";
          isUserInteractingRef.current = true;
        });
        window.kakao.maps.event.addListener(map, "zoom_changed", () => {
          isUserInteractingRef.current = false;
        });

        // 지도 이동/줌 종료 시: 마커 갱신, 목록 패널이 열려 있으면 범위 내 스토어로 목록 갱신
        // 연속 드래그 시 idle이 잇달아 발생하므로 디바운스로 마지막 1회만 처리
        window.kakao.maps.event.addListener(map, "idle", () => {
          if (isCenteringFromClickRef.current) {
            isCenteringFromClickRef.current = false;
            return;
          }
          if (idleDebounceTimerRef.current != null) {
            window.clearTimeout(idleDebounceTimerRef.current);
          }
          idleDebounceTimerRef.current = window.setTimeout(() => {
            idleDebounceTimerRef.current = null;
            // 타이머 대기 중 새 제스처가 시작됐으면 건너뜀 — 제스처 종료 후 idle에서 다시 처리됨
            if (isUserInteractingRef.current) return;
            drawPlatformStoreMarkersRef.current();
            trackEvent("success_map_area_search", {
              trigger_type: lastMapGestureRef.current ?? "drag",
              result_count: getStoresForListRef.current().length,
            });
            lastMapGestureRef.current = null;
            if (isUnenteredAllowed()) {
              // 기억해 둔 미입점을 먼저 그리고(검색을 기다리지 않음), 많이 움직였을 때만 새로 검색
              drawKakaoMarkersRef.current();
              searchPlaces(map.getCenter(), { skipIfNearLastSearch: true });
            }
            if (listSheetPanelOffsetRef.current > 0) {
              setListSheetStores(getStoresForListRef.current());
            }
            // 검색 모드가 아니고, 현재 보이는 범위에 스토어가 없으면 목록 패널 접기
            if (
              searchStoresRef.current === null &&
              getStoresForListRef.current().length === 0 &&
              listSheetPanelOffsetRef.current > 0
            ) {
              closeListSheet();
            }
          }, MAP_IDLE_DEBOUNCE_MS);
        });

        window.kakao.maps.event.addListener(map, "click", () => {
          setSelectedStore(null);
          setSelectedUnenteredStore(null);
          if (listSheetPanelOffsetRef.current > 0) closeListSheet();
        });

        // URL 검색으로 진입한 경우: 지도 생성 시점에 이미 검색 결과가 있으면 bounds/중심·목록 패널 적용
        const stores = searchStoresRef.current;
        if (stores !== null) {
          if (stores.length > 0 && window.kakao.maps.LatLngBounds) {
            const bounds = new window.kakao.maps.LatLngBounds();
            stores.forEach((s) =>
              bounds.extend(new window.kakao.maps.LatLng(s.latitude!, s.longitude!)),
            );
            map.setBounds(bounds, MAP_BOUNDS_PADDING);
          } else if (stores.length === 0) {
            const loc = userLocationRef.current;
            const center =
              loc != null
                ? new window.kakao.maps.LatLng(loc.latitude, loc.longitude)
                : new window.kakao.maps.LatLng(DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng);
            map.setCenter(center);
          }
          openListSheet({ deferInWebView: true });
        }
      });
    },
    [
      clearKakaoMarkers,
      searchPlaces,
      isUnenteredAllowed,
      updateUserLocationMarker,
      userLocation,
      closeListSheet,
      openListSheet,
    ],
  );

  // ---- Effects ----
  // userLocation 변경 시 ref 동기화 (kakao.maps.load 콜백 등 비동기에서 최신 값 사용)
  useEffect(() => {
    userLocationRef.current = userLocation ?? null;
  }, [userLocation]);

  // 카카오 스크립트 로드 후 지도 1회 생성. URL 검색·픽업 필터 시 미입점 마커 없음
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ready = kakaoLoaded || (window.kakao && window.kakao.maps);
    if (!ready || mapInstanceRef.current) return;
    initializeMap(getInitialCenter(), Boolean(searchQuery || pickupFilter));
  }, [kakaoLoaded, userLocation, searchQuery, pickupFilter, getInitialCenter, initializeMap]);

  // 검색 모드가 아닐 때만: 현재위치 획득 시 지도 중심을 현재위치로 이동 (검색 후 덮어쓰기 방지)
  useEffect(() => {
    if (
      searchQuery ||
      !userLocation ||
      !mapInstanceRef.current ||
      usedUserLocationForCenterRef.current
    )
      return;
    const map = mapInstanceRef.current;
    if (map.panTo) {
      isCenteringFromClickRef.current = true;
      map.panTo(new window.kakao.maps.LatLng(userLocation.latitude, userLocation.longitude));
      if (
        searchStoresRef.current === null &&
        !searchQueryRef.current &&
        pickupFilterRef.current == null
      ) {
        searchPlaces(map.getCenter());
      }
      // "내 위치로 이동" 버튼으로 명시적으로 재요청한 경우에만 재검색 완료 이벤트 전송
      // (최초 진입 시 자동 중심 이동은 사용자 액션이 아니므로 제외)
      if (lastMapGestureRef.current === "current_location") {
        trackEvent("success_map_area_search", {
          trigger_type: "current_location",
          result_count: getStoresForList().length,
        });
        lastMapGestureRef.current = null;
      }
    }
    usedUserLocationForCenterRef.current = true;
  }, [userLocation, searchQuery, pickupFilter, searchPlaces, getStoresForList]);

  // 현재위치 변경 또는 지도 준비 완료 시 현재위치 마커(점) 갱신
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    updateUserLocationMarker(userLocation ?? null);
  }, [userLocation, updateUserLocationMarker, mapReady]);

  // 플랫폼 스토어 전체 조회 (React Query 캐시 — 지도 탭 재진입 시 캐시로 즉시 마커 표시, stale이면 백그라운드 갱신)
  const { data: platformStores } = useMapPlatformStores({ listFilter, pickupFilter });

  // 조회 결과 반영: 지도 있으면 마커 그리기, 검색 모드가 아니면 미입점 검색
  useEffect(() => {
    if (!platformStores) return;
    platformStoresRef.current = platformStores;
    const map = mapInstanceRef.current;
    if (map) {
      drawPlatformStoreMarkers();
      if (isUnenteredAllowed()) drawKakaoMarkersRef.current(); // 입점 가게와 겹치는 미입점 빼기
      if (searchStoresRef.current === null) searchPlaces(map.getCenter());
    }
    // 목록 패널이 열려 있을 때 필터 변경 시 목록 즉시 반영
    if (listSheetPanelOffsetRef.current > 0) {
      setListSheetStores(getStoresForList());
    }
    // 필터 적용 직후였다면, 새로 조회된 스토어 개수로 필터 적용 완료 이벤트 전송
    if (pendingFilterApplyRef.current) {
      pendingFilterApplyRef.current = false;
      trackEvent("success_map_filter_apply", {
        size_filter: listFilter.sizes?.join(",") || undefined,
        price_min: listFilter.minPrice,
        price_max: listFilter.maxPrice,
        type_filter: listFilter.productCategoryTypes?.join(",") || undefined,
        result_count: platformStores.length,
      });
    }
  }, [
    platformStores,
    drawPlatformStoreMarkers,
    isUnenteredAllowed,
    searchPlaces,
    getStoresForList,
    setListSheetStores,
  ]);

  // URL ?q= 검색: 스토어 검색 API 호출 후 마커·bounds·목록 패널 처리. 결과 0개여도 패널 열고 중심은 현재위치/강남구
  useEffect(() => {
    if (!searchQuery) {
      searchStoresRef.current = null;
      if (listSheetPanelOffsetRef.current > 0) closeListSheet();
      const map = mapInstanceRef.current;
      if (map) drawPlatformStoreMarkers();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const filterParams: StoreListFilter = {};
        if (listFilter.sizes?.length) filterParams.sizes = listFilter.sizes;
        if (listFilter.minPrice != null) filterParams.minPrice = listFilter.minPrice;
        if (listFilter.maxPrice != null) filterParams.maxPrice = listFilter.maxPrice;
        if (listFilter.productCategoryTypes?.length)
          filterParams.productCategoryTypes = listFilter.productCategoryTypes;
        const pickupQ = mapPickupFilterToStoreListQuery(pickupFilter);
        const res = await storeApi.getList({
          search: searchQuery,
          page: 1,
          limit: 1000,
          ...filterParams,
          ...(pickupQ ?? {}),
        });
        const stores = filterStoresWithCoordinates(res.data ?? []);
        if (cancelled) return;
        searchStoresRef.current = stores;
        if (lastViewedMapSearchKeyRef.current !== searchQuery) {
          lastViewedMapSearchKeyRef.current = searchQuery;
          trackEvent("view_map_search_result", {
            keyword: searchQuery,
            result_count: stores.length,
          });
        }
        const map = mapInstanceRef.current;
        if (!map || !window.kakao?.maps) return;
        clearKakaoMarkers(); // 검색 모드 진입 시 기존 미입점 마커 제거
        drawPlatformStoreMarkers();
        if (stores.length > 0) {
          const bounds = new window.kakao.maps.LatLngBounds();
          stores.forEach((s) =>
            bounds.extend(new window.kakao.maps.LatLng(s.latitude, s.longitude)),
          );
          map.setBounds(bounds, MAP_BOUNDS_PADDING);
        } else {
          // 검색 결과 0개: 지도 중심만 현재위치 또는 강남구로 (위치는 ref로 최신값 사용)
          const loc = userLocationRef.current;
          const center =
            loc != null
              ? new window.kakao.maps.LatLng(loc.latitude, loc.longitude)
              : new window.kakao.maps.LatLng(DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng);
          map.setCenter(center);
        }
        openListSheet({ deferInWebView: true });
      } catch {
        searchStoresRef.current = null;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    searchQuery,
    listFilter,
    pickupFilter,
    clearKakaoMarkers,
    drawPlatformStoreMarkers,
    openListSheet,
    closeListSheet,
  ]);

  // 검색 결과 0건 + 위치가 늦게 도착할 때 지도 중심만 이동 (목록 시트 높이는 유지)
  useEffect(() => {
    if (!searchQuery || !userLocation) return;
    const stores = searchStoresRef.current;
    if (stores === null || stores.length > 0) return;
    const map = mapInstanceRef.current;
    if (!map || !window.kakao?.maps) return;
    map.setCenter(new window.kakao.maps.LatLng(userLocation.latitude, userLocation.longitude));
  }, [searchQuery, userLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    drawPlatformStoreMarkersRef.current();
    if (listSheetPanelOffsetRef.current > 0) {
      setListSheetStores(getStoresForList());
    }
    setSelectedStore((prev) => {
      if (!prev || !pickupFilter || !prev.businessCalendar) return prev;
      if (pickupFilter.kind === "fullday") {
        return isStoreOpenOnSeoulCalendarDay(prev.businessCalendar, pickupFilter.date)
          ? prev
          : null;
      }
      if (pickupFilter.kind === "morning") {
        return storeCalendarOverlapsMapPickupHalfDay(
          prev.businessCalendar,
          pickupFilter.date,
          "morning",
        )
          ? prev
          : null;
      }
      return storeCalendarOverlapsMapPickupHalfDay(
        prev.businessCalendar,
        pickupFilter.date,
        "afternoon",
      )
        ? prev
        : null;
    });
  }, [pickupFilter, getStoresForList, setListSheetStores]);

  // ---- Handlers ----
  /** 내 위치 버튼: 현재위치 재요청 후 다음 effect에서 지도 중심 이동 */
  const handleRefreshLocation = () => {
    trackEvent("engage_current_location");
    lastMapGestureRef.current = "current_location";
    usedUserLocationForCenterRef.current = false;
    refreshUserLocation();
  };

  const handleListSheetTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    listSheetHandlePointerDown(e.touches[0].clientY);
  };
  const handleListSheetTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    listSheetHandlePointerMove(e.touches[0].clientY);
  };
  const handleListSheetTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    listSheetHandlePointerUp();
  };
  const handleListSheetMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    listSheetHandlePointerDown(e.clientY);
    const onMove = (ev: MouseEvent) => listSheetHandlePointerMove(ev.clientY);
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      listSheetHandlePointerUp();
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ---- Render ----
  if (!kakaoJavascriptKey) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-sm text-gray-500">
        <p className="mb-2 font-semibold">카카오 지도 설정이 필요합니다.</p>
        <p className="text-center">
          <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
            NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY
          </code>
          환경변수를 설정한 뒤 다시 시도해주세요.
        </p>
      </div>
    );
  }

  const kakaoSdkUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoJavascriptKey}&libraries=services&autoload=false`;

  return (
    <div className="relative w-full h-screen">
      <Script src={kakaoSdkUrl} strategy="afterInteractive" onLoad={() => setKakaoLoaded(true)} />
      {/* 컨테이너를 뷰포트보다 크게 만들어 화면 밖 타일을 미리 로드 (드래그 시 가장자리 회색 영역 완화) */}
      <div className="relative h-full overflow-hidden">
        <div
          ref={mapContainerRef}
          className="absolute"
          style={{ inset: -MAP_TILE_PRELOAD_BUFFER_PX, touchAction: "none" }}
          aria-label="주변 베이커리 지도"
        />
      </div>

      <MapTopSearchBar
        searchQuery={searchQuery}
        pickupFilter={pickupFilter}
        onCalendarClick={() => {
          trackEvent("engage_date_picker_open");
          setPickupCalendarOpen(true);
        }}
        onPickupClear={handlePickupClear}
        onSearchBackClick={() => router.push(buildMapSearchUrl(pickupFilter))}
        onSearchEditClick={() =>
          router.push(buildMapSearchUrlWithOptionalQuery(searchQuery, pickupFilter))
        }
        onSearchCloseClick={() => router.push(buildMapPageUrl(null, pickupFilter))}
      />

      <MapPickupDateBottomSheet
        isOpen={pickupCalendarOpen}
        onClose={() => setPickupCalendarOpen(false)}
        selectedFilter={pickupFilter}
        onConfirm={handlePickupConfirm}
        onClearFilter={handlePickupClear}
      />

      <button
        type="button"
        onClick={handleRefreshLocation}
        className="absolute right-[15px] bottom-32 z-10 flex h-10 w-10 items-center justify-center rounded-[26px] border border-gray-100 bg-white p-2.5"
        style={{ boxShadow: "0px 2px 10px 0px #0000000A" }}
        aria-label="내 위치로 이동"
      >
        <Icon name="currentLocation" width={20} height={20} className="text-blue-400" />
      </button>

      <button
        type="button"
        onClick={() => openListSheet()}
        className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center bg-white"
        style={{
          bottom: 110,
          borderRadius: 26,
          border: "1px solid var(--grayscale-gr-100, #EBEBEA)",
          padding: "8px 14px",
          boxShadow: "0px 2px 10px 0px #0000000A",
        }}
        aria-label="목록 보기"
      >
        <span className="inline-flex items-center justify-center gap-1 leading-none">
          <span
            className="inline-flex shrink-0 items-center justify-center text-gray-900"
            style={{ width: 16, height: 16 }}
          >
            <Icon name="list" width={16} height={16} className="block" />
          </span>
          <span
            className="text-gray-900 block"
            style={{ fontWeight: 400, fontSize: 14, lineHeight: 1.4, paddingTop: 1 }}
          >
            목록 보기
          </span>
        </span>
      </button>

      {selectedStore && (
        <div
          className="absolute z-30"
          style={{ left: 16, right: 16, bottom: MAP_SELECTED_STORE_CARD_BOTTOM }}
        >
          <MapStoreCard store={selectedStore} />
        </div>
      )}

      {!selectedStore && selectedUnenteredStore && (
        <div
          className="absolute z-30"
          style={{ left: 16, right: 16, bottom: MAP_SELECTED_STORE_CARD_BOTTOM }}
        >
          <MapUnenteredStoreCard
            key={selectedUnenteredStore.kakaoPlaceId}
            store={selectedUnenteredStore}
          />
        </div>
      )}

      {!selectedStore && !selectedUnenteredStore && (
        <MapListSheetPanel
          offset={listSheetPanelOffset}
          expandedToTop={
            listSheetPanelOffset > 0 && listSheetPanelOffset >= getListSheetMaxOffset() - 1
          }
          disableContentGestures={mapListFilterPanelOpen}
          isDragging={isListSheetPanelDragging}
          onTouchStart={handleListSheetTouchStart}
          onTouchMove={handleListSheetTouchMove}
          onTouchEnd={handleListSheetTouchEnd}
          onMouseDown={handleListSheetMouseDown}
          sheetPointerDown={listSheetHandlePointerDown}
          sheetPointerMove={listSheetHandlePointerMove}
          sheetPointerUp={listSheetHandlePointerUp}
        >
          {listSheetPanelOffset > 0 && (
            <MapStoreListSection
              stores={listSheetStores}
              hideHandle
              hideSortFilter={false}
              userLocation={userLocation}
              sortBy={listSortBy}
              onSortByChange={setListSortBy}
              listFilter={listFilter}
              onListFilterChange={(f) => {
                pendingFilterApplyRef.current = true;
                setListFilter(f);
              }}
              onFilterPanelOpenChange={setMapListFilterPanelOpen}
            />
          )}
        </MapListSheetPanel>
      )}

      <BottomNav />
    </div>
  );
}
