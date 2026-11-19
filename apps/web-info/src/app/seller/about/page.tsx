import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
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
import { FeatureSheet } from "@/apps/web-info/features/seller/components/FeatureSheet";
import { SellerScreenTabs } from "@/apps/web-info/features/seller/components/SellerScreenTabs";
import { StickyJoinCta } from "@/apps/web-info/features/seller/components/StickyJoinCta";
import photoBento from "@/apps/web-info/features/seller/assets/photo-bento.jpg";
import photoFlower from "@/apps/web-info/features/seller/assets/photo-flower.jpg";
import photoHero from "@/apps/web-info/features/seller/assets/photo-hero.jpg";
import photoStrawberry from "@/apps/web-info/features/seller/assets/photo-strawberry.jpg";
import screenChatFilled from "@/apps/web-info/features/seller/assets/screen-chat-filled.png";
import screenChatPaste from "@/apps/web-info/features/seller/assets/screen-chat-paste.png";
import screenLink from "@/apps/web-info/features/seller/assets/screen-link.png";
import screenOrder from "@/apps/web-info/features/seller/assets/screen-order.png";
import screenQuoteRequest from "@/apps/web-info/features/seller/assets/screen-quote-request.png";
import screenQuoteReserved from "@/apps/web-info/features/seller/assets/screen-quote-reserved.png";
import screenQuoteSend from "@/apps/web-info/features/seller/assets/screen-quote-send.png";
import screenTabCalendar from "@/apps/web-info/features/seller/assets/screen-tab-calendar.png";
import screenTabHome from "@/apps/web-info/features/seller/assets/screen-tab-home.png";
import screenTabOrders from "@/apps/web-info/features/seller/assets/screen-tab-orders.png";
import screenTabStats from "@/apps/web-info/features/seller/assets/screen-tab-stats.png";
import kakaoIcon from "@/apps/web-info/features/seller/assets/kakaotalk.png";

/**
 * 사장님 입점 소개 페이지 (`https://info.picakes.com/seller/about`). 2026-11-14 다시 만듦, 2026-11-17 시안 A(토스플레이스 방식)로 정리(기획 I-49).
 *
 * 모양: 사진이 화면을 채우고 글은 한 줄. 기능은 큰 카드 한 장에 하나, 자세한 설명은 "자세히" 창에.
 * 그림·아이콘·빛번짐·번호 머리표는 쓰지 않는다(운영자: "AI가 만든 느낌").
 *
 * 순서(사장님이 실제로 한 말, 기획 R-03 설문·R-04 방문·답장)
 *   ① 첫 화면 — 견적 먼저("디자인에 따라 가격이 많이 달라 정해진 상품을 올리는 앱은 쓰기 어렵다", 2026-11-17 운영자가 다시 고름)
 *   ② 지금 주문은 어디로 받으세요? — 카카오톡·인스타 DM·네이버 예약·전화를 누르면 맞는 칸으로 내려간다
 *   ③ 기능 카드 — 견적 → 주문서 → 가게 링크 → 카톡 주문 정리 → 달력·매출
 *   ④ 처음 시작은 저희가 — 대신 해 드리는 일(2026-11-17 운영자 결정, hq 마케팅 MK-15). 운영자가 가게를 대신 등록하는 도구(기획 I-41)를 바로 만들기로 해
 *      "해 드려요"로 쓴다. 주문서 링크만 "알려 드려요"(사장님 인스타·카카오 채널 계정은 사장님만 연다)
 *   ⑤ 0원 — 제목이 아니라 끝쪽에("0원이어도 기능을 보고 정하겠다"). 기간이 있는 혜택이 아니다: 2026-11-19 수익 모델로
 *      주문 수수료·월 이용료를 받지 않기로 정함(기획 01 수익 모델·P-60). "평생 무료"는 쓰지 않는다(나중 광고와 어긋나 들림)
 *   ⑥ 자주 묻는 질문 — 펼친 채로(검색·AI가 읽는 글과 화면 글이 같게)
 *   ⑦ 마무리·운영사
 * 손님 알림톡 자동 안내는 따로 칸을 두지 않고 주문서 "자세히"에 한 줄만 둔다(2026-11-14 결정).
 *
 * 내용의 근거(없는 기능·수치·후기는 쓰지 않는다)
 * - 견적: 가게 화면 "○○에 물어보기"(StoreQuoteEntry) → 판매자 채팅 요청서 카드 → 견적 보내기 → 손님이 고르고 예약 신청(기획 I-46·I-01, P-88)
 * - 주문서: 상품 옵션(사이즈·맛·레터링 문구·참고 사진)과 픽업 일시. 알림톡은 백엔드 user-order-alimtalk 템플릿2(예약 확인 → 입금 안내)·4(픽업 24시간 전)·5(픽업 완료 → 후기)
 * - 가게 링크: 판매자 앱 "손님에게 링크 보내기"의 최근 30일 숫자(I-45), 손님은 가입 전에 끝까지 고르고 마지막에 로그인(I-59)
 * - 카톡 주문 정리: 판매자 앱 직접 적은 주문 "대화 붙여 넣기"·캡처 읽기, 같은 달력, 아이폰·구글 캘린더 내보내기(기획 I-42·F-71·P-92, 2026-11-17 상용)
 * - 달력·매출: 판매자 앱 홈·캘린더·주문·주문 통계
 * - 조건: 입점 혜택 문장(P-60, picake-hq marketing/outreach.md와 같은 말), 네이버 예약 상품 가져오기(I-43),
 *   입금은 손님이 가게 정산 계좌로 직접(F-09), 매장 픽업만, 스토어 만들기 2단계(F-22)
 *
 * 화면 그림: 로컬 테스트 DB의 예시 가게 "달콤스토어"(실제 가게·손님·주문 아님). 견적·링크는 2026-11-14, 홈·달력·주문·매출·대화 붙여 넣기는 2026-11-17.
 * 사진: Unsplash·Pexels 라이선스(상업 사용·수정 무료, 출처 표시 의무 없음)
 *   첫 화면 hero: Pexels 32397279(Dana Garcia, 딸기 올린 흰 빈티지 생크림 케이크 — 운영자 2026-11-17 "흰 케이크·흰 배경, 깔끔하게"로 고름)
 *   bento rIiGJGOPLIw(@regsultik) · strawberry cZFU60dKB6U(@amir_v_ali) · flower lqM8r5cg5k4(Kash Tandon) — Unsplash
 */
