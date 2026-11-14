// 손님 웹 `common/components/images/ImageLightbox.tsx`(사장님 견적 링크)에 같은 것이 있다. 고치면 같이 고친다(11-14)
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  RotateCcw,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/apps/web-seller/common/utils/classname.util";

export interface ImageLightboxProps {
  /** 표시할 이미지 URL 목록 */
  images: string[];
  /** 처음 보여줄 이미지 인덱스 */
  initialIndex?: number;
  alt?: string;
  onClose: () => void;
  /**
   * 사진 저장을 대신할 함수(판매자 앱: 휴대폰 사진첩). true를 돌려주면 브라우저 다운로드를 하지 않는다.
   * 있으면 버튼 이름도 "사진 저장"이 된다.
   */
  onSave?: (src: string) => boolean;
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 5;
const ZOOM_STEP = 0.5;
const WHEEL_STEP = 0.25;

interface Transform {
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

const INITIAL_TRANSFORM: Transform = { scale: 1, rotation: 0, offsetX: 0, offsetY: 0 };

const clampScale = (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));

/** 이미지 확대 보기 라이트박스 (줌 · 팬 · 회전 · 좌우 이동) */
export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex = 0,
  alt = "이미지",
  onClose,
  onSave,
}) => {
  const total = images.length;
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(total - 1, 0)),
  );
  const [transform, setTransform] = useState<Transform>(INITIAL_TRANSFORM);

  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const isZoomed = transform.scale > 1;

  const resetTransform = useCallback(() => setTransform(INITIAL_TRANSFORM), []);

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      const clamped = (next + total) % total;
      setIndex(clamped);
      resetTransform();
    },
    [total, resetTransform],
  );

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  const zoom = useCallback((delta: number) => {
    setTransform((prev) => {
      const scale = clampScale(prev.scale + delta);
      // 원래 크기로 돌아오면 위치도 초기화
      if (scale === 1) return { ...prev, scale, offsetX: 0, offsetY: 0 };
      return { ...prev, scale };
    });
  }, []);

  const rotate = useCallback((delta: number) => {
    setTransform((prev) => ({ ...prev, rotation: prev.rotation + delta }));
  }, []);

  // 키보드 단축키
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goPrev();
          break;
        case "ArrowRight":
          goNext();
          break;
        case "+":
        case "=":
          zoom(ZOOM_STEP);
          break;
        case "-":
        case "_":
          zoom(-ZOOM_STEP);
          break;
        case "r":
        case "R":
          rotate(90);
          break;
        case "0":
          resetTransform();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, goPrev, goNext, zoom, rotate, resetTransform]);

  // 배경 스크롤 잠금
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      zoom(e.deltaY < 0 ? WHEEL_STEP : -WHEEL_STEP);
    },
    [zoom],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isZoomed) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragState.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: transform.offsetX,
        originY: transform.offsetY,
      };
    },
    [isZoomed, transform.offsetX, transform.offsetY],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    setTransform((prev) => ({
      ...prev,
      offsetX: drag.originX + (e.clientX - drag.startX),
      offsetY: drag.originY + (e.clientY - drag.startY),
    }));
  }, []);

  const endDrag = useCallback((e: React.PointerEvent) => {
    if (dragState.current?.pointerId === e.pointerId) {
      dragState.current = null;
    }
  }, []);

  const currentSrc = images[index];

  const handleDownload = useCallback(async () => {
    if (!currentSrc) return;
    if (onSave?.(currentSrc)) return;
    try {
      const res = await fetch(currentSrc, { mode: "cors" });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = currentSrc.split("/").pop()?.split("?")[0] || "image";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      // CORS 등으로 fetch 실패 시 새 탭으로 열기
      window.open(currentSrc, "_blank", "noopener,noreferrer");
    }
  }, [currentSrc, onSave]);

  const imageStyle = useMemo<React.CSSProperties>(
    () => ({
      transform: `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
      transition: dragState.current ? "none" : "transform 0.2s ease-out",
      cursor: isZoomed ? (dragState.current ? "grabbing" : "grab") : "default",
      touchAction: "none",
    }),
    [transform, isZoomed],
  );

  if (total === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="이미지 확대 보기"
    >
      {/* 상단 네비게이션 + 닫기 */}
      {total > 1 && (
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center p-4">
          <div className="flex items-center gap-0.5 rounded-full bg-black/55 px-2 py-1.5 shadow-xl backdrop-blur">
            <ToolbarButton onClick={goPrev} label="이전 이미지 (←)">
              <ChevronLeft className="h-5 w-5" />
            </ToolbarButton>
            <span className="min-w-12 px-1 text-center text-sm font-medium tabular-nums text-white/90">
              {index + 1} / {total}
            </span>
            <ToolbarButton onClick={goNext} label="다음 이미지 (→)">
              <ChevronRight className="h-5 w-5" />
            </ToolbarButton>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-end p-4">
        <ToolbarButton onClick={onClose} label="닫기 (Esc)">
          <X className="h-5 w-5" />
        </ToolbarButton>
      </div>

      {/* 이미지 영역 */}
      <div
        className="relative z-[5] flex h-full w-full items-center justify-center overflow-hidden"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => (isZoomed ? resetTransform() : zoom(1))}
        onClick={(e) => {
          // 이미지 바깥 여백(확대되지 않은 상태) 클릭 시 닫기
          if (e.target === e.currentTarget && !isZoomed) onClose();
        }}
      >
        <img
          key={index}
          src={currentSrc}
          alt={alt}
          draggable={false}
          className="max-h-[82vh] max-w-[92vw] select-none rounded-lg object-contain shadow-2xl"
          style={imageStyle}
        />
      </div>

      {/* 하단 툴바 */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center p-4">
        <div className="flex items-center gap-0.5 rounded-full bg-black/55 px-2 py-1.5 shadow-xl backdrop-blur">
          <ToolbarButton
            onClick={() => zoom(-ZOOM_STEP)}
            label="축소 (-)"
            disabled={transform.scale <= ZOOM_MIN}
          >
            <ZoomOut className="h-5 w-5" />
          </ToolbarButton>
          <span className="w-12 text-center text-xs font-medium tabular-nums text-white/80">
            {Math.round(transform.scale * 100)}%
          </span>
          <ToolbarButton
            onClick={() => zoom(ZOOM_STEP)}
            label="확대 (+)"
            disabled={transform.scale >= ZOOM_MAX}
          >
            <ZoomIn className="h-5 w-5" />
          </ToolbarButton>

          <Divider />

          <ToolbarButton onClick={() => rotate(-90)} label="왼쪽으로 회전">
            <RotateCcw className="h-5 w-5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => rotate(90)} label="오른쪽으로 회전 (R)">
            <RotateCw className="h-5 w-5" />
          </ToolbarButton>

          <Divider />

          <ToolbarButton
            onClick={resetTransform}
            label="초기화 (0)"
            disabled={
              transform.scale === 1 &&
              transform.rotation % 360 === 0 &&
              transform.offsetX === 0 &&
              transform.offsetY === 0
            }
          >
            <RefreshCw className="h-5 w-5" />
          </ToolbarButton>
          <ToolbarButton onClick={handleDownload} label={onSave ? "사진 저장" : "다운로드"}>
            <Download className="h-5 w-5" />
          </ToolbarButton>
        </div>
      </div>
    </div>
  );
};

interface ToolbarButtonProps {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  label,
  disabled,
  className,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className={cn(
      "pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent",
      className,
    )}
  >
    {children}
  </button>
);

const Divider: React.FC = () => <span className="mx-1 h-5 w-px bg-white/20" />;
