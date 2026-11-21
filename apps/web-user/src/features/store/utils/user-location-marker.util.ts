/**
 * 지도 현재 위치 표시(운영자 2026-11-21): 작은 파란 점(흰 테두리·옅은 둘레) + 보는 방향이면 점 바로 바깥 작은 삼각형(시안 H3).
 * 예전 34px 그림(map-current-position.png, 2026-11-21 지움)보다 작다. 카카오 Marker 그림으로 쓰려고 SVG data URI로 만든다
 * (CustomOverlay는 지도 생성 직후·panTo 도중 안 그려지는 문제가 있어 Marker를 쓴다 — MapPageClient).
 */
export const USER_LOCATION_MARKER_SIZE = 44;
const C = USER_LOCATION_MARKER_SIZE / 2;
const BLUE = "#009BF5";
/** 방향은 이 각도 단위로 그림을 만든다(그림 수를 72개로 제한) */
export const HEADING_STEP_DEG = 5;

/** 방향을 그림 단위로 반올림(0~355). 방향이 없으면 null */
export function headingBucket(heading: number | null): number | null {
  if (heading == null || Number.isNaN(heading)) return null;
  const normalized = ((heading % 360) + 360) % 360;
  return (Math.round(normalized / HEADING_STEP_DEG) * HEADING_STEP_DEG) % 360;
}

export function userLocationMarkerSvg(bucket: number | null): string {
  const arrow =
    bucket == null
      ? ""
      : `<g transform="rotate(${bucket} ${C} ${C})"><path d="M${C} ${C - 18.5} L${C - 5.4} ${C - 10} L${C + 5.4} ${C - 10} Z" fill="${BLUE}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" filter="url(#s)"/></g>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${USER_LOCATION_MARKER_SIZE}" height="${USER_LOCATION_MARKER_SIZE}" viewBox="0 0 ${USER_LOCATION_MARKER_SIZE} ${USER_LOCATION_MARKER_SIZE}">` +
    `<defs><filter id="s" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="0.5" stdDeviation="1" flood-color="#000" flood-opacity=".3"/></filter></defs>` +
    `<circle cx="${C}" cy="${C}" r="11.5" fill="${BLUE}" fill-opacity=".16"/>` +
    arrow +
    `<circle cx="${C}" cy="${C}" r="6.5" fill="${BLUE}" stroke="#fff" stroke-width="2.6" filter="url(#s)"/>` +
    `</svg>`
  );
}

export function userLocationMarkerSrc(bucket: number | null): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(userLocationMarkerSvg(bucket))}`;
}