/**
 * 검색·AI 답변용 문구(2026-11-14). 사장님이 검색할 말(주문제작 케이크·예약·견적)과 한글·영문 이름(픽케이크·Picake)을 앞에 둔다.
 * 설명 첫 문장은 "○○는 …예요" 한 문장 정의라 AI 답변이 그대로 인용하기 좋다. 사실은 아래 근거 주석과 같다.
 */
const TITLE = "주문제작 케이크 예약·견적 받기 | 픽케이크 사장님 입점";
const DESCRIPTION =
  "픽케이크(Picake)는 주문제작 케이크를 주문서와 견적으로 예약받는 서비스예요. 사진으로 묻는 손님께 금액만 보내면 고른 견적으로 예약 신청이 들어오고, 정해진 케이크는 주문서로 받아요. 이용료·수수료는 0원이에요.";
/** DM 링크 미리보기는 검색 제목보다 첫 화면 문장이 눈에 띈다 */
const SHARE_TITLE = "사진으로 묻는 손님께 금액만 보내세요 | 픽케이크 사장님 입점";
const SHARE_DESCRIPTION =
  "디자인마다 가격이 다른 케이크는 견적으로, 정해진 케이크는 주문서로. 이용료·수수료 0원.";
const PAGE_URL = `${SITE_BASE_URL}/seller/about`;
/**
 * DM 미리보기 그림(1200×630 JPG): 첫 화면과 같은 사진(딸기 생크림, 2026-11-17)·문장·로고·흰 바탕. 원본 HTML은 picake-hq marketing/banners/2026-11-i49.
 * 그림을 바꾸면 `?v=`를 올린다(카카오톡·인스타그램이 그림 주소로 옛 그림을 기억한다).
 */
const SHARE_IMAGE = {
  url: `${SITE_BASE_URL}/images/og/seller-about.jpg?v=3`,
  width: 1200,
  height: 630,
  alt: "픽케이크 사장님 입점: 사진으로 묻는 손님께 금액만 보내세요",
  type: "image/jpeg",
};

/** 칸 주소. "지금 주문은 어디로 받으세요?"에서 누르면 여기로 내려간다 */
const ANCHOR = {
  quote: "quote",
  orderForm: "order-form",
  storeLink: "store-link",
  chatOrder: "chat-order",
  calendar: "calendar",
  faqNaver: "faq-naver",
} as const;

