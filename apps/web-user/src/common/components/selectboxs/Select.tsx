"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@/apps/web-user/common/components/icons";

/**
 * Select 옵션 타입
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  subLabel?: string;
}

/**
 * 커스텀 Select 컴포넌트 (div/ul/li 기반)
 *
 * @example
 * <Select
 *   value={selectedSize}
 *   onChange={setSelectedSize}
 *   label="사이즈 선택"
 *   options={[
 *     { value: "", label: "사이즈를 선택해주세요" },
 *     { value: "도시락", label: "도시락" },
 *     { value: "미니", label: "미니 (1~2인)" },
 *     { value: "1호", label: "1호 (2~3인)" },
 *     { value: "2호", label: "2호 (4~5인)" },
 *     { value: "3호", label: "3호 (6~8인)" },
 *   ]}
 * />
 */
interface SelectProps<T = string> {
  /** 선택된 값 */
  value: T;
  /** 값 변경 핸들러 */
  onChange: (value: T) => void;
  /** 옵션 목록 */
  options: SelectOption<T>[];
  /** 라벨 텍스트 */
  label?: string;
  /** 에러 메시지 */
  error?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 추가 클래스명 */
  className?: string;
  /** 외부에서 드롭다운을 열기 위한 신호 */
  openSignal?: number;
  /** 라벨 옆에 회색 "(선택)" 표시 (선택 입력 항목) */
  optional?: boolean;
}

export const Select = <T extends string | number = string>({
  value,
  onChange,
  options,
  label,
  error,
  disabled = false,
  className = "",
  openSignal,
  optional = false,
}: SelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const lastOpenSignalRef = useRef(openSignal);

  // 선택된 옵션의 라벨 찾기
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || "";

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (openSignal === undefined) return;
    if (lastOpenSignalRef.current === openSignal) return;
    lastOpenSignalRef.current = openSignal;
    if (!disabled) {
      setIsOpen(true);
      triggerRef.current?.focus();
    }
  }, [openSignal, disabled]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (option: SelectOption<T>) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block mb-[10px] text-sm font-bold text-gray-900">
          {label} {optional && <span className="font-normal text-gray-300">(선택)</span>}
        </label>
      )}
      <div className="relative">
        {/* 트리거 버튼 */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          aria-label={label || "Select"}
          ref={triggerRef}
          className={`
            w-full h-[42px] pl-[12px] pr-[36px] text-left text-sm
            border border-gray-100 transition-colors outline-none
            ${isOpen ? "rounded-t-lg border-b-0" : "rounded-lg"}
            ${isOpen && !value ? "bg-gray-50 text-gray-500" : value ? "bg-white text-gray-900" : "bg-white text-gray-500"}
            ${className}
          `
            .trim()
            .replace(/\s+/g, " ")}
        >
          <span className="flex items-center justify-between w-full">
            <span>{displayLabel}</span>
            {selectedOption?.subLabel && (
              <span className="text-gray-900">{selectedOption.subLabel}</span>
            )}
          </span>
        </button>
        <Icon
          name="selectArrow"
          width={20}
          height={20}
          className={`
            absolute right-[12px] top-[11px] text-gray-400 pointer-events-none
            transition-transform duration-200
            ${isOpen ? "rotate-0" : "rotate-180"}
          `
            .trim()
            .replace(/\s+/g, " ")}
        />

        {/* 드롭다운 메뉴 */}
        {isOpen && (
          <ul className="w-full bg-white border border-gray-100 border-t-0 rounded-b-lg max-h-[200px] overflow-y-auto">
            {options
              .filter((option) => option.value !== "")
              .map((option) => (
                <li
                  key={String(option.value)}
                  onClick={() => handleSelect(option)}
                  className="flex items-center justify-between px-[12px] h-[42px] text-sm cursor-pointer transition-colors text-gray-900"
                >
                  <span>{option.label}</span>
                  {option.subLabel && <span className="text-gray-900">{option.subLabel}</span>}
                </li>
              ))}
          </ul>
        )}
      </div>
      {error && <p className="mt-[6px] text-xs text-red-400">{error}</p>}
    </div>
  );
};
