import { serializeJsonLd } from "@/apps/web-user/common/utils/json-ld.util";

/** 검색엔진·AI가 읽는 구조화 데이터 (서버 컴포넌트, 화면에는 보이지 않음) */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
