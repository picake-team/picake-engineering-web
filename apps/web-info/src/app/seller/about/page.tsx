import type { Metadata } from "next";
import {
  KAKAO_CHANNEL_CHAT_URL,
  SELLER_SIGNUP_URL,
} from "@/apps/web-info/common/constants/partner.constants";
import { SITE_BASE_URL } from "@/apps/web-info/common/constants/site.constants";
import {
  SELLER_APP_DOWNLOAD_PATH,
  SELLER_PLAY_STORE_URL,
} from "@/apps/web-info/common/constants/app-download.constants";
import {
  SellerAppBand,
  SellerAppButtons,
} from "@/apps/web-info/features/seller/components/SellerAppDownload";
import { JsonLd } from "@/apps/web-info/common/components/seo/JsonLd";
import {
  ORGANIZATION_ID,
  ORGANIZATION_JSON_LD,
} from "@/apps/web-info/common/components/seo/organization";
import { SiteHeader } from "@/apps/web-info/common/components/landing/SiteHeader";
import { SiteFooter } from "@/apps/web-info/common/components/landing/SiteFooter";
import { StickyCta } from "@/apps/web-info/common/components/landing/StickyCta";
import {
  HeroLead,
  HERO_MARKER,
  HeroTitle,
  PhotoHero,
} from "@/apps/web-info/common/components/landing/PhotoHero";
import { KakaoLink, PrimaryLink } from "@/apps/web-info/common/components/landing/Buttons";
import { PHONE_HERO } from "@/apps/web-info/common/components/landing/phone-hero";
import { ShotVideo } from "@/apps/web-info/common/components/landing/ShotVideo";
import { PcShot } from "@/apps/web-info/common/components/landing/Shots";
import {
  FaqList,
  PainGrid,
  SectionHeading,
  SolveRow,
  SplitSection,
  type Faq,
  type Pain,
} from "@/apps/web-info/common/components/landing/Blocks";
import { PAPER, SECTION_Y, WRAP } from "@/apps/web-info/common/components/landing/landing.styles";
import {
  HelpList,
  TextWithPc,
  ZeroPrice,
} from "@/apps/web-info/features/seller/components/SellerSections";
import photoHero from "@/apps/web-info/features/seller/assets/photo-hero-ribbon.jpg";
import videoQuote from "@/apps/web-info/features/seller/assets/video-quote.jpg";
import videoOrder from "@/apps/web-info/features/seller/assets/video-order.jpg";
import videoChatOrder from "@/apps/web-info/features/seller/assets/video-chat-order.jpg";
import videoStoreLink from "@/apps/web-info/features/seller/assets/video-store-link.jpg";
import videoProductCreate from "@/apps/web-info/features/seller/assets/video-product-create.jpg";
import pcOrders from "@/apps/web-info/features/seller/assets/pc-orders.png";

