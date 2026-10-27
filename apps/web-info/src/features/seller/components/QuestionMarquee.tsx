import styles from "./partner.module.css";

const ROW_A = [
  "1호는 몇 명 먹어요?",
  "당일 픽업 돼요?",
  "레터링 몇 자까지 돼요?",
  "계좌번호 다시 알려주세요",
  "초코 시트로 바꿀 수 있나요?",
];

const ROW_B = [
  "몇 시까지 가면 돼요?",
  "이 사진처럼 가능해요?",
  "토요일 아직 자리 있어요?",
  "입금했는데 확인되셨나요?",
  "매장 위치가 어디예요?",
];

function Row({ items, className }: { items: string[]; className: string }) {
  // 같은 목록을 두 번 이어 붙여 -50% 이동 시 이음새가 보이지 않게 한다
  return (
    <div className={`flex w-max gap-2 ${className}`}>
      {[...items, ...items].map((text, i) => (
        <span
          key={i}
          className="shrink-0 rounded-full bg-white/[0.06] px-4 py-2 text-2sm text-gray-300 ring-1 ring-white/[0.06]"
        >
          {text}
        </span>
      ))}
    </div>
  );
}

/** 사장님이 매일 받는 같은 질문들이 끝없이 흘러가는 띠 (장식용) */
export function QuestionMarquee() {
  return (
    <div
      aria-hidden
      className="flex flex-col gap-2 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]"
    >
      <Row items={ROW_A} className={styles.marquee} />
      <Row items={ROW_B} className={styles.marqueeReverse} />
    </div>
  );
}
