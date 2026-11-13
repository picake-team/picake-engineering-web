/**
 * 검색엔진·AI가 읽는 구조화 데이터(schema.org JSON-LD). 서버 컴포넌트이고 화면에는 보이지 않는다.
 * `<`를 이스케이프해 글 안의 "</script>"가 태그를 닫지 못하게 한다(web-user JsonLd와 같은 방식).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
