"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { useUserCurrentLocationStore } from "@/apps/web-user/common/store/user-current-location.store";
import { useProductList } from "@/apps/web-user/features/product/hooks/queries/useProductList";
import { useStoreDetail } from "@/apps/web-user/features/store/hooks/queries/useStoreDetail";
import { SortBy, Product } from "@/apps/web-user/features/product/types/product.type";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { Icon } from "@/apps/web-user/common/components/icons";
import { openExternalUrl } from "@/apps/web-user/common/utils/external-link.util";
import {
  getGoogleOAuthLoginUrl,
  getKakaoOAuthLoginUrl,
} from "@/apps/web-user/features/auth/utils/oauth-login-url.util";
import {
  oauthGoogleLoginButtonClassName,
  oauthKakaoLoginButtonClassName,
  oauthLoginButtonIconClassName,
} from "@/apps/web-user/common/components/buttons/oauth-provider-login-buttons";

export default function QAPage() {
  const { isAuthenticated, handleLogoutByEnvironment } = useAuthStore();
  const { address, latitude, longitude, setLocation, setAddress } = useUserCurrentLocationStore();
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [geocodeResponse, setGeocodeResponse] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [googleAuthHref, setGoogleAuthHref] = useState<string | null>(null);
  const [kakaoAuthHref, setKakaoAuthHref] = useState<string | null>(null);

  useEffect(() => {
    setGoogleAuthHref(getGoogleOAuthLoginUrl());
  }, []);

  useEffect(() => {
    setKakaoAuthHref(getKakaoOAuthLoginUrl());
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationError("navigator.geolocation 사용 불가 (브라우저 미지원)");
      return;
    }
    setLocationStatus("loading");
    setGeocodeResponse(null);
    setLocationError(null);

    const startedAt = Date.now();
    const isSecure = typeof window !== "undefined" ? window.isSecureContext : false;
    const protocol = typeof window !== "undefined" ? window.location.protocol : "?";
    const host = typeof window !== "undefined" ? window.location.host : "?";
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "?";

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(latitude, longitude);

        // 원시 API 응답 직접 확인
        try {
          const res = await fetch(`/api/geocode?latitude=${latitude}&longitude=${longitude}`);
          const rawData = await res.json();
          setGeocodeResponse(JSON.stringify(rawData, null, 2));
          const result = rawData?.documents?.[0];
          if (result) setAddress(`${result.region_1depth_name} ${result.region_2depth_name}`);
        } catch (e) {
          setGeocodeResponse(`fetch 오류: ${e}`);
        }

        setLocationStatus("success");
      },
      (error) => {
        const elapsed = Date.now() - startedAt;
        const codeName =
          error.code === 1
            ? "PERMISSION_DENIED"
            : error.code === 2
              ? "POSITION_UNAVAILABLE"
              : error.code === 3
                ? "TIMEOUT"
                : "UNKNOWN";
        const details = [
          `code: ${error.code} (${codeName})`,
          `message: ${error.message || "(empty)"}`,
          `elapsed: ${elapsed}ms`,
          `isSecureContext: ${isSecure}`,
          `protocol: ${protocol}`,
          `host: ${host}`,
          `userAgent: ${ua}`,
        ].join("\n");
        console.error("위치 요청 실패:", details);
        setLocationError(details);
        setLocationStatus("error");
      },
    );
  };

  const { data: latestData } = useProductList({ sortBy: SortBy.LATEST, limit: 10 });
  const { data: popularData } = useProductList({ sortBy: SortBy.POPULAR, limit: 10 });

  const allProducts: Product[] = [
    ...(latestData?.pages?.[0]?.data ?? []),
    ...(popularData?.pages?.[0]?.data ?? []),
  ];
  const uniqueStoreIds = [...new Set(allProducts.map((p) => p.storeId).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-5 h-[52px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-yellow-500 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
            QA
          </span>
          <span className="font-bold text-gray-900 text-sm">테스트 페이지</span>
        </div>
        <Link
          href={PATHS.HOME}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          <Icon name="chevronLeft" width={16} height={16} />
          홈으로
        </Link>
      </div>

      <div className="px-5 py-6 flex flex-col gap-6">
        {/* 위치 섹션 */}
        <section className="bg-white rounded-2xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">위치</h2>
            </div>
            <button
              onClick={handleGetLocation}
              disabled={locationStatus === "loading"}
              className="px-4 py-2 text-xs font-bold text-white bg-green-500 rounded-xl hover:bg-green-400 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {locationStatus === "loading" ? "불러오는 중..." : "현재 위치 가져오기"}
            </button>
          </div>
          <div className="flex flex-col gap-1.5 text-xs text-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-400">주소</span>
              <span className="font-bold text-gray-800">{address ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">위도</span>
              <span>{latitude ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">경도</span>
              <span>{longitude ?? "-"}</span>
            </div>
            {locationStatus === "error" && (
              <div className="mt-1">
                <p className="text-red-400 text-xs">위치 권한이 거부됐거나 오류가 발생했습니다.</p>
                {locationError && (
                  <pre className="mt-2 bg-red-50 border border-red-200 rounded-xl p-3 text-[10px] text-red-700 overflow-x-auto whitespace-pre-wrap break-all">
                    {locationError}
                  </pre>
                )}
              </div>
            )}
            {geocodeResponse && (
              <div className="mt-3">
                <span className="text-gray-400 block mb-1">/api/geocode 응답</span>
                <pre className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[10px] text-gray-700 overflow-x-auto whitespace-pre-wrap break-all">
                  {geocodeResponse}
                </pre>
              </div>
            )}
          </div>
        </section>

        {/* 인증 섹션 */}
        <section className="bg-white rounded-2xl p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">로그인</h2>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span
              className={`w-2 h-2 rounded-full ${isAuthenticated ? "bg-green-400" : "bg-red-400"}`}
            />
            <span className="text-sm text-gray-700">
              {isAuthenticated ? "로그인됨" : "로그아웃 상태"}
            </span>
          </div>

          {!isAuthenticated && googleAuthHref && (
            <div className="flex flex-col gap-2">
              <a href={googleAuthHref} className={oauthGoogleLoginButtonClassName}>
                <Image
                  src="/images/contents/google.png"
                  alt=""
                  width={20}
                  height={20}
                  className={oauthLoginButtonIconClassName}
                />
                Google로 계속하기
              </a>
              {kakaoAuthHref && (
                <a href={kakaoAuthHref} className={oauthKakaoLoginButtonClassName}>
                  <Image
                    src="/images/contents/kakaotalk.png"
                    alt=""
                    width={20}
                    height={20}
                    className={oauthLoginButtonIconClassName}
                  />
                  Kakao로 계속하기
                </a>
              )}
            </div>
          )}

          {isAuthenticated && (
            <div className="pt-4 mt-3 border-t border-gray-100">
              <button
                onClick={() => void handleLogoutByEnvironment()}
                className="w-full px-4 py-2.5 text-xs font-bold text-white bg-red-500 rounded-2xl hover:bg-red-400 transition-colors"
              >
                로그아웃
              </button>
            </div>
          )}
        </section>

        {/* 페이지 링크 섹션 */}
        <section className="bg-white rounded-2xl p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              페이지 이동
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href={PATHS.HOME}
              className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <span>홈</span>
              <Icon name="arrow" width={16} height={16} className="rotate-90 text-gray-400" />
            </Link>
            <button
              onClick={() => {
                openExternalUrl(
                  "supertoss://send?bank=농협&accountNo=3521047093883&amount=10000",
                ).catch((error) => console.warn("토스를 열지 못했습니다:", error));
              }}
              className="flex items-center justify-between w-full px-4 py-3 bg-[#0064FF]/10 rounded-xl text-sm text-[#0064FF] hover:bg-[#0064FF]/20 transition-colors text-left"
            >
              <span>토스 송금</span>
              <Icon name="arrow" width={16} height={16} className="rotate-90 text-[#0064FF]" />
            </button>

            {/* 스토어 목록 */}
            <div className="flex items-center justify-between px-1 pt-2 pb-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                스토어 목록
              </span>
              <span className="text-xs text-gray-400">{uniqueStoreIds.length}개</span>
            </div>
            {uniqueStoreIds.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">스토어 데이터 없음</p>
            ) : (
              uniqueStoreIds.map((storeId) => <StoreItem key={storeId} storeId={storeId} />)
            )}
          </div>
        </section>

        {/* 배포·CI 버전 (클라이언트 번들에 박힌 NEXT_PUBLIC_* ) */}
        <section className="bg-white rounded-2xl p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">버전 정보</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            GitHub Actions 빌드 시 주입됩니다. 로컬에서는 보통 비어 있습니다.
          </p>

          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">GitHub</p>
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 space-y-1">
                <p className="text-[10px] font-mono text-gray-400">GITHUB_SHA</p>
                <p className="text-xs font-mono text-gray-900 break-all leading-relaxed">
                  {process.env.NEXT_PUBLIC_GITHUB_SHA?.trim() ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StoreItem({ storeId }: { storeId: string }) {
  const { data: store } = useStoreDetail(storeId);

  const handleNaverClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (store) {
      const appUrl = `nmap://map?lat=${store.latitude}&lng=${store.longitude}&zoom=15&appname=com.example.picake`;
      openExternalUrl(appUrl).catch((error) =>
        console.warn("네이버 지도를 열지 못했습니다:", error),
      );
    }
  };

  const handleKakaoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (store) {
      const appUrl = `kakaomap://look?p=${store.latitude},${store.longitude}`;
      openExternalUrl(appUrl).catch((error) => console.warn("카카오맵을 열지 못했습니다:", error));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/store/${storeId}`}
        className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors truncate"
      >
        🏪 {storeId}
      </Link>
      {store && (
        <>
          <button
            onClick={handleNaverClick}
            className="px-3 py-3 text-xs font-bold text-white bg-[#03C75A] rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            네이버
          </button>
          <button
            onClick={handleKakaoClick}
            className="px-3 py-3 text-xs font-bold text-black bg-[#FEE500] rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            카카오
          </button>
        </>
      )}
    </div>
  );
}