/**
 * 사장님 입점 소개 페이지 (`https://info.picakes.com/seller/about`).
 * 2026-11-14 다시 만듦, 2026-11-17 시안 A(토스플레이스 방식), 2026-11-20 휴대폰·PC 새 구성(기획 I-49 이어서).
 *
 * 2026-11-20 운영자 결정: 첫 화면은 시안 F(어두운 케이크 사진 가득 + 흰 글자, 위쪽 줄·나머지 바탕은 밝게),
 * 두 번째 화면부터는 시안 A(고민 → 해결, 케끄 파트너 페이지의 순서). 글은 한 벌이고 휴대폰은 쌓고 PC는 나란히 둔다.
 * 2026-11-25 운영자 "덜 복잡하게, 읽기 쉽게": 고민 칸과 겹치던 카톡 비교표·AI 칸(카드 3장)을 빼고 AI 문장은 해결 줄로 옮김,
 * 가게 컴퓨터는 그림 넷 → 상품 등록과 같은 글 | 화면 한 장, 이것도 돼요는 색 칸 → 줄 목록, 첫 화면 노랑 카카오톡 버튼 → 앱 받기,
 * 마무리 칸은 사진 없이 카카오톡 문의만(입점 신청은 첫 화면·위쪽 줄·휴대폰 아래 버튼). 사장님 앱 띠·자주 묻는 질문 "휴대폰 앱"을 더함.
 *
 * 내세우는 것과 근거(사장님이 실제로 한 말, 기획 R-03 설문·R-04 답장·방문). 없는 기능·숫자·후기는 쓰지 않는다
 *   견적         "디자인마다 가격이 달라 정가 앱은 쓰기 어렵다"(R-04) → 요청서·견적 보내기·견적 받기 상품(I-46·I-01, P-84·P-94)
 *   주문서       번거로운 일 "주문 정보 누락·오기입"(R-03) → 상품 옵션·레터링·참고 사진·픽업 일시(F-08)
 *   카톡 주문 정리 "주문서가 등록되면 캘린더에 바로"(R-03) → 직접 적은 주문·대화/캡처 읽기·같은 달력(I-42, F-71·P-92)
 *   AI           "주문 응대가 AI 수준이어야 카톡·네이버와 다르다"(R-03) → 해결 줄 안에: 손님 사진 읽기(견적, P-89)·대화·캡처 읽기(카톡 주문 정리, P-92)·설명 초안(상품 등록, P-62)
 *   등록 한 화면  "사진 보내고 등록할 시간이 전혀 없다"(R-04) → 한 화면 등록(F-25), AI 초안, 손님 화면 미리보기(F-76), 처음 등록 대행(P-60)
 *   가게 링크     "손님 가입이 간편해야 이탈이 적다"(R-03) → 마지막에 로그인(I-59), 링크 숫자(I-45)
 *   사장님 앱     2026-11-25 Google Play 출시(I-48) → 새 예약·입금·채팅 휴대폰 알림(서버 알림 문구와 같음). 아이폰 앱은 준비 중
 *   가게 컴퓨터   2026-11-19 새 사장님이 PC로 가입(hq 연락 기록) → PC 화면(F-73~F-77)
 *   정산          "지금 정산 주기에 불만, 즉시 정산 선호"(R-03) → 손님이 가게 계좌로 바로(F-09)
 * 네이버 예약 상품·매장 정보 가져오기(I-10·I-43)는 공식 연동이 아니고 법무 점검표 18번이 "확인 필요"라 내세우지 않는다
 * (2026-11-20 운영자 "네이버 크롤링은 합법이 아닌 걸로 안다" → AI 판단).
 *
 * 화면 그림: PC 화면(지금은 주문 화면 한 장)은 로컬 심사용 예시 가게를 "달콤스토어"로 보이게 해 찍은 것(2026-11-20). 실제 가게·손님·주문이 아니다.
 * 사용법 영상(2026-11-24, 운영자 "소개페이지에 동영상", 이 페이지에만 올림): 그림 한 장으로는 "바뀌는 순간"이 안 보이는 칸만
 *   견적·주문서·카톡 주문 정리·상품 등록(PC)·가게 링크 다섯 칸. 로컬 테스트 서버의 예시 가게 "달콤스토어"를 실제로 눌러 녹화했다.
 *   카톡 대화 읽기 결과는 같은 대화를 실제 AI가 읽은 결과(AI Draft Smoke 2026-11-19)다. 찍는 법은 docs/web-info/README.md "사용법 영상".
 * 사진: 첫 화면 Pexels 30637504(Meryem Şahin, 검정 리본 케이크 — 손님 앱 디자인 모음 "검정 리본"과 같은 사진의 큰 원본),
 *   상업 사용·수정 무료, 출처 표시 의무 없음. (마지막 칸 꽃 사진은 2026-11-25 뺐다)
 */
/**
 * 검색·AI 답변용 문구(2026-11-14). 사장님이 검색할 말(주문제작 케이크·예약·견적)과 한글·영문 이름(픽케이크·Picake)을 앞에 둔다.
 * 설명 첫 문장은 "○○는 …예요" 한 문장 정의라 AI 답변이 그대로 인용하기 좋다.
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
 * DM 미리보기 그림(1200×630 JPG). 원본 HTML은 picake-hq marketing/banners/2026-11-i49.
 * 그림을 바꾸면 `?v=`를 올린다(카카오톡·인스타그램이 그림 주소로 옛 그림을 기억한다).
 */
const SHARE_IMAGE = {
  url: `${SITE_BASE_URL}/images/og/seller-about.jpg?v=3`,
  width: 1200,
  height: 630,
  alt: "픽케이크 사장님 입점: 사진으로 묻는 손님께 금액만 보내세요",
  type: "image/jpeg",
};

