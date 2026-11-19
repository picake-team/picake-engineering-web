import React from "react";

/** 목록 끝에 닿으면 다음 쪽을 부른다(주문·상품·채팅·알림 목록, 휴대폰·PC 공용). 200px 앞에서 미리 부른다 */
export function LoadMoreSentinel({
  hasNext,
  loading,
  onLoad,
}: {
  hasNext: boolean;
  loading: boolean;
  onLoad: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const loadRef = React.useRef(onLoad);
  loadRef.current = onLoad;
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !hasNext || loading) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadRef.current();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNext, loading]);
  if (!hasNext) return null;
  return (
    <div ref={ref} className="flex justify-center py-3" aria-busy={loading}>
      {loading ? (
        <span className="inline-block size-5 animate-spin rounded-full border-2 border-ink-100 border-t-brand" />
      ) : null}
    </div>
  );
}
