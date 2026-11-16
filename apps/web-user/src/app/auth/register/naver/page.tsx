"use client";

import { Suspense } from "react";
import { NaverRegisterVerificationScreen } from "@/apps/web-user/features/auth/components/KakaoRegisterVerificationScreen";

export default function NaverRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-white">
          <p className="text-sm text-gray-600">불러오는 중...</p>
        </div>
      }
    >
      <NaverRegisterVerificationScreen />
    </Suspense>
  );
}
