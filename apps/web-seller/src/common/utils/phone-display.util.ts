/**
 * 휴대폰 번호를 보기 쉽게 하이픈으로 나눈다: 11자리 010-1234-5678, 10자리 011-123-4567(02는 02-1234-5678).
 * 숫자가 10·11자리가 아니면 받은 값 그대로. 전화·문자 버튼에는 하이픈 없는 원래 값을 쓴다.
 */
export function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) {
    return d.startsWith("02")
      ? `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`
      : `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return phone;
}
