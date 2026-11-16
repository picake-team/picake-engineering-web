import * as React from "react";
import { cn } from "@/apps/web-user/common/lib/utils";

/** OAuth 로그인 버튼 공통 — 아이콘 `Image`에 함께 사용 (20×20) */
export const oauthLoginButtonIconClassName = "size-[20px] shrink-0 object-contain";

export const oauthKakaoLoginButtonClassName = cn(
  "relative flex h-[52px] w-full items-center justify-center gap-[6px] rounded-2lg border-0 bg-[#FFEB00] text-base font-bold leading-none text-gray-900",
);

export const oauthGoogleLoginButtonClassName = cn(
  "relative flex h-[52px] w-full items-center justify-center gap-[6px] rounded-2lg border border-solid border-gray-100 bg-white text-base font-bold leading-none text-gray-900",
);

/** Apple Human Interface Guidelines 권장 "Sign in with Apple" 버튼(검정 배경) */
export const oauthAppleLoginButtonClassName = cn(
  "relative flex h-[52px] w-full items-center justify-center gap-[6px] rounded-2lg border-0 bg-black text-base font-bold leading-none text-white",
);

export const OAuthKakaoLoginButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, type = "button", ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(oauthKakaoLoginButtonClassName, className)}
    {...props}
  />
));
OAuthKakaoLoginButton.displayName = "OAuthKakaoLoginButton";

export const OAuthGoogleLoginButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, type = "button", ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(oauthGoogleLoginButtonClassName, className)}
    {...props}
  />
));
OAuthGoogleLoginButton.displayName = "OAuthGoogleLoginButton";

export const OAuthAppleLoginButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, type = "button", ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(oauthAppleLoginButtonClassName, className)}
    {...props}
  />
));
OAuthAppleLoginButton.displayName = "OAuthAppleLoginButton";

/** 애플 로고 글리프 — 다른 provider처럼 PNG 에셋을 쓰지 않고 인라인 SVG로 렌더링 */
export function AppleLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 384 512"
      aria-hidden
      className={cn(oauthLoginButtonIconClassName, className)}
      fill="currentColor"
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}
