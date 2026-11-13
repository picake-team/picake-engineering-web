import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import {
  KAKAO_CHANNEL_CHAT_URL,
  SELLER_SIGNUP_URL,
} from "@/apps/web-info/common/constants/partner.constants";
import {
  BUSINESS_INFO,
  INSTAGRAM_URL,
  KAKAO_CHANNEL_URL,
  SITE_BASE_URL,
  SITE_OG_IMAGE,
} from "@/apps/web-info/common/constants/site.constants";
import LogoPicake from "@/apps/web-info/common/assets/logo-picake.svg";
import { JsonLd } from "@/apps/web-info/common/components/seo/JsonLd";
import { StickyJoinCta } from "@/apps/web-info/features/seller/components/StickyJoinCta";
import photoBento from "@/apps/web-info/features/seller/assets/photo-bento.jpg";
import photoFlower from "@/apps/web-info/features/seller/assets/photo-flower.jpg";
import photoLettering from "@/apps/web-info/features/seller/assets/photo-lettering.jpg";
import photoStrawberry from "@/apps/web-info/features/seller/assets/photo-strawberry.jpg";
import screenCalendar from "@/apps/web-info/features/seller/assets/screen-calendar.png";
import screenHome from "@/apps/web-info/features/seller/assets/screen-home.png";
import screenLink from "@/apps/web-info/features/seller/assets/screen-link.png";
import screenOrder from "@/apps/web-info/features/seller/assets/screen-order.png";
import screenQuoteRequest from "@/apps/web-info/features/seller/assets/screen-quote-request.png";
import screenQuoteReserved from "@/apps/web-info/features/seller/assets/screen-quote-reserved.png";
import screenQuoteSend from "@/apps/web-info/features/seller/assets/screen-quote-send.png";

/**
 * 사장님 입점 소개 페이지 (`https://info.picakes.com/seller/about`). 2026-11-14 다시 만듦(기획 I-49).
 *
 * 내세우는 순서는 사장님이 실제로 한 말을 따른다(기획 R-03 설문, R-04 방문·답장).
 *   ① 견적으로 예약 받기 — "디자인에 따라 가격이 많이 달라 정해진 상품을 올리는 앱은 쓰기 어렵다", 가격 문의·디자인 상담
 *   ② 주문서 — 주문 내용 누락, 손님도 카톡에 길게 치기 불편(R-11)
 *   ③ 가게 링크 — Picake 손님 수와 상관없이 지금 오는 손님을 데려오는 길, "손님 가입이 간편해야"
 *   ④ 달력·홈 — "주문서가 등록되면 캘린더에 바로"(네이버에도 있어 짧게)
 *   ⑤ 자주 묻는 질문 — 망설이는 이유(네이버·1년 뒤 비용·결제·배달)에 답한다. 질문-답 글이라 AI 답변이 그대로 인용하기 좋다
 *   ⑥ 조건 — 1년 0원은 제목이 아니라 마지막에("0원이어도 기능을 보고 정하겠다")
 *   ⑦ 운영사 — 로고·두루랩스·사업자 정보(믿음)
 * 손님 알림톡 자동 안내(입금 확인을 꼽은 사장님 없음)와 채팅 단독 소개는 넣지 않는다.
 *
 * 모양: 사진이 화면을 채우고 실제 판매자 화면을 사진 위에 얹는다(홈 배너 MK-13과 같은 방식).
 * 그림·아이콘·빛번짐·번호 머리표는 쓰지 않는다(운영자: "AI가 만든 느낌").
 *
 * 내용의 근거(없는 기능·수치·후기는 쓰지 않는다)
 * - 견적: 가게 화면 "○○에 물어보기"(StoreQuoteEntry) → 판매자 채팅 요청서 카드 → 견적 보내기 → 손님이 고르고 예약 신청(기획 I-46·I-01, P-88)
 * - 주문서: 상품 옵션(사이즈·맛·레터링 문구·참고 사진)과 픽업 일시
 * - 가게 링크: 판매자 앱 "손님에게 링크 보내기"의 최근 30일 숫자(I-45), 손님은 가입 전에 끝까지 고르고 마지막에 로그인(I-59)
 * - 조건: 입점 혜택 문장(P-60, picake-hq marketing/outreach.md와 같은 말), 네이버 예약 상품 가져오기(I-43),
 *   입금은 손님이 가게 정산 계좌로 직접(F-09), 매장 픽업만, 스토어 만들기 2단계(F-22)
 *
 * 화면 그림: 로컬 테스트 DB의 예시 가게 "달콤스토어"(실제 가게·손님·주문 아님). 견적·링크는 2026-11-14, 주문서·달력·홈은 11-07 스토어 스크린샷.
 * 사진: Unsplash 라이선스(상업 사용·수정 무료, 출처 표시 의무 없음)
 *   lettering K5m3jklvfvQ(@sincerelymedia) · bento rIiGJGOPLIw(@regsultik) · strawberry cZFU60dKB6U(@amir_v_ali) · flower lqM8r5cg5k4(Kash Tandon)
 */
