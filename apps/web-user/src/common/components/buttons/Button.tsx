import React from "react";

/**
 * 버튼 스타일 variant
 * - primary: 메인 액션 버튼 (배경: primary 색상, 텍스트: 흰색)
 * - secondary: 보조 버튼 (배경: 회색, 텍스트: 검정)
 * - outline: 테두리 버튼 (배경: 흰색, 테두리: 회색)
 */
type ButtonVariant = "primary" | "secondary" | "outline" | "red";

/**
 * 버튼 크기
 * - sm: 작은 버튼 (높이 40px) - 추후 디자인 작업 예정
 * - md: 중간 버튼 (높이 48px) - 추후 디자인 작업 예정
 * - lg: 큰 버튼 (높이 52px) - 기본값
 */
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 버튼 스타일 variant (기본값: "primary") */
  variant?: ButtonVariant;
  /** 버튼 크기 (기본값: "lg") */
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white",
  red: "bg-red-400 text-white",
  secondary: "bg-gray-200 text-gray-900",
  outline: "bg-white text-gray-900 border border-gray-100",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-[38px] text-sm rounded-md",
  md: "h-[48px] text-base rounded-md",
  lg: "h-[52px] text-base rounded-lg",
};

/**
 * 공통 버튼 컴포넌트
 * - 기본 width: 100% (부모 요소에서 크기 조절)
 *
 * @example
 * // 기본 버튼
 * <Button>확인</Button>
 *
 * @example
 * // outline 스타일, 작은 크기
 * <Button variant="outline" size="sm">취소</Button>
 *
 * @example
 * // 50% 버튼 2개 (wrapper로 크기 조절)
 * <div className="flex gap-[8px]">
 *   <span className="w-1/2"><Button variant="outline">취소</Button></span>
 *   <span className="w-1/2"><Button>확인</Button></span>
 * </div>
 *
 * @example
 * // flex 레이아웃
 * <div className="flex gap-[8px]">
 *   <span className="w-[100px]"><Button variant="outline">취소</Button></span>
 *   <span className="flex-1"><Button>선택완료</Button></span>
 * </div>
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  disabled,
  variant = "primary",
  size = "lg",
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`
        press w-full font-bold rounded-xl px-[10px]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled ? "!bg-gray-200 !text-gray-300 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `
        .trim()
        .replace(/\s+/g, " ")}
    >
      {children}
    </button>
  );
};
