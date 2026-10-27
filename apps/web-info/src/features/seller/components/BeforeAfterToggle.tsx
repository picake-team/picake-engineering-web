"use client";

import { useState } from "react";

type Side = "before" | "after";

/** 주문 하나를 받으려고 오가던 대화 예시. `me`는 사장님이 보낸 메시지 */
const THREAD = [
  { me: false, text: "안녕하세요! 케이크 주문 가능할까요?" },
  { me: true, text: "네 가능해요. 날짜랑 사이즈 알려주세요" },
  { me: false, text: "토요일이요. 1호면 몇 명 먹어요?" },
  { me: true, text: "2~3인분이에요. 맛은 어떤 걸로 할까요?" },
  { me: false, text: "초코요! 레터링도 되나요?" },
  { me: true, text: "네, 문구 보내주세요" },
  { me: false, text: "몇 시까지 찾으러 가면 돼요?" },
  { me: true, text: "입금 확인 후 확정돼요. 계좌는…" },
];

const ORDER_FIELDS = [
  { label: "픽업 일시", value: "토요일 오후 2:00" },
  { label: "상품 · 사이즈", value: "초코 케이크 · 1호" },
  { label: "레터링", value: "“생일 축하해”" },
  { label: "참고 사진", value: "1장 첨부" },
  { label: "예약자", value: "김손님 · 연락처 확인됨" },
];

/**
 * "지금 방식"과 "Picake"를 손가락으로 바꿔 보며 비교하는 토글.
 * 같은 주문 하나가 대화 여러 번이냐, 주문서 한 장이냐의 차이를 보여준다.
 *
 * 선택 상태는 먹색 채움 + 흰 글자로 표현한다. AutoNoticeDemo와 같은 언어를 쓴다.
 * 주황으로 칠하면 "지금 방식"(바꾸려는 쪽)이 추천처럼 보여서 의미가 뒤집힌다.
 */
export function BeforeAfterToggle() {
  const [side, setSide] = useState<Side>("before");

  return (
    <div>
      <div
        role="tablist"
        aria-label="주문 받는 방식 비교"
        className="relative grid grid-cols-2 rounded-full bg-gray-100 p-1"
      >
        <span
          aria-hidden
          className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-gray-900 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            side === "after" ? "translate-x-full" : "translate-x-0"
          }`}
        />
        {(
          [
            ["before", "지금 방식"],
            ["after", "Picake"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={side === key}
            onClick={() => setSide(key)}
            className={`relative z-10 h-10 text-2sm font-bold transition-colors duration-200 ${
              side === key ? "text-white" : "text-gray-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 min-h-[404px]">
        {side === "before" ? (
          <div key="before" role="tabpanel" className="animate-tab-in-backward">
            <div className="flex flex-col gap-1.5 rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
              {THREAD.map((m, i) => (
                <p
                  key={i}
                  style={{ animationDelay: `${i * 45}ms` }}
                  className={`max-w-[78%] animate-in fade-in slide-in-from-bottom-1 fill-mode-both rounded-2xl px-3 py-2 text-2sm motion-reduce:animate-none ${
                    m.me
                      ? "self-end rounded-br-md bg-gray-900 text-white"
                      : "self-start rounded-bl-md bg-white text-gray-800 ring-1 ring-gray-200"
                  }`}
                >
                  {m.text}
                </p>
              ))}
            </div>
            <p className="mt-3.5 text-center text-2sm text-gray-600">
              주문 하나에 <b className="text-gray-900">메시지 {THREAD.length}개</b>, 아직 확정
              전이에요
            </p>
          </div>
        ) : (
          <div key="after" role="tabpanel" className="animate-tab-in-forward">
            <div className="rounded-2xl bg-primary-50 p-4">
              <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
                {/* 흰 배경 위 주황 글자는 대비가 모자라서, 주황을 면으로 쓰고 글자를 먹색으로 얹는다 */}
                <span className="inline-flex rounded-full bg-primary px-2.5 py-1 text-2xs font-bold text-gray-900">
                  주문서 1장
                </span>
                <dl className="mt-3 divide-y divide-gray-100">
                  {ORDER_FIELDS.map((f, i) => (
                    <div
                      key={f.label}
                      style={{ animationDelay: `${i * 60}ms` }}
                      className="flex items-center justify-between py-3 animate-in fade-in slide-in-from-left-2 fill-mode-both motion-reduce:animate-none"
                    >
                      <dt className="text-2sm text-gray-600">{f.label}</dt>
                      <dd className="text-2sm font-bold text-gray-900">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            <p className="mt-3.5 text-center text-2sm text-gray-600">
              손님이 <b className="text-gray-900">앱에서 직접 골라서</b> 보내요. 확인하고 수락만
              하세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
