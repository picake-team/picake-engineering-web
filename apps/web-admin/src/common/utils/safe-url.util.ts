/**
 * 손님·사장님이 보낸 주소를 링크로 보여 줄 때 쓴다. http·https만 링크로 쓰고 나머지(javascript: 등)는 null.
 * React 18은 javascript: 링크를 막지 않아 눌렀을 때 실행될 수 있다.
 */
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : null;
}