/**
 * 자주 묻는 질문. 사장님이 망설이는 이유(네이버·비용·결제·배달)에 답하고, 같은 글을 FAQPage 구조화 데이터로도 쓴다.
 * 펼치기 없이 모두 보이게 둔다(검색·AI가 읽는 글과 화면 글이 같아야 한다).
 */
const FAQS: { q: string; a: string; id?: string }[] = [
  {
    q: "픽케이크는 어떤 서비스예요?",
    a: "주문제작 케이크를 주문서와 견적으로 예약받는 서비스예요. 손님은 픽케이크에서 가게를 찾아 예약하고, 사장님은 판매자 페이지에서 받아요.",
  },
  {
    q: "입점 신청하면 다음은 어떻게 되나요?",
    a: "가입하고 가게를 열면(2단계) 저희가 바로 알고 먼저 연락드려요. 첫 상품 등록과 받아 둔 카톡 주문 옮기기부터 해 드려요.",
  },
  {
    id: ANCHOR.faqNaver,
    q: "네이버 예약을 이미 쓰는데 같이 써도 되나요?",
    a: "네. 네이버는 그대로 두시고, 레터링·참고 사진이 필요한 주문제작 케이크만 픽케이크로 받아도 돼요. 네이버 예약에 올린 상품은 링크로 가져와요.",
  },
  {
    q: "이용료·수수료는 언제까지 0원이에요?",
    a: "기간을 정한 혜택이 아니에요. 주문 수수료와 월 이용료는 받지 않아요.",
  },
  {
    q: "손님 결제는 어떻게 받나요?",
    a: "손님이 가게 계좌로 바로 입금하고, 사장님이 입금을 확인하면 예약이 확정돼요. 정산을 기다리지 않아요.",
  },
  { q: "배달도 되나요?", a: "지금은 매장 픽업 주문만 받아요." },
];

/** 처음 시작에 대신 해 드리는 일(2026-11-17 운영자 결정). 입점 조건(P-60)·카카오 채널·연락 문구와 같은 말이어야 한다 */
const START_HELP = [
  ["처음 상품 등록", "사진과 가격만 보내 주세요"],
  ["지금 받아 둔 카톡 주문", "캡처를 보내 주시면 달력에 넣어 드려요"],
  ["네이버 예약 상품", "예약 링크만 주시면 그대로 옮겨 드려요"],
  // 날마다 받을 수량·주문 마감일은 아직 기능이 없어(기획 I-07) 약속하지 않는다(2026-11-17 검토). 영업 캘린더(F-24)로 되는 것만
  ["크리스마스 같은 대목", "대목 상품과 픽업 날짜·영업시간을 맞춰 드려요"],
  ["주문서 링크", "인스타 프로필·카카오톡 채널에 거는 법을 알려 드려요"],
  ["예약 안내 이미지", "“픽케이크로 예약받아요” 인스타 게시물을 만들어 드려요"],
] as const;

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
 * 화면에 있는 사실만 쓴다. 가격은 "이용료·수수료 0원"이라 숫자 가격(price)으로 쓰지 않고 설명으로만 둔다.
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
          "손님이 사진·픽업 날짜·예산으로 견적을 물으면 사장님이 금액을 보내고, 손님이 고르면 그 견적으로 예약 신청이 들어온다. 정해진 케이크는 사이즈·맛·레터링·참고 사진·픽업 시간을 담은 주문서로 받고, 입금 안내·픽업 전날 안내·후기 부탁은 알림톡으로 자동으로 간다. 가게 링크로 들어온 손님 수와 예약 수를 보여 준다. 카카오톡·인스타그램·전화로 받은 주문은 대화를 붙여 넣거나 캡처를 올리면 정리돼 같은 달력에 보인다. 홈·달력·주문·매출을 휴대폰으로 본다. 이용료·수수료 0원, 처음 상품 등록 대행, 받아 둔 카톡 주문을 달력에 넣어 드림·대목 상품과 픽업 날짜·영업시간 맞춰 드림·예약 안내 이미지 만들어 드림·주문서 링크 거는 법 안내, 네이버 예약 상품 가져오기, 손님 입금은 가게 계좌로 바로, 매장 픽업 주문.",
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
/** 첫 화면 사진(딸기 생크림)에서 뒤쪽 선반이 덜 보이고 케이크가 가운데 오도록 맞춘 위치 */
const HERO_PHOTO_POSITION = "50% 80%";
const CLOSING_ID = "seller-closing";
const FOOTER_ID = "seller-footer";

