"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const THUMB_WIDTH_PX = 24;

const THUMB_CSS = `
  .dual-thumb-range-slider-thumb::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid var(--grayscale-gr-200, #D4D4D3);
    background: var(--grayscale-gr-00, #FFFFFF);
    box-shadow: 0px 2px 5px 0px #0000000F;
  }
`;

const styles = {
  label:
    "absolute whitespace-nowrap text-[13px] font-bold leading-[140%] text-gray-900 -translate-x-1/2 top-0",
  hint: "mt-2 flex justify-between text-xs font-normal leading-[140%] text-gray-400",
} as const;

export interface DualThumbRangeSliderProps {
  /** 스케일 최소값 (정수) */
  min: number;
  /** 스케일 최대값 (정수) */
  max: number;
  /** 현재 최소값 */
  valueMin: number;
  /** 현재 최대값 */
  valueMax: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  /** 썸/힌트에 표시할 라벨 포맷 */
  formatLabel: (value: number) => string;
  /** 그룹 aria-label */
  ariaLabel?: string;
  /** 최소 썸 aria-label */
  ariaLabelMin?: string;
  /** 최대 썸 aria-label */
  ariaLabelMax?: string;
  className?: string;
}

export function DualThumbRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onMinChange,
  onMaxChange,
  formatLabel,
  ariaLabel = "범위 선택",
  ariaLabelMin = "최소값",
  ariaLabelMax = "최대값",
  className = "",
}: DualThumbRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const activeThumbRef = useRef<"min" | "max" | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTrackWidth(el.offsetWidth));
    ro.observe(el);
    setTrackWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const thumbLeftPercent = useCallback(
    (value: number): number => {
      if (trackWidth <= 0) {
        return ((value - min) / (max - min)) * 100;
      }
      const range = max - min;
      const fraction = (value - min) / range;
      const centerPx = THUMB_WIDTH_PX / 2 + fraction * (trackWidth - THUMB_WIDTH_PX);
      return (centerPx / trackWidth) * 100;
    },
    [trackWidth, min, max],
  );

  const clientXToValue = useCallback(
    (clientX: number): number => {
      const el = trackRef.current;
      if (!el) return min;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const fraction = Math.max(0, Math.min(1, x / rect.width));
      const value = Math.round(min + fraction * (max - min));
      return Math.max(min, Math.min(max, value));
    },
    [min, max],
  );

  const getThumbAt = useCallback(
    (clientX: number): "min" | "max" => {
      const el = trackRef.current;
      if (!el) return "min";
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const minCenterPx = (thumbLeftPercent(valueMin) / 100) * rect.width;
      const maxCenterPx = (thumbLeftPercent(valueMax) / 100) * rect.width;
      return x < (minCenterPx + maxCenterPx) / 2 ? "min" : "max";
    },
    [valueMin, valueMax, thumbLeftPercent],
  );

  const applyValueAt = useCallback(
    (clientX: number) => {
      if (activeThumbRef.current === null) return;
      const value = clientXToValue(clientX);
      if (activeThumbRef.current === "min") {
        onMinChange(Math.max(min, Math.min(value, valueMax)));
      } else {
        onMaxChange(Math.max(valueMin, Math.min(value, max)));
      }
    },
    [min, max, valueMin, valueMax, clientXToValue, onMinChange, onMaxChange],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const thumb = getThumbAt(e.clientX);
      activeThumbRef.current = thumb;
      const value = clientXToValue(e.clientX);
      if (thumb === "min") {
        onMinChange(Math.min(value, valueMax));
      } else {
        onMaxChange(Math.max(value, valueMin));
      }
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [valueMin, valueMax, getThumbAt, clientXToValue, onMinChange, onMaxChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (activeThumbRef.current === null) return;
      applyValueAt(e.clientX);
    },
    [applyValueAt],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    activeThumbRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  const overlayRef = useRef<HTMLDivElement>(null);
  const applyValueAtRef = useRef(applyValueAt);
  const getThumbAtRef = useRef(getThumbAt);
  const clientXToValueRef = useRef(clientXToValue);
  const onMinChangeRef = useRef(onMinChange);
  const onMaxChangeRef = useRef(onMaxChange);
  const valueMinRef = useRef(valueMin);
  const valueMaxRef = useRef(valueMax);
  const minRef = useRef(min);
  const maxRef = useRef(max);

  applyValueAtRef.current = applyValueAt;
  getThumbAtRef.current = getThumbAt;
  clientXToValueRef.current = clientXToValue;
  onMinChangeRef.current = onMinChange;
  onMaxChangeRef.current = onMaxChange;
  valueMinRef.current = valueMin;
  valueMaxRef.current = valueMax;
  minRef.current = min;
  maxRef.current = max;

  /** React touch 핸들러는 passive라 preventDefault 불가 → 네이티브 리스너로 스크롤·시트 드래그 전파 차단 */
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.stopPropagation();
      const clientX = e.touches[0]!.clientX;
      const thumb = getThumbAtRef.current(clientX);
      activeThumbRef.current = thumb;
      const value = clientXToValueRef.current(clientX);
      if (thumb === "min") {
        onMinChangeRef.current(Math.min(value, valueMaxRef.current));
      } else {
        onMaxChangeRef.current(Math.max(value, valueMinRef.current));
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1 || activeThumbRef.current === null) return;
      e.preventDefault();
      e.stopPropagation();
      applyValueAtRef.current(e.touches[0]!.clientX);
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.stopPropagation();
      activeThumbRef.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  const fillLeft = ((valueMin - min) / (max - min)) * 100;
  const fillWidth = ((valueMax - valueMin) / (max - min)) * 100;

  return (
    <div className={`mx-auto w-full max-w-[99%] ${className}`.trim()}>
      <div className="relative w-full pt-7">
        <span className={styles.label} style={{ left: `${thumbLeftPercent(valueMin)}%` }}>
          {formatLabel(valueMin)}
        </span>
        <span className={styles.label} style={{ left: `${thumbLeftPercent(valueMax)}%` }}>
          {formatLabel(valueMax)}
        </span>
        <div ref={trackRef} className="relative h-6 w-full" role="group" aria-label={ariaLabel}>
          <div
            className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gray-50"
            aria-hidden
          />
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
            style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
            aria-hidden
          />
          <input
            type="range"
            min={min}
            max={max}
            value={valueMin}
            onChange={(e) => {
              const v = Number(e.target.value);
              onMinChange(v);
              if (v > valueMax) onMaxChange(v);
            }}
            className="dual-thumb-range-slider-thumb absolute left-0 top-0 z-[1] h-6 w-full cursor-pointer appearance-none bg-transparent pointer-events-none"
            aria-label={ariaLabelMin}
            tabIndex={-1}
          />
          <input
            type="range"
            min={min}
            max={max}
            value={valueMax}
            onChange={(e) => {
              const v = Number(e.target.value);
              onMaxChange(v);
              if (v < valueMin) onMinChange(v);
            }}
            className="dual-thumb-range-slider-thumb absolute left-0 top-0 z-[2] h-6 w-full cursor-pointer appearance-none bg-transparent pointer-events-none"
            aria-label={ariaLabelMax}
            tabIndex={-1}
          />
          <div
            ref={overlayRef}
            className="absolute inset-0 z-[3] cursor-pointer touch-none"
            style={{ touchAction: "none" }}
            aria-hidden
            onPointerDown={(e) => {
              e.stopPropagation();
              handlePointerDown(e);
            }}
            onPointerMove={(e) => {
              e.stopPropagation();
              handlePointerMove(e);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              handlePointerUp(e);
            }}
            onPointerLeave={(e) => {
              e.stopPropagation();
              handlePointerUp(e);
            }}
            onPointerCancel={(e) => {
              e.stopPropagation();
              handlePointerUp(e);
            }}
          />
        </div>
      </div>
      <div className={styles.hint}>
        <span>{formatLabel(min)}</span>
        <span>{formatLabel(max)}</span>
      </div>
      <style dangerouslySetInnerHTML={{ __html: THUMB_CSS }} />
    </div>
  );
}
