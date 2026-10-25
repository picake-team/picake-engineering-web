/**
 * 앱 다운로드 진입점(`/app`)이 스토어 분기에 사용하는 링크 상수.
 *
 * 명함 등 **인쇄물에는 스토어 URL을 직접 넣지 않습니다.** 항상 `https://picakes.com/app`을
 * QR로 넣고, 어느 스토어로 보낼지는 서버가 User-Agent로 판단합니다
 * ({@link ../../app/app/route.ts}). 인쇄물은 회수할 수 없는데 스토어 구성은 바뀌므로
 * (스토어가 추가되거나 링크가 바뀔 수 있음) QR은 고정해두고 이 파일만 바꿔서 대응합니다.
 */

/** iOS App Store 링크 — 2026-08 입점 완료. */
export const APP_STORE_URL = "https://apps.apple.com/kr/app/picake/id6787681984";

/** Google Play 링크 — 입점 완료. 패키지명은 {@link ./android-asset-links.constant.ts}와 같습니다. */
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.pickage.package";