/** 바탕색. 따뜻한 밝은색(사진 가장자리와 어울림)과 어두운 초콜릿색(홈 배너 MK-13 어두운 바탕과 같은 값) */
const PAPER = "bg-[#F6F3EE]";
const COCOA = "bg-[#1B1512]";
/** 기능 카드 단색. 케이크 사진과 어울리는 차분한 색이고, 흰 글자 대비는 모두 4.5:1 이상 */
const CARD_OLIVE = "bg-[#5E5A32]";
const CARD_NAVY = "bg-[#2F3A4A]";
const CARD_CACAO = "bg-[#5A4130]";
const SECTION_TITLE =
  "text-[clamp(24px,7vw,28px)] leading-[1.32] font-extrabold tracking-[-0.03em] text-balance";
const SHEET_BODY = "text-base leading-[1.7] text-gray-700";

function JoinButton({ id, className = "" }: { id?: string; className?: string }) {
  return (
    <a
      id={id}
      href={SELLER_SIGNUP_URL}
      // 주황 바탕 + 흰 글자(운영자 2026-11-17 결정, 시안 4개 중 3번). 흰 글자는 대비 2.9:1로 기준 4.5:1에 못 미친다는 점을 알리고 정함
      className={`flex h-[54px] w-full items-center justify-center rounded-[14px] bg-primary text-[17px] font-bold text-white transition-transform duration-150 active:scale-[0.98] ${className}`}
    >
      입점 신청하기
    </a>
  );
}

function KakaoButton() {
  return (
    <a
      href={KAKAO_CHANNEL_CHAT_URL}
      target="_blank"
      rel="noopener noreferrer"
      // 카카오 버튼은 손님 앱·판매자 앱 로그인과 같은 모양(노랑 #FFEB00·진한 글자·카카오톡 아이콘 20px)
      className="flex h-[54px] w-full items-center justify-center gap-1.5 rounded-[14px] bg-[#FFEB00] text-[17px] font-bold text-gray-900 transition-transform duration-150 active:scale-[0.98]"
    >
      <Image
        src={kakaoIcon}
        alt=""
        width={20}
        height={20}
        className="size-5 shrink-0 object-contain"
      />
      카카오톡으로 물어보기
    </a>
  );
}

/** 카드 아래쪽에 걸친 휴대폰 화면. 그림의 위쪽만 보이고 카드 끝에서 잘린다(토스플레이스 기기 사진처럼) */
function CardPhone({
  src,
  alt,
  side,
  className = "",
}: {
  src: StaticImageData;
  alt: string;
  side: "left" | "right";
  className?: string;
}) {
  return (
    <div
      className={`absolute bottom-0 h-[270px] w-[min(196px,60%)] overflow-hidden rounded-t-[26px] border-[5px] border-b-0 border-[#111] bg-white shadow-[0_18px_40px_rgba(0,0,0,0.35)] ${
        side === "right" ? "right-6" : "left-6"
      } ${className}`}
    >
      <Image src={src} alt={alt} sizes="200px" className="block h-auto w-full" />
    </div>
  );
}

/** 창 안의 화면 그림(잘리지 않게 전체) */
function SheetScreen({
  src,
  alt,
  caption,
}: {
  src: StaticImageData;
  alt: string;
  caption?: string;
}) {
  return (
    <figure>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
        <Image
          src={src}
          alt={alt}
          sizes="(min-width: 640px) 600px, 100vw"
          className="block h-auto w-full"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-[15px] leading-[1.5] text-gray-700">{caption}</figcaption>
      )}
    </figure>
  );
}

/**
 * 기능 카드 한 장: 사진(또는 단색) 위에 이름·두 줄 설명·"자세히", 아래에 실제 화면.
 * 글은 위쪽 160px 안에 두고 화면은 아래 270px에 둔다(320px 폭에서도 겹치지 않는다).
 */
function FeatureCard({
  id,
  name,
  lines,
  photo,
  photoPosition = "50% 50%",
  tone,
  sheetTitle,
  sheet,
  children,
}: {
  id: string;
  name: string;
  lines: [string, string];
  photo?: StaticImageData;
  photoPosition?: string;
  /** 사진이 없을 때 단색 */
  tone?: string;
  sheetTitle: string;
  sheet: ReactNode;
  children: ReactNode;
}) {
  return (
    <article
      id={id}
      className={`relative h-[440px] scroll-mt-4 overflow-hidden rounded-[22px] text-white ${photo ? COCOA : tone}`}
    >
      {photo && (
        <>
          <Image
            src={photo}
            alt=""
            fill
            sizes="(min-width: 640px) 600px, 100vw"
            className="object-cover"
            style={{ objectPosition: photoPosition }}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(27,21,18,0.72),rgba(27,21,18,0.35)_32%,rgba(27,21,18,0)_52%)]"
          />
        </>
      )}
      <div className="relative px-[22px] pt-[22px]">
        <h3 className="text-[24px] leading-[1.3] font-extrabold tracking-[-0.02em]">{name}</h3>
        <p className="mt-1.5 text-[15px] leading-[1.5] text-white/90">
          {lines[0]}
          <br />
          {lines[1]}
        </p>
        <FeatureSheet title={sheetTitle}>{sheet}</FeatureSheet>
      </div>
      {children}
    </article>
  );
}

