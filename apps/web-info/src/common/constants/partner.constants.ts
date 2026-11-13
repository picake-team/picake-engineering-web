/**
 * 입점 소개 페이지(`/seller/about`)가 연결하는 외부 링크 상수.
 *
 * 오프라인에서 만나는 사장님께 보여줄 QR에는 **이 링크들을 직접 넣지 않습니다.**
 * 항상 web-user의 `https://picakes.com/partner`를 QR로 넣고, 실제 목적지는 코드에서 정합니다.
 * 인쇄물·명함의 QR은 회수할 수 없는데 목적지 주소는 바뀔 수 있기 때문입니다.
 */

/** 입점 신청: 판매자 웹. 로그인 전이면 카카오·구글 로그인(=가입) 화면, 로그인했으면 내 스토어로 간다 */
export const SELLER_SIGNUP_URL = "https://seller.picakes.com";

/**
 * 사장님 문의: 카카오톡 채널 "픽케이크" 채팅(손님 고객센터와 같은 채널, 2026-11-14부터 사장님 문의도 받음).
 * 채널 주소는 picake-hq marketing/channels.md와 같다
 */
export const KAKAO_CHANNEL_CHAT_URL = "https://pf.kakao.com/_MgxdPX/chat";
