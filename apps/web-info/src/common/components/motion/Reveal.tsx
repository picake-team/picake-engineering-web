"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** 등장 순서를 어긋나게 할 지연(ms). 같은 묶음 안에서 0 -> 80 -> 160 식으로 준다 */
  delay?: number;
  className?: string;
}

/**
 * 스크롤로 화면에 들어올 때 한 번만 올라오며 나타나는 래퍼.
 *
 * `window.addEventListener("scroll")`을 쓰지 않는다. 스크롤 이벤트는 매 프레임 메인 스레드를
 * 깨워 저사양 안드로이드 웹뷰에서 스크롤이 끊긴다. IntersectionObserver는 브라우저가
 * 합성 단계에서 처리하므로 비용이 거의 없다.
 *
 * 한 번 나타난 뒤에는 관찰을 끊는다. 다시 접었다 펴는 연출은 읽는 흐름을 방해한다.
 */
export function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 모션을 줄이도록 설정한 사용자에게는 애니메이션 없이 즉시 보여준다
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    // 첫 화면에 이미 들어와 있는 요소는 관찰 결과를 기다리지 않고 바로 재생한다.
    // IntersectionObserver만 믿으면 초기 레이아웃이 잡히기 전에 "안 보임"으로 판정되는 경우가 있어,
    // 히어로의 CTA가 사용자가 스크롤할 때까지 투명한 채로 남는 일이 생긴다.
    // 이 effect는 첫 페인트 뒤에 실행되므로 여기서 켜도 등장 트랜지션과 지연은 그대로 살아 있다.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      // 요소가 화면 가장자리에 걸치자마자가 아니라, 조금 올라왔을 때 재생한다.
      // 이 값을 백분율(-12% 등)로 주면 안 된다. 뷰포트가 짧은 기기에서 제외 구간이 100px을 넘고,
      // 페이지 맨 끝 요소가 통째로 그 안에 들어가면 더 스크롤할 곳이 없어 영영 나타나지 않는다.
      // 고정 64px이면 아래 여백(40px)을 둔 마지막 요소도 항상 제외 구간 위로 걸친다.
      { rootMargin: "0px 0px -64px 0px", threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={`transition-[opacity,transform] duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      } ${className}`}
    >
      {children}
    </div>
  );
}
