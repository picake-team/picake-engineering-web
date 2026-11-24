"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";

import { PC_FRAME, PHONE_FRAME } from "@/apps/web-info/common/components/landing/landing.styles";

/**
 * 실제 앱을 눌러 가며 녹화한 짧은 사용법 영상(소리 없음, 반복). 화면 그림(`PhoneShot`·`PcShot`)과 같은 틀·같은 자리에 들어간다
 * (2026-11-24 운영자 "소개페이지에 동영상", 유튜브 등 다른 곳에는 올리지 않음). 만드는 법은 docs/web-info/README.md "사용법 영상".
 *
 * - 처음에는 포스터(그 칸을 가장 잘 보여 주는 장면) 그림만 받는다. 칸이 화면 가까이 오면 영상을 받고,
 *   반 넘게 보이면 포스터 장면부터 재생, 벗어나면 멈춘다(첫 화면 속도와 데이터를 아낀다).
 * - 휴대폰 "동작 줄이기"·데이터 절약이면 저절로 재생하지 않고 포스터만 둔다(누르면 재생).
 * - 화면 위 투명 버튼으로 누르면 멈춤·다시 재생(5초 넘게 움직이는 것은 멈출 수 있어야 한다). 멈춰 있으면 오른쪽 아래에 재생 표시.
 * - 화면 읽기 프로그램에는 포스터 그림의 `alt`(영상에서 하는 일)를 읽힌다.
 */
export function ShotVideo({
  src,
  poster,
  start = 0,
  alt,
  frame,
  className = "",
  sizes,
}: {
  /** `public/` 아래 mp4 주소(H.264). 파일을 바꾸면 `?v=`를 올린다 */
  src: string;
  /** 대표 장면 그림(영상의 `start`초 장면과 같아야 재생이 이어 보인다) */
  poster: StaticImageData;
  /** 재생을 시작할 초(포스터 장면) */
  start?: number;
  alt: string;
  frame: "phone" | "pc";
  /** 크기·위치(폭). 높이는 영상 비율을 따른다 */
  className?: string;
  sizes?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  /** 저절로 재생해도 되는지(동작 줄이기·데이터 절약이 아니면) */
  const [auto, setAuto] = useState(false);
  /** 영상 주소를 붙였는지 */
  const [load, setLoad] = useState(false);
  /** 포스터 장면으로 옮겨 재생할 준비가 됐는지 */
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  /** 사람이 누른 것: null이면 저절로(auto) 따른다 */
  const [manual, setManual] = useState<"play" | "pause" | null>(null);
  const [playing, setPlaying] = useState(false);
  /** 영상이 그려지기 시작했는지(그 전에는 포스터만) */
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData;
    const canAuto = !reduce && !saveData;
    setAuto(canAuto);
    const el = boxRef.current;
    if (!el) return;
    const near = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting && canAuto) {
          setLoad(true);
          near.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    const seen = new IntersectionObserver(([e]) => setVisible((e?.intersectionRatio ?? 0) >= 0.5), {
      threshold: [0, 0.5, 1],
    });
    near.observe(el);
    seen.observe(el);
    return () => {
      near.disconnect();
      seen.disconnect();
    };
  }, []);

  const shouldPlay = ready && visible && (manual === "play" || (manual === null && auto));
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (shouldPlay) void v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [shouldPlay]);

  const toggle = () => {
    if (playing) {
      setManual("pause");
      return;
    }
    setManual("play");
    setLoad(true);
  };

  const showPlayBadge = !playing && (manual === "pause" || (!auto && manual === null));

  return (
    <div
      ref={boxRef}
      className={`relative ${frame === "phone" ? PHONE_FRAME : PC_FRAME} ${className}`}
    >
      <Image
        src={poster}
        alt={alt}
        sizes={
          sizes ??
          (frame === "phone"
            ? "(min-width: 768px) 300px, 260px"
            : "(min-width: 1024px) 640px, 90vw")
        }
        className={
          frame === "phone" ? "block h-auto w-full" : "block h-full w-full object-cover object-top"
        }
      />
      {load ? (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          disablePictureInPicture
          className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`}
          onLoadedMetadata={(e) => {
            // 포스터 장면부터(처음·끝의 흰 이음 대신 포스터에서 바로 움직이게)
            e.currentTarget.currentTime = Math.min(
              start,
              Math.max(0, e.currentTarget.duration - 0.5),
            );
            setReady(true);
          }}
          onPlaying={() => {
            setPlaying(true);
            setShown(true);
          }}
          onPause={() => setPlaying(false)}
        />
      ) : null}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "사용법 영상 멈추기" : "사용법 영상 재생"}
        className="absolute inset-0 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary"
      >
        {showPlayBadge ? (
          <span
            aria-hidden
            className="absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-full bg-black/55 text-white"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
            </svg>
          </span>
        ) : null}
      </button>
    </div>
  );
}
