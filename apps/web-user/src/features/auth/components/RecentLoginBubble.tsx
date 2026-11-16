/**
 * 로그인 버튼 오른쪽 위 주황 말풍선 "최근 로그인"(2026-11-16 운영자, 시안 C).
 * 버튼에 `relative`가 있어야 한다. 화면 읽기에는 버튼 이름 뒤에 "최근 로그인"으로 읽힌다.
 */
export function RecentLoginBubble() {
  return (
    <span className="pointer-events-none absolute -top-[15px] right-[14px] z-[1] block">
      <span className="block whitespace-nowrap rounded-full bg-primary px-[9px] py-1 text-xs font-bold leading-4 text-white">
        최근 로그인
      </span>
      <span
        aria-hidden
        className="absolute -bottom-1 left-1/2 block size-2 -translate-x-1/2 rotate-45 rounded-[1px] bg-primary"
      />
    </span>
  );
}