/** 사용법 영상(public/videos/seller). 파일을 바꾸면 v를 올린다(브라우저가 옛 영상을 기억한다) */
const VIDEO = {
  quote: "/videos/seller/quote.mp4?v=1",
  order: "/videos/seller/order.mp4?v=1",
  chatOrder: "/videos/seller/chat-order.mp4?v=1",
  storeLink: "/videos/seller/store-link.mp4?v=1",
  productCreate: "/videos/seller/product-create.mp4?v=3",
} as const;
/** 휴대폰 틀 폭: 영상 화면(390×560)이 PC 칸 높이 460px 안에 다 들어가게 280 */
const PHONE_VIDEO = "w-[240px] md:w-[280px]";

/** 칸 주소(위쪽 줄 칸 이동) */
const ANCHOR = {
  quote: "quote",
  orderForm: "order-form",
  chatOrder: "chat-order",
  pc: "pc",
  app: "app",
  start: "start",
  faq: "faq",
} as const;

const HERO_CTA_ID = "seller-hero-cta";
const CLOSING_ID = "seller-closing";
const FOOTER_ID = "seller-footer";

const PAINS: Pain[] = [
  {
    problem: "디자인마다 가격이 달라 카톡으로 한참 주고받아요",
    answerName: "견적",
    answer: "요청서에 금액만 적어 보내요",
  },
  {
    problem: "레터링·사진·픽업 시간을 다시 묻고, 그래도 빠져요",
    answerName: "주문서",
    answer: "손님이 다 골라 보내요",
  },
  {
    problem: "카톡·인스타·전화 주문이 여기저기 흩어져요",
    answerName: "카톡 주문 정리",
    answer: "붙여 넣으면 한 달력에",
  },
  {
    problem: "혼자 만들고 응대하느라 새로 등록할 시간이 없어요",
    answerName: "처음 시작",
    answer: "등록은 저희가 해 드려요",
  },
];

/** 이것도 돼요: 이름 + 한 줄(처음 시작과 같은 줄 목록) */
const MORE = [
  ["영업 캘린더", "정기 휴무·영업시간, 그날만 쉬기·열기"],
  ["입금 마감 자동 정리", "기한이 지나면 알아서 취소돼요"],
  ["알림톡 자동 안내", "입금 계좌·픽업 전날·후기 부탁"],
  ["손님 연락 채널", "채팅·카톡 채널·인스타·전화 중 보일 곳만"],
  ["채팅", "손님 문의와 요청서를 한 곳에서"],
  ["주문 찾기", "이름·전화 뒷자리·상품명으로"],
  ["매출 통계", "기간별 매출과 잘 팔린 케이크"],
  ["캘린더 내보내기", "아이폰·구글 캘린더로"],
] as const;

/** 처음 시작에 대신 해 드리는 일(2026-11-17 운영자 결정). 입점 조건(P-60)·카카오 채널·연락 문구와 같은 말이어야 한다 */
const START_HELP = [
  ["처음 상품 등록", "사진과 가격만 보내 주세요"],
  ["지금 받아 둔 카톡 주문", "캡처를 보내 주시면 달력에 넣어 드려요"],
  // 날마다 받을 수량·주문 마감일은 아직 기능이 없어(기획 I-07) 약속하지 않는다(2026-11-17 검토). 영업 캘린더(F-24)로 되는 것만
  ["크리스마스 같은 대목", "대목 상품과 픽업 날짜·영업시간을 맞춰 드려요"],
  ["주문서 링크", "인스타 프로필·카카오톡 채널에 거는 법을 알려 드려요"],
  ["예약 안내 이미지", "“픽케이크로 예약받아요” 인스타 게시물을 만들어 드려요"],
] as const;

/**
 * 자주 묻는 질문. 사장님이 망설이는 이유(네이버·비용·결제·컴퓨터·배달)에 답하고, 같은 글을 FAQPage 구조화 데이터로도 쓴다.
 * 펼치기 없이 모두 보이게 둔다(검색·AI가 읽는 글과 화면 글이 같아야 한다).
 */
