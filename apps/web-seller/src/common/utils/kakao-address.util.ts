import type { StoreAddressDto } from "@/apps/web-seller/features/store/types/store.dto";

// 카카오 키
const KAKAO_RESTAPI_KEY = import.meta.env.VITE_PUBLIC_KAKAO_RESTAPI_KEY || "";

// TypeScript 전역 타입 선언
declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: any) => void;
        width?: string;
        height?: string;
      }) => {
        open: () => void;
        /** 새 창 대신 element 안에 검색 화면을 그린다 */
        embed: (element: HTMLElement, options?: { autoClose?: boolean }) => void;
      };
    };
  }
}

/**
 * 카카오 우편번호 주소 검색 스크립트를 동적으로 로드
 * https://postcode.map.daum.net/guide
 */
export const loadKakaoAddressScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있는지 확인
    if (window.daum && window.daum.Postcode) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("카카오 주소 검색 스크립트 로드 실패"));
    document.head.appendChild(script);
  });
};

/**
 * 카카오 "주소로 좌표 변환" API 사용하여 좌표를 가져옴
 * https://developers.kakao.com/docs/latest/ko/local/dev-guide#address-coord
 *
 */
export const convertAddressToCoordinates = async (
  addressString: string,
): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(addressString)}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_RESTAPI_KEY}`,
        },
      },
    );
    const data = await response.json();
    const { address, road_address } = data.documents[0];
    const longitude = address.x || road_address.x || 0; // 경도
    const latitude = address.y || road_address.y || 0; // 위도
    return {
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
    };
  } catch (error) {
    console.error("주소를 좌표로 변환할 수 없습니다:", error);
    return null;
  }
};

/** 우편번호 서비스가 준 값 → 스토어 주소(좌표 포함) */
async function toStoreAddress(data: any): Promise<Omit<StoreAddressDto, "detailAddress">> {
  const addressData: Omit<StoreAddressDto, "detailAddress"> = {
    address: data.jibunAddress || data.address || "", // 지번 주소
    roadAddress: data.roadAddress || "", // 도로명 주소
    zonecode: data.zonecode || "", // 우편번호
    latitude: 0,
    longitude: 0,
  };
  // 도로명 주소가 있으면 도로명 주소로, 없으면 지번 주소로 좌표 변환
  const coordinates = await convertAddressToCoordinates(
    addressData.roadAddress || addressData.address || "",
  );
  if (coordinates) {
    addressData.latitude = coordinates.latitude || 0;
    addressData.longitude = coordinates.longitude || 0;
  }
  return addressData;
}

/**
 * 카카오 우편번호 주소 검색 서비스를 사용하여 주소를 가져옴(PC: 새 창)
 * 카카오 "주소로 좌표 변환" API 사용하여 가져온 주소를 통해 좌표를 가져옴
 */
export const openAddressSearch = async (
  onComplete: (data: Omit<StoreAddressDto, "detailAddress">) => void,
): Promise<void> => {
  try {
    await loadKakaoAddressScript();

    if (!window.daum || !window.daum.Postcode) {
      throw new Error("카카오 주소 검색 API가 로드되지 않았습니다.");
    }

    new window.daum.Postcode({
      oncomplete: async (data: any) => onComplete(await toStoreAddress(data)),
      width: "100%",
      height: "100%",
    }).open();
  } catch (error) {
    console.error("주소 검색 오류:", error);
    throw error;
  }
};

/**
 * 휴대폰 화면(앱 웹뷰 포함): 새 창은 앱 안에서 막히므로 element 안에 검색 화면을 그린다(SC-67, I-48 "주소 검색").
 */
export const embedAddressSearch = async (
  element: HTMLElement,
  onComplete: (data: Omit<StoreAddressDto, "detailAddress">) => void,
): Promise<void> => {
  await loadKakaoAddressScript();
  if (!window.daum || !window.daum.Postcode) {
    throw new Error("카카오 주소 검색 API가 로드되지 않았습니다.");
  }
  new window.daum.Postcode({
    oncomplete: async (data: any) => onComplete(await toStoreAddress(data)),
    width: "100%",
    height: "100%",
  }).embed(element, { autoClose: false });
};
