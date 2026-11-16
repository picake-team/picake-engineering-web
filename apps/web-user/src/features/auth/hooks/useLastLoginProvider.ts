"use client";

import { useEffect, useState } from "react";
import {
  readLastLoginProvider,
  type LastLoginProvider,
} from "@/apps/web-user/features/auth/utils/last-login-provider.util";

/**
 * 마지막으로 로그인한 방법. 서버에서 그린 화면과 어긋나지 않게 화면이 뜬 뒤에 읽는다.
 * 로그인 창처럼 계속 붙어 있는 화면은 열릴 때(`active`가 true가 될 때)마다 다시 읽는다 — 로그인했다 로그아웃한 뒤 바로 열어도 맞게.
 */
export function useLastLoginProvider(active = true): LastLoginProvider | null {
  const [provider, setProvider] = useState<LastLoginProvider | null>(null);
  useEffect(() => {
    if (active) setProvider(readLastLoginProvider());
  }, [active]);
  return provider;
}
