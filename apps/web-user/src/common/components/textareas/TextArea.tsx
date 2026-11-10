import React from "react";

/**
 * TextArea 컴포넌트
 *
 * @example
 * // 기본 사용
 * <TextArea value={value} onChange={setValue} placeholder="내용을 입력해주세요" />
 *
 * @example
 * // 라벨 포함
 * <TextArea label="요청사항" value={value} onChange={setValue} />
 *
 * @example
 * // 에러 상태
 * <TextArea value={value} onChange={setValue} error="필수 입력 항목입니다" />
 *
 * @example
 * // 글자 수 제한
 * <TextArea value={value} onChange={setValue} maxLength={200} showCount />
 */

interface TextAreaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange"
> {
  /** 텍스트 값 */
  value: string;
  /** 값 변경 핸들러 */
  onChange: (value: string) => void;
  /** 라벨 텍스트 또는 ReactNode */
  label?: React.ReactNode;
  /** 글자 수 표시 여부 */
  showCount?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  value,
  onChange,
  label,
  maxLength,
  placeholder,
  disabled,
  className = "",
  showCount,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && <label className="block mb-[10px] text-sm font-bold text-gray-900">{label}</label>}
      <textarea
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={`w-full h-[96px] py-[10px] px-[12px] text-sm border border-gray-100 rounded-lg outline-none resize-none transition-colors duration-base focus:border-gray-900 ${className}`}
      />
      {showCount && maxLength && (
        <div className="mt-[6px] text-xs text-gray-400 text-right">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
};
