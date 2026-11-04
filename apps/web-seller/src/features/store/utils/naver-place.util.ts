import type {
  NaverPlaceBusinessDayDto,
  NaverPlaceStorePrefillDto,
} from "@/apps/web-seller/features/store/types/store.dto";
import type { StoreForm } from "@/apps/web-seller/features/store/types/store.ui";

/** 네이버에서 가져와 폼에 채울 수 있는 항목 (주소는 주소 검색으로 확정하므로 넣지 않음) */
export const NAVER_IMPORT_FIELDS = [
  { key: "name", label: "스토어 이름" },
  { key: "description", label: "스토어 설명" },
  { key: "phoneNumber", label: "스토어 연락처" },
  { key: "instagramId", label: "인스타그램 ID" },
] as const;

export type NaverImportFieldKey = (typeof NAVER_IMPORT_FIELDS)[number]["key"];

export interface NaverImportRow {
  key: NaverImportFieldKey;
  label: string;
  /** 네이버 값 (없으면 null) */
  naverValue: string | null;
  /** 지금 폼에 있는 값 */
  currentValue: string;
  /** missing: 네이버에 없음, same: 지금 값과 같음, changed: 다름 */
  status: "missing" | "same" | "changed";
}

const normalize = (value: string | null | undefined) => (value ?? "").trim();

/**
 * 네이버 값과 지금 폼 값을 항목별로 비교한다.
 * 네이버에 없는 값은 지우는 것으로 보지 않고, 같은 값은 바뀐 것으로 세지 않는다.
 */
export function buildNaverImportRows(
  prefill: NaverPlaceStorePrefillDto,
  form: StoreForm,
): NaverImportRow[] {
  return NAVER_IMPORT_FIELDS.map(({ key, label }) => {
    const naverValue = normalize(prefill[key]) || null;
    const currentValue = normalize(form[key]);
    const status: NaverImportRow["status"] = !naverValue
      ? "missing"
      : naverValue === currentValue
        ? "same"
        : "changed";
    return { key, label, naverValue, currentValue, status };
  });
}

/**
 * 처음 고를 항목. 등록할 때는 비어 있는 칸만, 수정할 때는 아무것도 고르지 않는다
 * (이미 입력한 값을 덮어쓸지는 판매자가 직접 고른다).
 */
export function defaultSelectedKeys(
  rows: NaverImportRow[],
  mode: "create" | "edit",
): NaverImportFieldKey[] {
  if (mode === "edit") return [];
  return rows.filter((r) => r.status === "changed" && !r.currentValue).map((r) => r.key);
}

/** 고른 항목의 네이버 값만 폼에 넣을 값으로 만든다 */
export function pickNaverValues(
  rows: NaverImportRow[],
  selected: NaverImportFieldKey[],
): Partial<Pick<StoreForm, NaverImportFieldKey>> {
  const patch: Partial<Pick<StoreForm, NaverImportFieldKey>> = {};
  rows.forEach((row) => {
    if (row.status === "changed" && row.naverValue && selected.includes(row.key)) {
      patch[row.key] = row.naverValue;
    }
  });
  return patch;
}

/** 네이버 요일별 영업시간을 한 줄로 쓴다 (예: "월 11:00~19:00 · 쉬는 시간 15:00~16:00") */
export function formatNaverBusinessDay(day: NaverPlaceBusinessDayDto): string {
  if (!day.open || !day.close) {
    return `${day.day} 휴무${day.description ? ` (${day.description})` : ""}`;
  }
  const parts = [`${day.day} ${day.open}~${day.endsNextDay ? "다음 날 " : ""}${day.close}`];
  if (day.breakHours.length) {
    parts.push(`쉬는 시간 ${day.breakHours.map((b) => `${b.start}~${b.end}`).join(", ")}`);
  }
  if (day.description) parts.push(day.description);
  return parts.join(" · ");
}
