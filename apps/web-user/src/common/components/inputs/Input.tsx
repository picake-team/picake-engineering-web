import { motionDuration } from "@picake/design-tokens";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /**
   * 회원가입(휴대폰 인증) 등 — 42px 높이, grayscale 보더·타이포
   * @default "default"
   */
  variant?: "default" | "register";
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  variant = "default",
  style: styleProp,
  className,
  onFocus,
  onBlur,
  ...rest
}) => {
  const isRegister = variant === "register";

  const baseStyle: React.CSSProperties = isRegister
    ? {
        width: "100%",
        height: "42px",
        padding: "10px 12px",
        border: `1px solid ${error ? "#e74c3c" : "var(--grayscale-gr-100, #EBEBEA)"}`,
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: 400,
        color: "var(--grayscale-gr-900, #1F1F1E)",
        outline: "none",
        transition: `border-color ${motionDuration.base}ms`,
        ...styleProp,
      }
    : {
        width: "100%",
        height: "48px",
        padding: "0 16px",
        border: `1px solid ${error ? "#e74c3c" : "#e0e0e0"}`,
        borderRadius: "6px",
        fontSize: "16px",
        outline: "none",
        transition: `border-color ${motionDuration.base}ms`,
        ...styleProp,
      };

  const blurBorderDefault = error
    ? "#e74c3c"
    : isRegister
      ? "var(--grayscale-gr-100, #EBEBEA)"
      : "#e0e0e0";
  const focusBorderDefault = error
    ? "#e74c3c"
    : isRegister
      ? "var(--grayscale-gr-200, #D4D4D3)"
      : "#007bff";

  const inputClassName = [className, isRegister ? "placeholder:text-gray-300" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div style={{ width: "100%" }}>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#333",
          }}
        >
          {label}
        </label>
      )}
      <input
        {...rest}
        className={inputClassName || undefined}
        style={baseStyle}
        onFocus={(e) => {
          e.target.style.borderColor = focusBorderDefault;
          onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = blurBorderDefault;
          onBlur?.(e);
        }}
      />
      {error && (
        <p
          style={{
            marginTop: "6px",
            fontSize: "12px",
            color: "#e74c3c",
            marginBottom: 0,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};
