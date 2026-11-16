"use client";

import { create } from "zustand";
import { RegionMatchResult } from "@/apps/web-user/common/utils/region-match.util";
import { rememberLocationGranted } from "@/apps/web-user/common/utils/location-permission.util";

interface UserCurrentLocationState {
  // 상태
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  selectedRegion: RegionMatchResult | null;

  /** 사용자가 「내 위치」「현재 위치로 설정」등으로 명시적으로 요청했는지 */
  isLocationRequestUserInitiated: boolean;
  /** 위치 권한 거부 안내 모달 */
  isLocationPermissionModalOpen: boolean;

  // 액션
  setLocation: (latitude: number, longitude: number) => void;
  setAddress: (address: string) => void;
  setSelectedRegion: (region: RegionMatchResult | null) => void;
  clearLocation: () => void;
  markLocationRequestUserInitiated: () => void;
  clearLocationRequestFlag: () => void;
  openLocationPermissionModal: () => void;
  closeLocationPermissionModal: () => void;
  /** 권한 거부/실패 처리 — user-initiated일 때만 모달 표시 */
  handleLocationRequestFailure: () => void;
}

export const useUserCurrentLocationStore = create<UserCurrentLocationState>()((set, get) => ({
  // 초기 상태
  latitude: null,
  longitude: null,
  address: null,
  selectedRegion: null,
  isLocationRequestUserInitiated: false,
  isLocationPermissionModalOpen: false,

  // 위치 설정
  setLocation: (latitude: number, longitude: number) => {
    set({ latitude, longitude });
    // 위치는 GPS로만 들어온다(앱·브라우저·"현재 위치"). 받았으면 권한을 허용한 것이라 다음에는 묻지 않고 받는다
    rememberLocationGranted();
  },

  // 주소 설정
  setAddress: (address: string) => {
    set({ address });
  },

  // 선택 지역 설정
  setSelectedRegion: (region: RegionMatchResult | null) => {
    set({ selectedRegion: region });
  },

  // 위치 제거
  clearLocation: () => {
    set({
      latitude: null,
      longitude: null,
      address: null,
      selectedRegion: null,
    });
  },

  markLocationRequestUserInitiated: () => {
    set({ isLocationRequestUserInitiated: true });
  },

  clearLocationRequestFlag: () => {
    set({ isLocationRequestUserInitiated: false });
  },

  openLocationPermissionModal: () => {
    set({ isLocationPermissionModalOpen: true });
  },

  closeLocationPermissionModal: () => {
    set({ isLocationPermissionModalOpen: false });
  },

  handleLocationRequestFailure: () => {
    const { isLocationRequestUserInitiated } = get();
    set({ isLocationRequestUserInitiated: false });
    if (isLocationRequestUserInitiated) {
      set({ isLocationPermissionModalOpen: true });
    }
  },
}));