const FAQS: Faq[] = [
  {
    q: "픽케이크는 어떤 서비스예요?",
    a: "주문제작 케이크를 주문서와 견적으로 예약받는 서비스예요. 손님은 픽케이크에서 가게를 찾아 예약하고, 사장님은 판매자 페이지에서 받아요.",
  },
  {
    q: "입점 신청하면 다음은 어떻게 되나요?",
    a: "가입하고 가게를 열면(2단계) 저희가 바로 알고 먼저 연락드려요. 첫 상품 등록과 받아 둔 카톡 주문 옮기기부터 해 드려요.",
  },
  {
    q: "네이버 예약을 이미 쓰는데 같이 써도 되나요?",
    a: "네. 네이버는 그대로 두시고, 레터링·참고 사진이 필요한 주문제작 케이크만 픽케이크로 받아도 돼요.",
  },
  {
    q: "이용료·수수료는 언제까지 0원이에요?",
    a: "기간을 정한 혜택이 아니에요. 주문 수수료와 월 이용료는 받지 않아요.",
  },
  {
    q: "손님 결제는 어떻게 받나요?",
    a: "손님이 가게 계좌로 바로 입금하고, 사장님이 입금을 확인하면 예약이 확정돼요. 정산을 기다리지 않아요.",
  },
  {
    q: "컴퓨터에서도 쓸 수 있나요?",
    a: "네. 휴대폰과 컴퓨터(PC·태블릿)에서 같은 기능을 써요. 컴퓨터에서는 주문 목록과 상세를 나란히 보고, 주문·매출을 엑셀로 내려받고, 그날 주문서를 한 번에 인쇄해요.",
  },
  {
    q: "휴대폰 앱이 있나요?",
    a: "네. 안드로이드는 Google Play에서 “픽케이크 사장님” 앱을 받으면 새 예약 신청·손님 입금·채팅을 휴대폰 알림으로 받아요. 아이폰 앱은 준비 중이라 지금은 휴대폰 브라우저(seller.picakes.com)에서 같은 화면을 써요.",
  },
  { q: "배달도 되나요?", a: "지금은 매장 픽업 주문만 받아요." },
];

