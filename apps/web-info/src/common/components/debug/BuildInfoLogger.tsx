"use client";

import { useEffect } from "react";

/**
 * 앱 부팅 시 클라이언트 콘솔에 빌드/배포 버전 정보를 1회 출력합니다.
 */
export default function BuildInfoLogger() {
  useEffect(() => {
    console.info("%c[Build Info]", "color:#10b981;font-weight:bold;", {
      GITHUB_SHA: process.env.NEXT_PUBLIC_GITHUB_SHA ?? "—",
    });
  }, []);

  return null;
}