/**
 * 검색·AI 답변용 문구(2026-11-14). 사장님이 검색할 말(주문제작 케이크·예약·견적)과 한글·영문 이름(픽케이크·Picake)을 앞에 둔다.
 * 설명 첫 문장은 "○○는 …예요" 한 문장 정의라 AI 답변이 그대로 인용하기 좋다. 사실은 아래 근거 주석과 같다.
 */
const TITLE = "주문제작 케이크 예약·견적 받기 | 픽케이크 사장님 입점";
const DESCRIPTION =
  "픽케이크(Picake)는 주문제작 케이크를 주문서와 견적으로 예약받는 서비스예요. 사진으로 묻는 손님께 금액만 보내면 고른 견적으로 예약 신청이 들어오고, 정해진 케이크는 주문서로 받아요. 입점하신 날부터 1년 동안 이용료·수수료는 0원이에요.";
/** DM 링크 미리보기는 검색 제목보다 첫 화면 문장이 눈에 띈다 */
const SHARE_TITLE = "사진으로 묻는 손님께 금액만 보내세요 | 픽케이크 사장님 입점";
const SHARE_DESCRIPTION =
  "디자인마다 가격이 다른 케이크는 견적으로, 정해진 케이크는 주문서로. 입점하신 날부터 1년 동안 이용료·수수료 0원.";
const PAGE_URL = `${SITE_BASE_URL}/seller/about`;
/** DM 미리보기 그림(1200×630 JPG): 첫 화면과 같은 사진·문장·로고. 원본 HTML은 picake-hq marketing/banners/2026-11-i49 */
const SHARE_IMAGE = {
  url: `${SITE_BASE_URL}/images/og/seller-about.jpg`,
  width: 1200,
  height: 630,
  alt: "픽케이크 사장님 입점: 사진으로 묻는 손님께 금액만 보내세요",
  type: "image/jpeg",
};

/**
 * 자주 묻는 질문. 사장님이 망설이는 이유(네이버·1년 뒤 비용·결제·배달)에 답하고, 같은 글을 FAQPage 구조화 데이터로도 쓴다.
 * 펼치기 없이 모두 보이게 둔다(검색·AI가 읽는 글과 화면 글이 같아야 한다).
 */
const FAQS = [
  {
    q: "픽케이크는 어떤 서비스예요?",
    a: "주문제작 케이크를 주문서와 견적으로 예약받는 서비스예요. 손님은 픽케이크에서 가게를 찾아 예약하고, 사장님은 판매자 페이지에서 받아요.",
  },
  {
    q: "네이버 예약을 이미 쓰는데 같이 써도 되나요?",
    a: "네. 네이버는 그대로 두시고, 레터링·참고 사진이 필요한 주문제작 케이크만 픽케이크로 받아도 돼요. 네이버 예약에 올린 상품은 링크로 가져와요.",
  },
  {
    q: "1년 뒤에는 얼마예요?",
    a: "아직 정하지 않았어요. 먼저 함께하시는 사장님들 의견을 듣고 정할게요. 비용을 받게 되면 최소 3개월 전에 알려 드리고, 원치 않으시면 언제든 그만두실 수 있어요.",
  },
  {
    q: "손님 결제는 어떻게 받나요?",
    a: "손님이 가게 계좌로 바로 입금하고, 사장님이 입금을 확인하면 예약이 확정돼요. 정산을 기다리지 않아요.",
  },
  { q: "배달도 되나요?", a: "지금은 매장 픽업 주문만 받아요." },
];