export default function SellerAboutPage() {
  return (
    <main className="relative min-h-screen w-full bg-white text-gray-900">
      <JsonLd data={STRUCTURED_DATA} />
      {/* 1. 첫 화면: 흰 바탕의 케이크 사진 한 장, 그 아래 흰 바탕에 한 줄(운영자 11-17 "흰색 케이크·흰 배경, 깔끔하게").
          사진 위에 글을 얹지 않아 어떤 밝은 사진이어도 글이 읽힌다. JS를 기다리지 않고 바로 보인다 */}
      <section className="relative bg-white">
        {/* 휴대폰은 4:5, 화면이 낮거나 넓으면(PC) 화면 높이의 62%까지만 — 제목과 버튼이 첫 화면에 보이게 */}
        <div className="relative h-[min(125vw,62svh)] w-full overflow-hidden bg-gray-50">
          <Image
            src={photoHero}
            alt=""
            fill
            priority
            // 첫 화면의 가장 큰 그림(LCP)이라 먼저 받는다(priority만으로는 fetchpriority가 붙지 않았다, Lighthouse 2026-11-14)
            fetchPriority="high"
            sizes="(min-width: 640px) 640px, 100vw"
            className="object-cover"
            style={{ objectPosition: HERO_PHOTO_POSITION }}
          />
          {/* 사진 아래쪽을 흰 바탕으로 이어 사진과 글 사이에 선이 생기지 않게 */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(to_top,#fff,rgba(255,255,255,0))]"
          />
          {/* 로고: 앱·스토어에서 보게 될 마크와 한글 이름. 링크는 걸지 않는다(소개 페이지에서 손님 화면으로 나가지 않게) */}
          <p className="absolute top-3.5 left-5 flex items-center gap-2 text-[18px] font-extrabold tracking-[-0.03em] text-gray-900">
            <LogoPicake aria-hidden className="h-8 w-8" />
            픽케이크
            <span className="text-[15px] font-semibold text-gray-600">사장님</span>
          </p>
        </div>
        <div className="relative -mt-4 px-5 pb-10 text-center">
          {/* 머리말도 h1 안에 둔다. 검색엔진이 읽는 제목에 "주문제작 케이크"가 들어가고, 보이는 모양은 같다.
              머리말은 버튼과 같은 메인 주황(운영자 2026-11-17 결정, 흰 바탕 대비 2.9:1을 알리고 정함) */}
          <h1>
            <span className="block text-[14px] font-bold text-primary">
              주문제작 케이크 가게 사장님께
            </span>
            <span className="mt-2.5 block text-[clamp(28px,8.6vw,34px)] leading-[1.28] font-extrabold tracking-[-0.035em] text-gray-900">
              사진으로 묻는 손님께
              <br />
              금액만 보내세요
            </span>
          </h1>
          <p className="mt-3 text-base leading-[1.6] text-gray-600">
            정해진 케이크는 주문서로, 예약은 달력으로
          </p>
          <JoinButton id={HERO_CTA_ID} className="mx-auto mt-6 max-w-[320px]" />
          <a
            href={KAKAO_CHANNEL_CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block py-1 text-sm text-gray-600 underline underline-offset-4"
          >
            궁금한 건 카카오톡으로 물어보세요
          </a>
        </div>
      </section>

      {/* 2. 지금 주문 받는 곳을 고르면 맞는 기능 카드로 내려간다 */}
      <section className="px-5 pt-12 pb-12">
        <h2 className={`${SECTION_TITLE} text-center`}>
          지금 주문은
          <br />
          어디로 받으세요?
        </h2>
        <div className="mt-7 grid grid-cols-2 gap-2.5">
          {[
            ["카카오톡", ANCHOR.chatOrder],
            ["인스타그램 DM", ANCHOR.storeLink],
            ["네이버 예약", ANCHOR.faqNaver],
            ["전화·문자", ANCHOR.orderForm],
          ].map(([label, anchor]) => (
            <a
              key={label}
              href={`#${anchor}`}
              className="flex h-14 items-center justify-center rounded-[14px] bg-[#F4F2EE] text-[16px] font-semibold text-gray-800 transition-colors duration-150 hover:bg-[#ECE9E3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900"
            >
              {label}
            </a>
          ))}
          <a
            href={KAKAO_CHANNEL_CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 flex h-14 items-center justify-center gap-1.5 rounded-[14px] bg-[#F4F2EE] text-[16px] font-semibold text-gray-800 transition-colors duration-150 hover:bg-[#ECE9E3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900"
          >
            <Image
              src={kakaoIcon}
              alt=""
              width={20}
              height={20}
              className="size-5 shrink-0 object-contain"
            />
            카톡으로 바로 물어보기
          </a>
        </div>
      </section>

      {/* 3. 기능 카드: 견적 → 주문서 → 가게 링크 → 카톡 주문 정리 → 달력·매출 */}
      <section className="px-5 pb-16">
        <h2 className={`${SECTION_TITLE} text-center`}>사장님이 매일 쓰는 기능</h2>
        <div className="mt-7 grid gap-3.5">
          <FeatureCard
            id={ANCHOR.quote}
            name="견적"
            lines={["디자인마다 가격이 달라도", "금액만 적어 보내요"]}
            photo={photoBento}
            photoPosition="50% 62%"
            sheetTitle="디자인마다 가격이 달라도 괜찮아요"
            sheet={
              <div className="grid gap-5">
                <p className={SHEET_BODY}>
                  손님이 가게 화면에서 <b className="text-gray-900">사진·픽업 날짜·예산</b>을 보내면
                  채팅으로 요청서가 와요. 금액만 적고, 사진과 얼마나 비슷하게 만들지 골라 보내요.
                  손님이 고르면 <b className="text-gray-900">그 견적으로 예약 신청</b>이 들어오고,
                  확인·입금·픽업은 다른 예약과 같아요.
                </p>
                {/* 견적 받기 상품(기획 I-01, 2026-11-19 상용): 화면에 있는 사실만 */}
                <p className={SHEET_BODY}>
                  대표 디자인은 상품으로 올리고 <b className="text-gray-900">"견적 받기"</b>를
                  고르면, 손님 화면에 예약 대신{" "}
                  <b className="text-gray-900">"이 디자인으로 견적 받기"</b>가 보여요. 그 디자인
                  사진이 담긴 요청서가 사장님께만 와요.
                </p>
                <SheetScreen
                  src={screenQuoteSend}
                  alt="견적 보내기 창. 금액 52,000원을 적고 사진과 얼마나 비슷하게 만들지 '거의 똑같이'를 고른 모습(예시)"
                  caption="금액만 적어서 보내요"
                />
                <SheetScreen
                  src={screenQuoteReserved}
                  alt="채팅에 '견적을 보냈어요', '손님이 이 견적을 골랐어요'와 예약신청 카드가 이어진 모습(예시)"
                  caption="손님이 고르면 예약으로 와요"
                />
              </div>
            }
          >
            <CardPhone
              side="right"
              src={screenQuoteRequest}
              alt="판매자 앱 채팅에 온 손님 견적 요청서. 참고 사진, 픽업 날짜와 시간, 1호 케이크, 예산 4만~6만원, 레터링 설명과 견적 보내기 버튼(예시)"
            />
          </FeatureCard>

          <FeatureCard
            id={ANCHOR.orderForm}
            name="주문서"
            lines={["레터링 문구·참고 사진까지", "다시 묻지 않아도 돼요"]}
            photo={photoStrawberry}
            photoPosition="70% 40%"
            sheetTitle="정해진 케이크는 주문서로"
            sheet={
              <div className="grid gap-5">
                <p className={SHEET_BODY}>
                  상품에 <b className="text-gray-900">레터링 문구·참고 사진</b> 칸을 넣어 두면,
                  손님이 사이즈·맛·픽업 시간과 함께 골라서 보내요. 카톡으로 하나씩 다시 묻지 않아도
                  돼요.
                </p>
                <p className={SHEET_BODY}>
                  예약을 확인하면 입금 계좌 안내, 픽업 전날 안내, 픽업 뒤 후기 부탁이 알림톡으로
                  자동으로 가요.
                </p>
                <SheetScreen
                  src={screenOrder}
                  alt="판매자 앱 주문 상세. 픽업 일시, 예약자, 주문 항목과 레터링 문구가 한 화면에 보이는 모습(예시)"
                />
              </div>
            }
          >
            <CardPhone
              side="left"
              src={screenOrder}
              alt="판매자 앱 주문 상세. 픽업 일시와 주문 항목(예시)"
            />
          </FeatureCard>

          <FeatureCard
            id={ANCHOR.storeLink}
            name="가게 링크"
            lines={["인스타 프로필에 걸면", "손님이 가입 전에 끝까지 골라요"]}
            tone={CARD_NAVY}
            sheetTitle="인스타에 링크 하나"
            sheet={
              <div className="grid gap-5">
                <p className={SHEET_BODY}>
                  카카오톡 채널·인스타 프로필에 걸어 두면 지금 오시는 손님이 그대로 주문서·견적으로
                  와요. 손님은 <b className="text-gray-900">가입 전에 끝까지 골라 보고</b> 마지막에
                  로그인해요. 링크로 몇 명이 들어와 몇 건 예약했는지 숫자로 보여요.
                </p>
                <SheetScreen
                  src={screenLink}
                  alt="판매자 앱 '손님에게 링크 보내기' 창. 최근 30일 링크로 온 손님 48명, 예약 신청 9건(예시)"
                />
              </div>
            }
          >
            <CardPhone
              side="right"
              src={screenLink}
              alt="판매자 앱 '손님에게 링크 보내기' 창(예시)"
            />
          </FeatureCard>

          <FeatureCard
            id={ANCHOR.chatOrder}
            name="카톡 주문 정리"
            lines={["카톡으로 받은 주문도", "붙여 넣으면 정리돼요"]}
            tone={CARD_OLIVE}
            sheetTitle="카톡으로 받은 주문도 한 달력에"
            sheet={
              <div className="grid gap-5">
                <p className={SHEET_BODY}>
                  카톡·인스타·전화로 받은 주문은{" "}
                  <b className="text-gray-900">대화를 붙여 넣거나 캡처를 올리면</b> 픽업
                  날짜·케이크·레터링·금액·입금이 채워져요. 픽케이크로 받은 예약과 같은 달력에
                  보이고, 아이폰·구글 캘린더로도 내보낼 수 있어요.
                </p>
                <SheetScreen
                  src={screenChatPaste}
                  alt="판매자 앱 '대화 붙여 넣기' 창에 손님과 나눈 카톡 대화(픽업 날짜·케이크·레터링·금액·입금)를 붙여 넣은 모습(예시)"
                  caption="대화를 붙여 넣으면"
                />
                <SheetScreen
                  src={screenChatFilled}
                  alt="주문 적기 화면에 픽업 12월 24일 15:00, 1호 딸기 생크림, 레터링, 38,000원 입금 받음, 손님 이름이 채워진 모습(예시)"
                  caption="날짜·케이크·금액이 채워져요"
                />
              </div>
            }
          >
            {/* 두 화면을 겹쳐 "붙여 넣기 → 채워짐"을 보인다. 왼쪽이 조금 낮게 */}
            <div className="absolute bottom-0 left-[18px] h-[230px] w-[47%] overflow-hidden rounded-t-[20px] border-4 border-b-0 border-[#111] bg-white shadow-[0_14px_30px_rgba(0,0,0,0.35)]">
              <Image
                src={screenChatPaste}
                alt="'대화 붙여 넣기' 창(예시)"
                sizes="200px"
                className="block h-auto w-full"
              />
            </div>
            <div className="absolute right-[18px] bottom-0 h-[270px] w-[47%] overflow-hidden rounded-t-[20px] border-4 border-b-0 border-[#111] bg-white shadow-[0_14px_30px_rgba(0,0,0,0.35)]">
              <Image
                src={screenChatFilled}
                alt="날짜·케이크·금액이 채워진 주문 적기 화면(예시)"
                sizes="200px"
                className="block h-auto w-full"
              />
            </div>
          </FeatureCard>

          <FeatureCard
            id={ANCHOR.calendar}
            name="달력·매출"
            lines={["예약은 날짜별로,", "매출은 한눈에"]}
            tone={CARD_CACAO}
            sheetTitle="주문부터 매출까지 휴대폰 하나로"
            sheet={
              <div className="grid gap-5">
                <p className={SHEET_BODY}>
                  들어온 예약은 홈과 달력에 바로 보이고, 확인·입금·픽업 완료를 휴대폰에서 처리해요.
                  최근 매출과 잘 팔린 케이크도 볼 수 있어요.
                </p>
                <SellerScreenTabs
                  tabs={[
                    {
                      label: "홈",
                      src: screenTabHome,
                      alt: "판매자 앱 홈. 이번 주 날짜별 픽업 수, 오늘 픽업 4건 목록과 주문 적기 버튼(예시)",
                      caption: "오늘 픽업과 처리할 일",
                    },
                    {
                      label: "달력",
                      src: screenTabCalendar,
                      alt: "판매자 앱 캘린더. 날짜마다 픽업 수가 점으로 보이고 아래에 그날 픽업 목록(예시)",
                      caption: "날짜별 픽업 수",
                    },
                    {
                      label: "주문",
                      src: screenTabOrders,
                      alt: "판매자 앱 주문 목록. 처리할 것·진행 중·지난 주문 탭과 예약 확인·입금 확인할 주문(예시)",
                      caption: "확인부터 픽업 완료까지",
                    },
                    {
                      label: "매출",
                      src: screenTabStats,
                      alt: "판매자 앱 주문 통계. 최근 7일 매출과 주문 수, 잘 팔린 상품 순위(예시)",
                      caption: "최근 매출과 잘 팔린 케이크",
                    },
                  ]}
                />
              </div>
            }
          >
            <CardPhone side="right" src={screenTabCalendar} alt="판매자 앱 캘린더(예시)" />
          </FeatureCard>
        </div>
      </section>

      {/* 4. 처음 시작은 저희가: 대신 해 드리는 일 */}
      <section className="px-5 pb-16">
        <h2 className={SECTION_TITLE}>
          처음 시작은
          <br />
          저희가 해 드려요
        </h2>
        <ul className="mt-[18px] border-t border-gray-900">
          {START_HELP.map(([title, sub]) => (
            <li key={title} className="border-b border-[#E3DED6] py-4">
              <p className="text-base leading-[1.5] font-bold text-gray-900">{title}</p>
              <p className="mt-1 text-[15px] leading-[1.6] text-gray-700">{sub}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 5. 0원: 제목이 아니라 끝쪽에 */}
      <section className={`${PAPER} px-5 py-16 text-center`}>
        <h2>
          <span className="block text-[clamp(22px,6.4vw,26px)] leading-[1.3] font-extrabold tracking-[-0.03em]">
            이용료·수수료
          </span>
          {/* 첫 화면 머리말·입점 버튼과 같은 메인 주황(운영자 2026-11-17 메인 색으로 맞춤) */}
          <span className="mt-3 block text-[64px] leading-none font-extrabold tracking-[-0.04em] text-primary">
            0원
          </span>
        </h2>
        <p className="mt-6 text-base leading-[1.6] font-bold text-gray-900">
          가게 열기는 2단계예요
        </p>
        <p className="mt-1 text-[15px] leading-[1.6] text-gray-700">
          사업자등록번호 확인 → 매장 정보
        </p>
      </section>

      {/* 6. 자주 묻는 질문: 펼치기 없이 모두 보인다 */}
      <section className="px-5 pt-16 pb-[72px]">
        <h2 className={SECTION_TITLE}>자주 묻는 질문</h2>
        <dl className="mt-[18px] border-t border-gray-900">
          {FAQS.map(({ q, a, id }) => (
            <div key={q} id={id} className="scroll-mt-4 border-b border-[#E3DED6] py-4">
              <dt className="text-base leading-[1.5] font-bold text-gray-900">{q}</dt>
              <dd className="mt-1.5 text-[15px] leading-[1.65] text-gray-700">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 7. 마무리: 사진 위 한 줄과 버튼 둘 */}
      <section
        id={CLOSING_ID}
        className={`relative overflow-hidden ${COCOA} px-5 py-[88px] text-center text-white`}
      >
        <Image
          src={photoFlower}
          alt=""
          fill
          sizes="(min-width: 640px) 640px, 100vw"
          className="object-cover"
          style={{ objectPosition: "50% 50%" }}
        />
        <div aria-hidden className="absolute inset-0 bg-[rgba(27,21,18,0.62)]" />
        <div className="relative">
          <h2 className={SECTION_TITLE}>
            함께 시작할 첫 가게를
            <br />
            찾고 있어요
          </h2>
          <div className="mx-auto mt-8 flex max-w-[320px] flex-col gap-2">
            <JoinButton />
            <KakaoButton />
          </div>
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
