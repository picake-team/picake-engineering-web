"use client";

import { useEffect, useState } from "react";
import styles from "./partner.module.css";

/**
 * 주문 상태가 바뀔 때 손님에게 자동으로 나가는 카카오 알림톡 예시.
 * 실제 발송 시점은 backend `user-order-alimtalk.constants.ts`의 템플릿 대응표를 따른다.
 */
const NOTICES = [
  {
    trigger: "예약 확인",
    title: "입금 안내",
    body: "주문하신 케이크의 입금 계좌를 알려드려요. 입금 마감 전에 한 번 더 알려드릴게요.",
  },
  {
    trigger: "예약 확정",
    title: "예약 확정",
    body: "예약이 확정됐어요. 픽업 일시와 매장 위치를 확인해 주세요.",
  },
  {
    trigger: "픽업 하루 전",
    title: "픽업 안내",
    body: "내일 픽업 예정이에요. 시간 맞춰 매장으로 방문해 주세요.",
  },
  {
    trigger: "픽업 완료",
    title: "픽업 완료",
    body: "케이크는 마음에 드셨나요? 후기를 남겨 주시면 매장에 큰 힘이 돼요.",
  },
];

const AUTO_MS = 2800;

/**
 * 단계를 누르면 그때 손님이 받는 안내가 바뀐다.
 * 처음에는 스스로 넘어가다가, 사장님이 한 번 누르면 자동 진행을 멈춘다(읽는 중에 바뀌지 않게).
 *
 * 선택 상태는 먹색 채움 + 흰 글자. BeforeAfterToggle과 같은 언어를 쓴다.
 * 이 구간은 gray-50 섹션 위라 카드가 흰색이어야 바닥과 구분된다.
 */
export function AutoNoticeDemo() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setActive((i) => (i + 1) % NOTICES.length), AUTO_MS);
    return () => window.clearTimeout(timer);
  }, [active, auto]);

  const notice = NOTICES[active];

  return (
    <div>
      <ol className="grid grid-cols-4 gap-1.5">
        {NOTICES.map((n, i) => (
          <li key={n.trigger}>
            <button
              type="button"
              aria-pressed={i === active}
              className={`relative w-full overflow-hidden rounded-lg px-1 py-2.5 text-2xs font-bold transition-colors duration-200 active:scale-[0.97] ${
                i === active
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 ring-1 ring-gray-200"
              }`}
              onClick={() => {
                setAuto(false);
                setActive(i);
              }}
            >
              {n.trigger}
              {/* 자동 진행 중일 때 다음 단계까지 남은 시간 */}
              {auto && i === active && (
                <span
                  key={active}
                  aria-hidden
                  style={{ animationDuration: `${AUTO_MS}ms` }}
                  className={`absolute bottom-0 left-0 h-0.5 w-full bg-primary ${styles.progress}`}
                />
              )}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-gray-200" aria-live="polite">
        <p className="text-center text-2xs text-gray-600">손님 휴대폰 · 카카오 알림톡</p>
        <div
          key={active}
          className="mt-3 animate-in fade-in slide-in-from-bottom-3 duration-500 rounded-xl rounded-tl-md bg-gray-50 p-4 ring-1 ring-gray-200 motion-reduce:animate-none"
        >
          <p className="text-2sm font-bold text-gray-900">[Picake] {notice.title}</p>
          <p className="mt-1.5 text-2sm leading-[1.6] text-gray-700">{notice.body}</p>
        </div>
        <p className="mt-3.5 flex items-center justify-center gap-1.5 text-2xs font-bold text-gray-700">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          사장님이 따로 보내지 않아도 자동 발송
        </p>
      </div>
    </div>
  );
}
