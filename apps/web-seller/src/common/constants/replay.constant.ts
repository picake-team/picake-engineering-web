/**
 * PostHog 화면 녹화(세션 리플레이)에서 통째로 가리는 class. 녹화에는 빈 상자로 보이고 이 칸의 클릭 자동 수집도 하지 않는다.
 * 사장님 화면에 보이는 손님 정보(예약자 이름·휴대폰 번호·입금자명·환불 계좌, 손님이 쓴 레터링·요청 사항·사유, 참고 사진)는
 * 주문을 처리하라고 준 것이라 이용 통계(PostHog)에 남기지 않는다(2026-11-11, hq 법무 점검표 17번).
 * 입력칸은 PostHog가 원래 가린다. 손님 웹도 같은 값을 쓴다(web-user `common/constants/replay.constant.ts`).
 */
export const NO_REPLAY = "ph-no-capture";
