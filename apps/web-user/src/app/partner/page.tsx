import type { Metadata } from "next";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PARTNER_SURVEY_URL } from "@/apps/web-user/common/constants/partner.constants";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";

/**
 * 오프라인에서 만나는 입점 희망 사장님께 보여주는 QR 진입점(`https://picakes.com/partner`).
 *
 * QR에는 이 주소만 담고 실제 목적지는 코드에서 정합니다 — 설문 폼 주소나 운영 도메인이 바뀌어도
 * 이미 배포한 QR을 회수할 필요가 없게 하기 위함입니다
 * ({@link ../../common/constants/partner.constants.ts}).
 *
 * 자동 리다이렉트를 걸지 않고 버튼 두 개를 직접 고르게 합니다. 찍는 사람의 상황이
 * "아직 입점 전(설문)"과 "이미 입점(운영 페이지)"으로 갈리기 때문에 서버가 대신 판단할 수 없습니다.
 */
export const metadata: Metadata = {
  title: "사장님 입점 안내",
  description:
    "Picake는 케이크 전문 매장을 위한 주문·예약 플랫폼입니다. 판매자 페이지에서 매장을 운영하거나, 사전 수요조사에 참여해 주세요.",
  // 오프라인 QR 전용 경유 페이지라 검색 노출은 불필요합니다.
  robots: { index: false, follow: false },
};

export default function PartnerPage() {
  return (
    // 100vh가 아니라 100dvh — 모바일 브라우저의 100vh는 주소창에 가려지는 영역까지 포함해서
    // 실제 보이는 높이보다 큽니다. 그대로 두면 하단 버튼이 접혀서 스크롤해야 보입니다.
    <main className="min-h-[100dvh] flex flex-col px-5 pt-6 pb-8">
      {/* flex-1 + justify-center: 버튼 위 남는 공간의 세로 중앙에 안내를 배치 */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <Icon name="logoPicake" width={80} height={80} />

        <h1 className="mt-6 text-xl font-bold text-gray-900">
          사장님, Picake에서
          <br />
          케이크를 팔아보세요
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          Picake는 케이크를 찾는 손님과 매장을 이어주는
          <br />
          주문·예약 플랫폼이에요.
          <br />
          주문부터 픽업 관리까지 한 곳에서 처리할 수 있어요.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <a
          href={PARTNER_SURVEY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-[52px] flex items-center justify-center bg-primary text-white text-base font-bold rounded-lg transition-all duration-200"
        >
          입점 사전 수요조사 참여하기
        </a>

        {/*
          next/link가 아니라 일반 <a>를 씁니다. 소개 페이지는 정보 사이트(info.picakes.com)로 옮겨졌고
          /partner/about은 그쪽으로 307 리다이렉트만 합니다. Link는 prefetch·클라이언트 이동으로 RSC를
          fetch하다가 다른 도메인으로 리다이렉트되어 CORS 에러를 남기므로, 처음부터 브라우저 이동을 시킵니다.
          목적지는 next.config의 리다이렉트 한 곳에서만 관리합니다.
        */}
        <a
          href={PATHS.PARTNER_ABOUT}
          className="w-full h-[52px] flex items-center justify-center bg-white text-gray-900 text-base font-bold border border-gray-100 rounded-lg transition-all duration-200"
        >
          소개페이지 바로가기
        </a>
      </div>
    </main>
  );
}
