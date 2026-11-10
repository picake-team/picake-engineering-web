"use client";

import { useEffect, useState } from "react";
import { Icon, iconTypes } from "@/apps/web-user/common/components/icons";
import { Spinner } from "@/apps/web-user/common/components/spinners/Spinner";

interface ToastProps {
  message: string;
  iconName?: keyof typeof iconTypes;
  iconClassName?: string;
  variant?: "row" | "column";
  position?: "bottom" | "center";
  showSpinner?: boolean;
  spinnerClassName?: string;
  duration?: number;
  onClose: () => void;
}

export function Toast({
  message,
  iconName,
  iconClassName,
  variant = "row",
  position = "bottom",
  showSpinner = false,
  spinnerClassName = "text-primary",
  duration = 2000,
  onClose,
}: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 마운트 직후 fade-in
    const showTimer = setTimeout(() => setVisible(true), 10);
    // duration 후 제자리에서 fade-out(150ms) → unmount
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 150);
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onClose]);

  // 토스트는 제자리에서 나타났다 사라진다(공용 움직임 값: 나타날 때 base·enter, 사라질 때 fast·exit)
  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 w-max max-w-[calc(100%-40px)] z-50 transition-opacity ${
        position === "center" ? "top-1/2 -translate-y-1/2" : "bottom-[100px]"
      } ${visible ? "opacity-100 duration-base ease-enter" : "opacity-0 duration-fast ease-exit"}`}
    >
      {variant === "row" ? (
        <div className="flex items-center gap-[6px] px-[18px] py-4 bg-gray-900/80 backdrop-blur-sm rounded-xl">
          {showSpinner && <Spinner size={20} className={spinnerClassName} />}
          {!showSpinner && iconName && (
            <Icon name={iconName} width={20} height={20} className={`shrink-0 ${iconClassName}`} />
          )}
          <span className="text-sm text-white font-bold min-w-0 break-words">{message}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 px-[46px] py-[36px] bg-gray-900/80 backdrop-blur-sm rounded-xl">
          {showSpinner && <Spinner size={40} className={spinnerClassName} />}
          {!showSpinner && iconName && (
            <Icon name={iconName} width={40} height={40} className={iconClassName} />
          )}
          <span className="text-sm text-white font-bold min-w-0 break-words">{message}</span>
        </div>
      )}
    </div>
  );
}
