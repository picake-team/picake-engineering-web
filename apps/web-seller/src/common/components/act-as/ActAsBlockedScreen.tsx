/**
 * 운영자 대신 입력 중(기획 I-41)에 막힌 화면(채팅·견적·마이페이지·피드·스토어 만들기)을 열면 보이는 짧은 안내.
 * 서버도 이 기능들을 막는다(허용 목록 밖 → 403) — 화면이 "불러오지 못했어요"로 보이지 않게 먼저 알린다.
 */
import { AppScreen, BackHeader } from "@/apps/web-seller/common/ui/Screen";
import { EmptyState } from "@/apps/web-seller/common/ui/Surface";

const BLOCKED_PATHS = [
  /^\/stores\/[^/]+\/chats(\/|$)/,
  /^\/stores\/[^/]+\/feed(\/|$)/,
  /^\/mypage(\/|$)/,
  /^\/store\/create\/?$/,
];

export function isActAsBlockedPath(pathname: string): boolean {
  return BLOCKED_PATHS.some((re) => re.test(pathname));
}

const TITLE = "운영자 대신 입력 중에는 쓸 수 없는 기능이에요";

/** 휴대폰 틀·PC 틀 안에서 같은 화면(PC 틀이면 AppScreen이 왼쪽 메뉴 옆 가운데 칸에 그린다, 기획 I-54) */
export function ActAsBlockedScreen() {
  return (
    <AppScreen header={<BackHeader title="" />}>
      <EmptyState big icon="warning" title={TITLE} />
    </AppScreen>
  );
}
