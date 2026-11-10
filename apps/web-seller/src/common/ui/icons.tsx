/**
 * 판매자 앱 아이콘. 모양은 디자인 캔버스 "최종" 화면의 SVG 그대로다.
 *
 * - 아래 탭·할 일 아이콘: 평소에는 빈 선(#8C8C88, 굵기 1.8), 고르면 속을 칠한다(주황, 안쪽 선은 흰색).
 * - 선 아이콘(`Icon`): 색은 글자색(currentColor)을 따른다. 크기·굵기는 쓰는 곳의 디자인 값을 넘긴다.
 */
import { appColors } from "@/apps/web-seller/common/ui/tokens";

interface GlyphDef {
  /** 칠하는 몸통 */
  base: string[];
  /** 몸통 안쪽 선(칠하면 흰색) */
  inner?: string;
  /** 몸통 바깥 선(손잡이 등, 칠해도 같은 색 선) */
  outer?: string;
}

const TAB_GLYPHS = {
  home: { base: ["M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"] },
  orders: {
    base: ["M6 3h12a1 1 0 0 1 1 1v17l-3.5-2-3.5 2-3.5-2L5 21V4a1 1 0 0 1 1-1z"],
    inner: "M9 8h6M9 12h6M9 16h3",
  },
  calendar: {
    base: ["M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"],
    inner: "M4 10h16",
    outer: "M8 3v4M16 3v4",
  },
  // 손님 앱 상품 아이콘(포크가 꽂힌 봉투)을 칠할 수 있게 다시 그린 것
  products: {
    base: [
      "M9.5 4.5h8.8a1 1 0 0 1 1 .9l1.1 13.5a1 1 0 0 1-1 1.1H9.5z",
      "M9.5 4.5c-1.6 0-2.6 1.1-2.9 2.6L4 20h5.5z",
    ],
    inner: "M9.5 5.2v14.3M13.2 8.5v3M16.2 8.5v3M14.7 8.5v8M13.2 11.5a1.5 1.5 0 0 0 3 0",
    outer: "M6.6 7.1C6.2 5.8 5.2 5 4.2 5.4",
  },
  store: {
    base: [
      "M4 9l1.5-5h13L20 9v1a3 3 0 0 1-5.3 1.9 3 3 0 0 1-5.4 0A3 3 0 0 1 4 10z",
      "M5.5 14v6h13v-6z",
    ],
    inner: "M10.5 20v-3.5h3V20",
  },
} satisfies Record<string, GlyphDef>;

const TASK_GLYPHS = {
  // 예약 확인 = 예약신청
  confirm: {
    base: ["M7 4h10a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"],
    inner: "M9 12.5l2 2 4-4",
    outer: "M9.5 3h5",
  },
  // 입금 확인 = 입금완료
  deposit: {
    base: ["M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z"],
    inner: "M8 9l1.5 6L12 10l2.5 5L16 9M7.5 12.5h9",
  },
  // 픽업 처리 = 픽업대기
  pickup: {
    base: ["M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z"],
    inner: "M9.5 14l1.8 1.8 3.2-3.3",
    outer: "M9 8V6.5a3 3 0 0 1 6 0V8",
  },
  // 환불 처리 = 취소환불대기
  refund: {
    base: ["M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z"],
    inner: "M9 10h5a2.5 2.5 0 0 1 0 5h-3M11 8l-2 2 2 2",
  },
} satisfies Record<string, GlyphDef>;

/** 선 아이콘. 이름 옆은 디자인에서 쓰는 크기/굵기 */
const LINE_PATHS = {
  back: "M15 5l-7 7 7 7", // 24 / 1.8
  close: "M6 6l12 12M18 6L6 18", // 24 / 1.8
  chevronRight: "M9 5l7 7-7 7", // 18 / 2, #8C8C88
  chevronDown: "M6 9l6 6 6-6", // 18 / 2
  check: "M5 12l4.5 4.5L19 7", // 체크 칸 14 / 3, 고른 줄 20 / 2.4
  plus: "M12 5v14M5 12h14",
  search: "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM20 20l-4-4",
  help: "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17v.01",
  bell: "M6 10a6 6 0 1 1 12 0c0 4 1.5 6 2 7H4c.5-1 2-3 2-7zM10 20a2 2 0 0 0 4 0",
  phone:
    "M6.5 3h3l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A17 17 0 0 1 4.5 5a2 2 0 0 1 2-2z", // 18 / 1.9
  message: "M4 5h16v11H9l-5 4z", // 18 / 1.9
  copy: "M9 9h10v10H9zM5 15V5h10", // 18 / 1.9
  trash: "M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12M10 11v5M14 11v5", // 지웠어요 안내 20 / 2
  share: "M12 4v11M8 8l4-4 4 4M5 13v6h14v-6", // 18 / 1.9
  camera: "M4 8h4l2-2h4l2 2h4v11H4zM12 11a3 3 0 1 1 0 6 3 3 0 0 1 0-6z", // 22 / 1.8
  warning: "M12 3l9 16H3zM12 10v4M12 17v.01", // 18 / 2
  filter: "M4 6h16M7 12h10M10 18h4", // 18
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  retry: "M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4", // 34 / 1.7
  offline: "M3 9a14 14 0 0 1 18 0M6.5 12.5a9 9 0 0 1 11 0M10 16a4 4 0 0 1 4 0M12 19v.01M4 4l16 16", // 34 / 1.7
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5", // 18
  // 스토어 탭 위쪽 설정(톱니, Lucide settings 모양)
  settings:
    "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z",
  // 상품 사진이 없을 때 칸 가운데 두는 케이크 모양(굵기 1.6)
  cake: "M4 20h16v-7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2zM4 15c2 1.5 4 1.5 6 0s4-1.5 6 0 3 1.5 4 0M12 11V7",
} as const;

export type TabIconName = keyof typeof TAB_GLYPHS;
export type TaskIconName = keyof typeof TASK_GLYPHS;
export type IconName = keyof typeof LINE_PATHS;

function Glyph({ def, active, size }: { def: GlyphDef; active: boolean; size: number }) {
  const color = appColors.brand.DEFAULT;
  const line = active ? color : appColors.ink[400];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {def.base.map((d) => (
        <path key={d} d={d} fill={active ? color : "none"} stroke={line} strokeWidth={1.8} />
      ))}
      {def.inner ? (
        <path d={def.inner} stroke={active ? "#FFFFFF" : line} strokeWidth={1.8} />
      ) : null}
      {def.outer ? <path d={def.outer} stroke={line} strokeWidth={1.8} /> : null}
    </svg>
  );
}

/** 아래 탭 아이콘(24). 고른 탭은 주황으로 칠한다 */
export function TabIcon({
  name,
  active,
  size = 24,
}: {
  name: TabIconName;
  active: boolean;
  size?: number;
}) {
  return <Glyph def={TAB_GLYPHS[name]} active={active} size={size} />;
}

/** 홈 "처리할 주문" 줄 아이콘(22). 0건이면 빈 선 */
export function TaskIcon({
  name,
  active,
  size = 22,
}: {
  name: TaskIconName;
  active: boolean;
  size?: number;
}) {
  return <Glyph def={TASK_GLYPHS[name]} active={active} size={size} />;
}

/** 선 아이콘. 색은 글자색을 따르므로 감싸는 요소의 `text-*`로 정한다 */
export function Icon({
  name,
  size = 24,
  strokeWidth = 1.8,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={LINE_PATHS[name]} />
    </svg>
  );
}