export const metadata: Metadata = {
  // 레이아웃의 "%s | Picake"를 붙이지 않는다(제목이 길어져 검색 결과에서 잘린다)
  title: { absolute: TITLE },
  description: DESCRIPTION,
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
    ORGANIZATION_JSON_LD,
    {
      "@type": "WebPage",
      "@id": `${PAGE_URL}#webpage`,
      url: PAGE_URL,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "ko-KR",
      publisher: { "@id": ORGANIZATION_ID },
      audience: { "@type": "BusinessAudience", audienceType: "주문제작 케이크 가게 사장님" },
      mainEntity: {
        "@type": "Service",
        name: "픽케이크 사장님 입점",
        serviceType: "주문제작 케이크 예약·견적 관리",
        provider: { "@id": ORGANIZATION_ID },
        areaServed: { "@type": "Country", name: "대한민국" },
        description:
          "손님이 사진·픽업 날짜·예산으로 견적을 물으면 사장님이 금액을 보내고, 손님은 고른 견적으로 예약 신청을 한다. 정해진 케이크는 사이즈·맛·레터링·참고 사진·픽업 시간을 담은 주문서로 받고, 손님은 가게가 여는 날·시간만 고른다. 입금 안내·픽업 전날 안내·후기 부탁은 알림톡으로 자동으로 간다. 카카오톡·인스타그램·전화로 받은 주문은 대화를 붙여 넣거나 캡처를 올리면 AI가 칸을 채워 같은 달력에 보이고, 손님 참고 사진은 AI가 읽어 요청서 설명을 채우며, 상품 설명은 사장님이 적은 사실로 AI가 초안을 쓴다. 가게 링크로 온 손님은 가입 전에 끝까지 고르고 마지막에 로그인하며, 링크로 들어온 손님 수와 예약 수를 보여 준다. 휴대폰과 컴퓨터에서 같은 기능을 쓰고, 컴퓨터에서는 주문 목록과 상세를 나란히 보고 엑셀로 내려받고 그날 주문서를 한 번에 인쇄한다. 이용료·수수료 0원, 처음 상품 등록 대행, 받아 둔 카톡 주문을 달력에 넣어 드림·대목 상품과 픽업 날짜·영업시간 맞춰 드림·예약 안내 이미지 만들어 드림·주문서 링크 거는 법 안내, 손님 입금은 가게 계좌로 바로, 매장 픽업 주문.",
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

export default function SellerAboutPage() {
  return (
    <>
      <JsonLd data={STRUCTURED_DATA} />
      <SiteHeader
        brandSuffix="사장님"
        menu={[
          { label: "견적", href: `#${ANCHOR.quote}` },
          { label: "주문서", href: `#${ANCHOR.orderForm}` },
          { label: "컴퓨터에서", href: `#${ANCHOR.pc}` },
          { label: "처음 시작", href: `#${ANCHOR.start}` },
          { label: "자주 묻는 질문", href: `#${ANCHOR.faq}` },
        ]}
        secondary={{ label: "카카오톡 문의", href: KAKAO_CHANNEL_CHAT_URL, external: true }}
        cta={{ label: "입점 신청하기", href: SELLER_SIGNUP_URL }}
      />

      <main className="bg-white text-gray-900">
        {/* 1. 첫 화면: PC는 어두운 케이크 사진 + 흰 글자(시안 F), 휴대폰은 딸기 생크림 사진(PHONE_HERO) */}
        {/* 운영자 2026-11-25: 머리말은 화면에서만 숨기고(검색용으로 남음) 강조는 형광펜(휴대폰 D안 분홍빛 · PC H5안 기운 주황 띠),
            앱 안내 줄("앱은 안드로이드부터…")은 빼고(PC P4안 — 같은 말이 사장님 앱 칸에 있음), 휴대폰 사진은 아래 버튼 위까지 가득 */}
        <PhotoHero photo={photoHero} position="50% 56%" phone={PHONE_HERO}>
          <HeroTitle eyebrow="주문제작 케이크 가게 사장님께">
            사진으로 묻는 손님께
            <br />
            <em>금액만</em> 보내세요
          </HeroTitle>
          {/* 0원을 첫 화면에(운영자 2026-11-25 L3). 말은 11-19 수익 모델대로 — "평생 무료"·"모든 기능 무료"는 쓰지 않는다 */}
          <HeroLead>
            주문 수수료도, 월 이용료도{" "}
            <b className={`font-extrabold text-gray-900 md:text-white ${HERO_MARKER}`}>0원</b>
            이에요
          </HeroLead>
          {/* 첫 화면 버튼은 PC만(운영자 2026-11-25: 휴대폰은 아래 고정 버튼 "입점 신청하기"·"앱 받기"만). 노랑 카카오톡 버튼은 뺌(위쪽 줄 "카카오톡 문의"·마무리 칸에 남음) */}
          <div className="mt-9 hidden md:flex md:w-auto md:flex-row md:gap-3">
            <PrimaryLink id={HERO_CTA_ID} href={SELLER_SIGNUP_URL} width="hero">
              입점 신청하기
            </PrimaryLink>
            <SellerAppButtons cardSide="right" />
          </div>
        </PhotoHero>

        {/* 2. 고민: 사장님들이 들려준 어려움(R-03·R-04) */}
        <section aria-labelledby="pains-title" className={`${PAPER} ${SECTION_Y}`}>
          <div className={WRAP}>
            <SectionHeading
              id="pains-title"
              kicker="사장님들이 들려준 어려움"
              title={
                <>
                  케이크 주문 받다 보면
                  <br />
                  이런 일 있으시죠
                </>
              }
            />
            <PainGrid items={PAINS} />
          </div>
        </section>

        {/* 3. 해결 줄(견적·주문서·카톡 주문 정리·가게 링크). 고민 칸과 겹치던 비교표는 2026-11-25 뺐다 */}
        <section aria-labelledby="compare-title" className={SECTION_Y}>
          <div className={WRAP}>
            <SectionHeading
              id="compare-title"
              title={
                <>
                  카톡으로 받을 때와 <em>이렇게 달라요</em>
                </>
              }
            />
            <div className="mt-8 grid gap-4 md:mt-12 md:gap-5">
              <SolveRow
                id={ANCHOR.quote}
                tag="견적"
                title={
                  <>
                    디자인마다 가격이 달라도
                    <br />
                    금액만 적어 보내요
                  </>
                }
                body="손님이 사진·날짜·예산을 보내면 채팅으로 요청서가 와요. 사진은 AI가 읽어 설명을 채워 와요. 금액을 보내면 손님이 그 견적으로 바로 예약 신청해요."
                shot={
                  <ShotVideo
                    frame="phone"
                    src={VIDEO.quote}
                    poster={videoQuote}
                    label="견적"
                    start={0.5}
                    alt="판매자 앱 채팅에 온 손님 견적 요청서(참고 사진, 픽업 날짜, 1호 생크림, 예산 4만~6만원)에 금액 45,000원과 '비슷하게'를 골라 보내고, 손님이 그 견적으로 예약을 신청하자 '새 예약 신청이 왔어요' 알림을 눌러 예약을 여는 영상(예시)"
                    className={PHONE_VIDEO}
                  />
                }
              />
              <SolveRow
                id={ANCHOR.orderForm}
                flip
                tag="주문서"
                title={
                  <>
                    레터링 문구·참고 사진까지
                    <br />
                    다시 묻지 않아도 돼요
                  </>
                }
                body="상품에 레터링 문구·참고 사진 칸을 넣어 두면 손님이 사이즈·맛·픽업 시간과 함께 골라 보내요."
                shot={
                  <ShotVideo
                    frame="phone"
                    src={VIDEO.order}
                    poster={videoOrder}
                    label="주문서"
                    start={5.6}
                    alt="판매자 앱 주문 목록에서 예약 신청을 열어 사이즈·맛·초, 레터링 문구 '서연아 생일 축하해', 참고 사진, 요청 사항을 한 화면에서 보고 '예약 확인'을 누르자 입금 대기로 바뀌는 영상(예시)"
                    className={PHONE_VIDEO}
                  />
                }
              />
              <SolveRow
                id={ANCHOR.chatOrder}
                tag="카톡 주문 정리"
                title={
                  <>
                    카톡으로 받은 주문도
                    <br />
                    붙여 넣으면 정리돼요
                  </>
                }
                body="대화를 붙여 넣거나 캡처를 올리면 AI가 날짜·케이크·금액을 채우고, 픽케이크 예약과 같은 달력에 보여요."
                shot={
                  <ShotVideo
                    frame="phone"
                    src={VIDEO.chatOrder}
                    poster={videoChatOrder}
                    label="카톡 주문 정리"
                    start={7.2}
                    alt="판매자 앱 '주문 적기'에서 복사해 둔 카톡 대화를 붙여 넣자 픽업 11월 28일 15:00, 2호 초코, 레터링, 52,000원 입금 받음, 손님 이름, 받은 곳 카톡, 메모가 채워지고, 등록하면 그날 달력에 픽케이크 예약과 함께 보이는 영상(예시)"
                    className={PHONE_VIDEO}
                  />
                }
              />
              <SolveRow
                flip
                tag="가게 링크"
                title={
                  <>
                    인스타 프로필에 링크 하나,
                    <br />
                    손님은 가입 전에 끝까지 골라요
                  </>
                }
                body="로그인은 마지막에 한 번이고 카카오·네이버·구글·애플 중 고르면 돼요. 링크로 몇 명이 들어와 몇 건 예약했는지도 보여요."
                shot={
                  <ShotVideo
                    frame="phone"
                    src={VIDEO.storeLink}
                    poster={videoStoreLink}
                    label="가게 링크"
                    start={2}
                    alt="판매자 앱 '손님에게 링크 보내기' 창(최근 30일 링크로 온 손님 48명, 예약 신청 9건)에서 링크를 복사하고, 손님이 그 링크로 들어와 로그인 없이 상품·픽업 날짜·사이즈·맛을 고른 뒤 마지막에 '로그인하고 예약신청'을 누르자 카카오·네이버·구글·애플 로그인 창이 뜨는 영상(예시)"
                    className={PHONE_VIDEO}
                  />
                }
              />
            </div>
          </div>
        </section>

        {/* 4. 상품 등록은 한 화면(R-04 "등록할 시간이 없다"). 네이버 가져오기는 내세우지 않는다(법무 점검표 18) */}
        <TextWithPc
          id="product"
          kicker="등록할 시간이 없으시면"
          title={
            <>
              상품 등록은
              <br />
              <em>한 화면</em>이면 돼요
            </>
          }
          points={[
            <>
              <b>한 화면에 차례대로</b> · 사진 → 이름 → 가격·사이즈 → 옵션 → 설명
            </>,
            <>
              <b>상세 설명은 AI가 초안</b> · 적어 둔 사실로만 써요
            </>,
            <>
              <b>손님 화면 미리보기</b> · 컴퓨터에서는 손님이 볼 화면을 옆에서 봐요
            </>,
            <>
              그래도 바쁘시면 <b>처음 등록은 저희가</b> 해 드려요
            </>,
          ]}
          shot={
            <ShotVideo
              frame="pc"
              src={VIDEO.productCreate}
              poster={videoProductCreate}
              label="상품 등록"
              start={9.6}
              alt="사장님 PC 상품 등록 화면에서 사진, 상품명 '딸기 생크림 케이크', 기본 케이크, 판매가 38,000원, 사이즈 1호를 넣는 동안 오른쪽 손님 화면 미리보기가 바로 바뀌는 영상(예시 가게)"
              sizes="(min-width: 1024px) 640px, (min-width: 768px) 90vw, 85vw"
            />
          }
        />

        {/* 5. 가게 컴퓨터에서도(2026-11-19 PC로 가입한 사장님). 상품 등록과 같은 글 | 화면 한 장(2026-11-25 단순하게) */}
        <TextWithPc
          id={ANCHOR.pc}
          className={PAPER}
          kicker="가게 컴퓨터에서도"
          title={
            <>
              휴대폰과 같은 주문을
              <br />
              <em>더 넓게</em> 봐요
            </>
          }
          points={[
            <>
              <b>목록과 상세를 나란히</b> · 주문을 누르면 옆 칸에 바로 보여요
            </>,
            <>
              <b>그날 주문서 한 번에 인쇄</b> · 픽업 날 아침에 묶어서 뽑아요
            </>,
            <>
              <b>주문·매출 엑셀로 내려받기</b> · 기간을 골라 열어요
            </>,
            <>
              컴퓨터 알림을 켜 두면 <b>새 주문 알림</b>이 컴퓨터에도 떠요
            </>,
          ]}
          shot={
            <PcShot
              src={pcOrders}
              alt="사장님 PC 주문 화면. 왼쪽에 처리할 주문 목록, 오른쪽에 고른 주문의 픽업·주문 항목·레터링 상세(예시 가게)"
            />
          }
        />

        {/* 6. 이것도 돼요("0원이어도 기능을 보고 정하겠다", R-03). 색 칸 대신 처음 시작과 같은 줄 목록(2026-11-25 단순하게) */}
        <SplitSection id="more" title="이것도 돼요">
          <HelpList items={MORE} />
        </SplitSection>

        {/* 7. 사장님 앱(2026-11-25 Google Play 출시, 기획 I-48). 손님 소개의 "사장님이세요?" 띠와 같은 모양 */}
        <SellerAppBand id={ANCHOR.app} />

        {/* 8. 처음 시작은 저희가 */}
        <SplitSection
          id={ANCHOR.start}
          title={
            <>
              처음 시작은
              <br />
              저희가 해 드려요
            </>
          }
        >
          <HelpList items={START_HELP} />
        </SplitSection>

        {/* 9. 0원 + 정산(R-03 "즉시 정산 선호") */}
        <ZeroPrice
          steps="사업자등록번호 확인 → 매장 정보"
          note="손님 입금은 가게 계좌로 바로 · 정산을 기다리지 않아요"
        />

        {/* 10. 자주 묻는 질문 */}
        <SplitSection id={ANCHOR.faq} title="자주 묻는 질문">
          <FaqList items={FAQS} />
        </SplitSection>

        {/* 11. 마무리: 사진 없이 카카오톡 문의만(운영자 2026-11-25 — 입점 신청은 첫 화면·위쪽 줄·휴대폰 아래 버튼에 있음) */}
        <section
          id={CLOSING_ID}
          aria-labelledby="closing-title"
          className={`${PAPER} py-14 md:py-20`}
        >
          <div className={`${WRAP} flex flex-col items-center text-center`}>
            <h2
              id="closing-title"
              className="text-[22px] leading-[1.35] font-extrabold tracking-[-0.03em] text-gray-900 md:text-[28px]"
            >
              궁금한 점은 편하게 물어보세요
            </h2>
            <p className="mt-1.5 text-[15px] leading-[1.6] text-gray-700 md:text-[17px]">
              카카오톡 채널 “픽케이크”에서 답해 드려요
            </p>
            <div className="mt-6 w-full max-w-[320px] md:w-auto md:max-w-none">
              <KakaoLink href={KAKAO_CHANNEL_CHAT_URL}>카카오톡으로 물어보기</KakaoLink>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter
        id={FOOTER_ID}
        links={[
          { label: "사장님 앱 받기(Google Play)", href: SELLER_PLAY_STORE_URL, external: true },
          { label: "손님 화면 보기", href: "https://picakes.com" },
        ]}
      />

      <StickyCta
        label="입점 신청하기"
        href={SELLER_SIGNUP_URL}
        secondary={{ label: "앱 받기", href: SELLER_APP_DOWNLOAD_PATH }}
        watchIds={[HERO_CTA_ID, ANCHOR.app, CLOSING_ID, FOOTER_ID]}
      />
    </>
  );
}
