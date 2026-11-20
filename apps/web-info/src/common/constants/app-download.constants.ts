/**
 * 손님 앱 받기 링크(손님 소개 페이지 `/`). web-user `common/constants/app-download.constants.ts`에서 복사했다
 * (정보 사이트는 필요한 공용 값만 복사해 쓴다 — docs/web-info/README 설계 원칙). 스토어 주소가 바뀌면 두 곳을 같이 고친다.
 *
 * QR에는 스토어 주소를 직접 넣지 않고 `APP_DOWNLOAD_URL`(손님 웹 `/app`)을 넣는다. 그 주소가 기기에 맞는 스토어로 보낸다.
 */

/** 기기에 맞는 스토어로 보내는 손님 웹 입구(휴대폰 "앱 받기", PC QR) */
export const APP_DOWNLOAD_URL = "https://picakes.com/app";

/** iOS App Store */
export const APP_STORE_URL = "https://apps.apple.com/kr/app/picake/id6787681984";

/** Google Play */
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.pickage.package";

/** 앱 없이 쓰는 손님 웹 */
export const CUSTOMER_WEB_URL = "https://picakes.com";