export const metadata: Metadata = {
  // 레이아웃의 "%s | Picake"를 붙이지 않는다(제목이 길어져 검색 결과에서 잘린다)
  title: { absolute: TITLE },
  description: DESCRIPTION,
  // 정보 사이트의 공개 랜딩이라 검색에 노출한다
  alternates: { canonical: "/seller/about" },
  // DM으로 보낸 링크 미리보기에 사장님용 문구가 보이게 한다(레이아웃 기본값은 손님 소개 문구)
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/seller/about",
    siteName: "Picake",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
};

/**
 * 구조화 데이터: 운영사(Organization)와 이 페이지(WebPage)가 무엇을 소개하는지(Service).
 * 화면에 있는 사실만 쓴다. 가격은 "입점일부터 1년 0원"이라 숫자 가격(price)으로 쓰지 않고 설명으로만 둔다.
 */
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://picakes.com/#organization",
      name: "Picake",
      alternateName: ["픽케이크"],
      url: "https://picakes.com",
      logo: SITE_OG_IMAGE.url,
      sameAs: [INSTAGRAM_URL, KAKAO_CHANNEL_URL],
    },
    {
      "@type": "WebPage",
      "@id": `${PAGE_URL}#webpage`,
      url: PAGE_URL,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "ko-KR",
      publisher: { "@id": "https://picakes.com/#organization" },
      audience: { "@type": "BusinessAudience", audienceType: "주문제작 케이크 가게 사장님" },
      mainEntity: {
        "@type": "Service",
        name: "픽케이크 사장님 입점",
        serviceType: "주문제작 케이크 예약·견적 관리",
        provider: { "@id": "https://picakes.com/#organization" },
        areaServed: { "@type": "Country", name: "대한민국" },
        description:
          "손님이 사진·픽업 날짜·예산으로 견적을 물으면 사장님이 금액을 보내고, 손님이 고르면 그 견적으로 예약 신청이 들어온다. 정해진 케이크는 사이즈·맛·레터링·참고 사진·픽업 시간을 담은 주문서로 받는다. 가게 링크로 들어온 손님 수와 예약 수를 보여 준다. 입점일부터 1년 동안 이용료·수수료 0원, 처음 상품 등록 대행, 네이버 예약 상품 가져오기, 손님 입금은 가게 계좌로 바로, 매장 픽업 주문.",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${PAGE_URL}#faq`,
      mainEntity: FAQS.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

const HERO_CTA_ID = "seller-hero-cta";
const CLOSING_ID = "seller-closing";
const FOOTER_ID = "seller-footer";

/** 바탕색. 사진 가장자리와 어울리는 따뜻한 밝은색과 어두운 초콜릿색(홈 배너 MK-13 어두운 바탕과 같은 값) */
const PAPER = "bg-[#F6F3EE]";
const COCOA = "bg-[#1B1512]";
/** 밝은 바탕 위 작은 주황 글씨는 진한 주황이어야 읽힌다(홈 배너 머리말과 같은 값) */
const KICKER_ON_PAPER = "text-[13px] font-bold text-[#B5401C]";
const KICKER_ON_DARK = "text-[14px] font-bold text-primary-200";
const CHAPTER_TITLE = "text-[clamp(20px,6vw,24px)] leading-[1.36] font-bold tracking-[-0.03em]";
const BODY = "text-base leading-[1.7] text-gray-700";

function JoinButton({ id, tone }: { id?: string; tone: "light" | "primary" }) {
  return (
    <a
      id={id}
      href={SELLER_SIGNUP_URL}
      className={`flex h-[54px] w-full items-center justify-center rounded-xl text-[17px] font-bold transition-transform duration-150 active:scale-[0.98] ${
        // 주황 위 글자는 진하게(흰 글자는 대비 2.9:1로 기준 4.5:1 미달, 진한 글자 5.6:1)
        tone === "light" ? "bg-white text-gray-900" : "bg-primary text-gray-900"
      }`}
    >
      입점 신청하기
    </a>
  );
}

/** 실제 판매자 화면 그림. 위쪽만 보이게 자르고, 사진 위에 얹을 때 그림자를 준다 */
function Screen({
  src,
  alt,
  className = "",
}: {
  src: StaticImageData;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[20px] bg-white shadow-[0_24px_48px_-24px_rgba(27,21,18,0.55),0_0_0_1px_rgba(0,0,0,0.06)] ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        sizes="(min-width: 640px) 240px, 50vw"
        className="block h-auto w-full"
      />
    </div>
  );
}

/**
 * 사진 한 장 + 그 위에 걸친 화면 + 제목. `flip`이면 화면이 왼쪽, 제목이 오른쪽.
 * 화면 칸은 폭의 46%(최대 220px)라 320px 폭에서도 제목 칸이 남는다. 화면은 사진에 150px 걸친다.
 */
function Chapter({
  photo,
  photoPosition,
  screen,
  screenAlt,
  kicker,
  title,
  flip = false,
  children,
}: {
  photo: StaticImageData;
  photoPosition: string;
  screen: StaticImageData;
  screenAlt: string;
  kicker: string;
  title: React.ReactNode;
  flip?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="pb-16">
      <div className="relative h-[300px] overflow-hidden">
        <Image
          src={photo}
          alt=""
          fill
          sizes="(min-width: 640px) 640px, 100vw"
          className="object-cover"
          style={{ objectPosition: photoPosition }}
        />
      </div>
      <div
        className={`relative -mt-[150px] grid items-start gap-4 px-5 ${
          flip
            ? "grid-cols-[min(46%,220px)_minmax(0,1fr)]"
            : "grid-cols-[minmax(0,1fr)_min(46%,220px)]"
        }`}
      >
        {/* 제목은 늘 사진 아래에서 시작한다(좁은 폭에서 화면이 작아져도 사진 위에 글이 걸치지 않게) */}
        <div className={`pt-[166px] ${flip ? "order-2" : ""}`}>
          <p className={KICKER_ON_PAPER}>{kicker}</p>
          <h2 className={`mt-2 ${CHAPTER_TITLE} text-gray-900`}>{title}</h2>
        </div>
        <Screen src={screen} alt={screenAlt} className="aspect-[2/3]" />
      </div>
      <div className="mt-7 px-5">{children}</div>
    </section>
  );
}

export default function SellerAboutPage() {
  return (
    <main className={`relative min-h-screen w-full ${PAPER} text-gray-900`}>
      <JsonLd data={STRUCTURED_DATA} />
      {/* 1. 첫 화면: 케이크 사진 위에 한 문장. JS를 기다리지 않고 바로 보인다 */}
      <section className={`relative h-[700px] overflow-hidden ${COCOA} text-white`}>
        <Image
          src={photoLettering}
          alt=""
          fill
          priority
          // 첫 화면의 가장 큰 그림(LCP)이라 먼저 받는다(priority만으로는 fetchpriority가 붙지 않았다, Lighthouse 2026-11-14)
          fetchPriority="high"
          sizes="(min-width: 640px) 640px, 100vw"
          className="object-cover"
          style={{ objectPosition: "46% 50%" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_top,rgba(27,21,18,0.94)_0%,rgba(27,21,18,0.62)_40%,rgba(27,21,18,0)_64%),linear-gradient(to_bottom,rgba(27,21,18,0.45),rgba(27,21,18,0)_18%)]"
        />
        {/* 로고: 앱·스토어에서 보게 될 마크와 한글 이름. 링크는 걸지 않는다(소개 페이지에서 손님 화면으로 나가지 않게) */}
        <p className="absolute top-3.5 left-5 flex items-center gap-2 text-[18px] font-extrabold tracking-[-0.03em]">
          <LogoPicake aria-hidden className="h-8 w-8" />
          픽케이크
        </p>
        <div className="absolute inset-x-5 bottom-8">
          {/* 머리말도 h1 안에 둔다. 검색엔진이 읽는 제목에 "주문제작 케이크"가 들어가고, 보이는 모양은 같다 */}
          <h1>
            <span className={`block ${KICKER_ON_DARK}`}>주문제작 케이크 가게 사장님께</span>
            <span className="mt-2.5 block text-[clamp(28px,8.4vw,34px)] leading-[1.3] font-bold tracking-[-0.035em]">
              사진으로 묻는 손님께
              <br />
              금액만 보내세요
            </span>
          </h1>
          <p className="mt-3 text-base leading-[1.6] text-white/85">
            손님이 고르면 그 견적으로 예약 신청이 들어와요. 정해진 케이크는 주문서로 받아요.
          </p>
          <div className="mt-6">
            <JoinButton id={HERO_CTA_ID} tone="light" />
          </div>
          <a
            href={KAKAO_CHANNEL_CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block py-1 text-center text-sm text-white/75 underline underline-offset-4"
          >
            궁금한 건 카카오톡으로 물어보세요
          </a>
        </div>
      </section>

      {/* 2. 견적: 디자인마다 가격이 다른 케이크 */}
      <Chapter
        photo={photoBento}
        photoPosition="50% 62%"
        screen={screenQuoteRequest}
        screenAlt="판매자 앱 채팅에 온 손님 견적 요청서. 참고 사진, 픽업 날짜와 시간, 1호 케이크, 예산 4만~6만원, 레터링 설명과 견적 보내기 버튼(예시)"
        kicker="견적"
        title={
          <>
            디자인마다
            <br />
            가격이 달라도
            <br />
            괜찮아요
          </>
        }
      >
        <p className={BODY}>
          손님이 가게 화면에서 <b className="text-gray-900">사진·픽업 날짜·예산</b>을 보내면
          채팅으로 요청서가 와요. 금액만 적어 보내고, 손님이 고르면{" "}
          <b className="text-gray-900">그 견적으로 예약 신청</b>이 들어와요.
        </p>
        <div className="mt-7 flex max-w-[440px] flex-col gap-5">
          <figure>
            <Screen
              src={screenQuoteSend}
              alt="견적 보내기 창. 금액 52,000원을 적고 사진과 얼마나 비슷하게 만들지 '거의 똑같이'를 고른 모습(예시)"
              className="rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
            />
            <figcaption className="mt-2.5 text-[15px] leading-[1.5] text-gray-700">
              <b className="mr-1.5 text-gray-900">금액만 적어서 보내요.</b>
              사진과 얼마나 비슷하게 만들지도 골라요.
            </figcaption>
          </figure>
          <figure>
            <Screen
              src={screenQuoteReserved}
              alt="채팅에 '견적을 보냈어요', '손님이 이 견적을 골랐어요'와 예약신청 카드가 이어진 모습(예시)"
              className="rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
            />
            <figcaption className="mt-2.5 text-[15px] leading-[1.5] text-gray-700">
              <b className="mr-1.5 text-gray-900">손님이 고르면 예약으로 와요.</b>
              확인·입금·픽업은 다른 예약과 같아요.
            </figcaption>
          </figure>
        </div>
      </Chapter>

      {/* 3. 주문서: 정해진 케이크 */}
      <Chapter
        flip
        photo={photoStrawberry}
        photoPosition="30% 40%"
        screen={screenOrder}
        screenAlt="판매자 앱 주문 상세. 픽업 일시, 예약자, 주문 항목과 레터링 문구가 한 화면에 보이는 모습(예시)"
        kicker="주문서"
        title={
          <>
            정해진
            <br />
            케이크는
            <br />
            주문서로
          </>
        }
      >
        <p className={BODY}>
          상품에 <b className="text-gray-900">레터링 문구·참고 사진</b> 칸을 넣어 두면, 손님이
          사이즈·맛·픽업 시간과 함께 골라서 보내요. 카톡으로 하나씩 다시 묻지 않아도 돼요.
        </p>
      </Chapter>

      {/* 4. 가게 링크: 지금 오는 손님을 그대로 */}
      <Chapter
        photo={photoFlower}
        photoPosition="50% 50%"
        screen={screenLink}
        screenAlt="판매자 앱 '손님에게 링크 보내기' 창. 최근 30일 링크로 온 손님 48명, 예약 신청 9건(예시)"
        kicker="가게 링크"
        title={
          <>
            인스타에
            <br />
            링크 하나
          </>
        }
      >
        <p className={BODY}>
          카톡 채널·인스타 프로필에 걸어 두면 지금 오시는 손님이 그대로 주문서·견적으로 와요. 손님은{" "}
          <b className="text-gray-900">가입 전에 끝까지 골라 보고</b>, 링크로 몇 명이 들어와 몇 건
          예약했는지 숫자로 보여요.
        </p>
      </Chapter>

      {/* 5. 달력과 홈: 짧게 */}
      <section className="px-5 pt-2 pb-[72px]">
        <h2 className={CHAPTER_TITLE}>
          들어온 예약은
          <br />
          달력과 홈에 바로
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <figure>
            <div className="h-[210px] overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
              <Image
                src={screenCalendar}
                alt="판매자 앱 캘린더. 날짜마다 픽업 수가 점으로 보이고 아래에 그날 픽업 목록(예시)"
                sizes="(min-width: 640px) 300px, 50vw"
                className="block h-auto w-full"
              />
            </div>
            <figcaption className="mt-2 text-sm leading-[1.45] text-gray-700">
              날짜별 픽업 수가 보여요
            </figcaption>
          </figure>
          <figure>
            <div className="h-[210px] overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
              <Image
                src={screenHome}
                alt="판매자 앱 홈. 이번 주 날짜와 처리할 주문(예약 확인·입금 확인·픽업 처리) 개수(예시)"
                sizes="(min-width: 640px) 300px, 50vw"
                className="block h-auto w-full"
              />
            </div>
            <figcaption className="mt-2 text-sm leading-[1.45] text-gray-700">
              확인부터 픽업 완료까지
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 6. 자주 묻는 질문: 펼치기 없이 모두 보인다 */}
      <section className="px-5 pt-2 pb-[72px]">
        <h2 className={CHAPTER_TITLE}>자주 묻는 질문</h2>
        <dl className="mt-[18px] border-t border-gray-900">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="border-b border-[#E3DED6] py-4">
              <dt className="text-base leading-[1.5] font-bold text-gray-900">{q}</dt>
              <dd className="mt-1.5 text-[15px] leading-[1.65] text-gray-700">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 7. 조건과 시작: 페이지에서 유일한 어두운 칸 */}
      <section id={CLOSING_ID} className={`${COCOA} px-5 pt-[72px] pb-14 text-white`}>
        <p className={KICKER_ON_DARK}>함께 시작할 첫 가게를 찾고 있어요</p>
        <h2 className="mt-2.5 text-[clamp(28px,8vw,32px)] leading-[1.3] font-bold tracking-[-0.035em]">
          1년 동안
          <br />
          이용료·수수료 0원
        </h2>
        <p className="mt-4 text-base leading-[1.7] text-white/80">
          입점하신 날부터 1년이에요. 그 뒤에 비용을 받게 되더라도 최소 3개월 전에 먼저 알려 드리고,
          원치 않으시면 언제든 그만두실 수 있어요.
        </p>
        <ul className="mt-6 border-t border-white/15">
          {[
            ["처음 상품 등록은 저희가 대신", "사진과 가격만 보내 주세요"],
            ["네이버 예약에 올린 상품은 그대로", "링크를 넣으면 사진·가격·사이즈·옵션을 가져와요"],
            ["입금은 사장님 계좌로 바로", "정산을 기다리지 않아요. 지금은 매장 픽업 주문만 받아요"],
            ["두 단계면 가게가 열려요", "사업자등록번호 확인 → 매장 정보 입력"],
          ].map(([title, sub]) => (
            <li key={title} className="border-b border-white/15 py-3.5">
              <p className="text-base leading-[1.5] text-white/95">{title}</p>
              <p className="mt-0.5 text-sm leading-[1.5] text-white/60">{sub}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-2">
          <JoinButton tone="primary" />
          <a
            href={KAKAO_CHANNEL_CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[54px] w-full items-center justify-center rounded-xl border border-white/35 text-[17px] font-bold text-white transition-transform duration-150 active:scale-[0.98]"
          >
            카카오톡으로 물어보기
          </a>
        </div>
      </section>

      {/* 8. 운영사: 누가 운영하는지 보여 믿음을 준다(검색·AI가 회사 이름을 잇는 데도 쓴다) */}
      <footer
        id={FOOTER_ID}
        className={`${COCOA} border-t border-white/10 px-5 pt-5 pb-[calc(36px+env(safe-area-inset-bottom))] text-xs leading-[1.75] text-white/55`}
      >
        <p className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-white/80">
          <LogoPicake aria-hidden className="h-5 w-5" />
          픽케이크(Picake) · 주문제작 케이크 예약 서비스
        </p>
        <p>
          {BUSINESS_INFO.name} · 대표 {BUSINESS_INFO.representative} · 사업자등록번호{" "}
          {BUSINESS_INFO.registrationNumber}
        </p>
        <p>
          통신판매업 {BUSINESS_INFO.mailOrderNumber} · 문의 {BUSINESS_INFO.email}
        </p>
      </footer>

      <StickyJoinCta watchIds={[HERO_CTA_ID, CLOSING_ID, FOOTER_ID]} />
    </main>
  );
}
