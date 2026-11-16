/** 네이버 N 로고(흰색, 네이버 녹색 버튼 위) — 인라인 SVG */
export function NaverLogoIcon({ className = "size-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z" />
    </svg>
  );
}
