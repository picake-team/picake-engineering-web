"use client";

import { useEffect, useState } from "react";

/** 히어로에서 흩어진 채널로 들어오는 연락 예시 (특정 고객이 아닌 설명용 문구) */
const INCOMING = [
  { channel: "문자", text: "토요일 2시에 픽업 가능할까요?", time: "오후 2:14" },
  { channel: "인스타 DM", text: "1호 초코로 레터링 넣어주세요!", time: "오후 2:31" },
  { channel: "카톡", text: "아까 보낸 사진 디자인 되나요?", time: "오후 3:02" },
  { channel: "부재중 전화", text: "통화 연결이 되지 않았어요", time: "오후 3:20" },
];

/** 메시지 하나가 더 쌓이는 간격 */
const STEP_MS = 750;
/** 주문서로 모인 뒤 처음으로 돌아가기까지 머무는 시간 */
const HOLD_MS = 3200;
const MERGED = INCOMING.length + 1;

/**
 * "여기저기서 오던 연락이 주문서 한 장으로 모인다"를 보여주는 히어로 연출.
 *
 * phase 0 -> 메시지가 하나씩 쌓임 -> MERGED에서 메시지가 사라지고 주문 카드가 올라옴 -> 반복.
 * 모션을 줄인 사용자에게는 결과(주문 카드)만 고정으로 보여준다.
 *
 * 높이를 min-h로 두고 아래 정렬한 이유: 글자 크기를 키운 기기에서 두 줄이 되어도 잘리지 않고,
 * 쌓이는 동안 빈 공간이 아래가 아니라 위에 남아야 대화창처럼 읽힌다.
 */
export function MessageFunnel() {
  const [phase, setPhase] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const delay = phase === MERGED ? HOLD_MS : phase === INCOMING.length ? STEP_MS * 1.6 : STEP_MS;
    const timer = window.setTimeout(() => setPhase((p) => (p >= MERGED ? 0 : p + 1)), delay);
    return () => window.clearTimeout(timer);
  }, [phase, reduced]);

  const merged = reduced || phase === MERGED;

  return (
    <div
      aria-hidden
      className="relative flex min-h-[236px] flex-col justify-end overflow-hidden rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200"
    >
      <ul className="flex flex-col gap-2">
        {INCOMING.map((msg, i) => {
          const visible = !merged && phase > i;
          return (
            <li
              key={msg.channel}
              style={{ transitionDelay: merged ? `${i * 40}ms` : "0ms" }}
              className={`flex items-center gap-3 rounded-xl bg-white px-3.5 py-3 ring-1 ring-gray-200 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                visible
                  ? "opacity-100 translate-y-0 scale-100"
                  : merged
                    ? "opacity-0 translate-y-16 scale-90"
                    : "opacity-0 -translate-y-2 scale-95"
              }`}
            >
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-2xs font-bold text-gray-700">
                {msg.channel}
              </span>
              <span className="min-w-0 flex-1 truncate text-2sm text-gray-700">{msg.text}</span>
              <span className="shrink-0 font-mono text-2xs text-gray-600">{msg.time}</span>
            </li>
          );
        })}
      </ul>

      {/* 모인 결과: 주문서 한 장. 주황 테두리와 그림자로 이 카드만 띄운다 */}
      <div
        className={`absolute inset-x-4 bottom-4 rounded-xl bg-white p-4 ring-1 ring-primary/40 shadow-[0_16px_40px_-16px_rgba(255,101,62,0.5)] transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          merged ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-2sm font-bold text-gray-900">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            새 예약 주문
          </span>
          <span className="font-mono text-2xs tracking-[0.1em] text-gray-600">Picake</span>
        </div>
        <dl className="mt-3 grid grid-cols-[64px_1fr] gap-y-2 text-2sm">
          <dt className="text-gray-600">픽업</dt>
          <dd className="font-bold text-gray-900">토요일 오후 2:00</dd>
          <dt className="text-gray-600">상품</dt>
          <dd className="text-gray-800">초코 케이크 · 1호</dd>
          <dt className="text-gray-600">레터링</dt>
          <dd className="text-gray-800">“생일 축하해”</dd>
          <dt className="text-gray-600">참고 사진</dt>
          <dd className="text-gray-800">1장 첨부</dd>
        </dl>
      </div>
    </div>
  );
}
