import type { Metadata } from "next";
import {
  INSTAGRAM_URL,
  KAKAO_CHANNEL_URL,
  SITE_BASE_URL,
  SITE_OG_IMAGE,
} from "@/apps/web-info/common/constants/site.constants";
import {
  APP_DOWNLOAD_URL,
  CUSTOMER_WEB_URL,
} from "@/apps/web-info/common/constants/app-download.constants";
import { JsonLd } from "@/apps/web-info/common/components/seo/JsonLd";
import { SiteHeader } from "@/apps/web-info/common/components/landing/SiteHeader";
import { SiteFooter } from "@/apps/web-info/common/components/landing/SiteFooter";
import { StickyCta } from "@/apps/web-info/common/components/landing/StickyCta";
import {
  HeroLead,
  HeroTitle,
  PhotoHero,
} from "@/apps/web-info/common/components/landing/PhotoHero";
import { PhoneShot } from "@/apps/web-info/common/components/landing/Shots";
import {
  FaqList,
  PainGrid,
  SectionHeading,
  SolveRow,
  SplitSection,
  TileGrid,
  type Faq,
  type Pain,
  type Tile,
} from "@/apps/web-info/common/components/landing/Blocks";
import { PAPER, SECTION_Y, WRAP } from "@/apps/web-info/common/components/landing/landing.styles";
import { AppDownloadButtons } from "@/apps/web-info/features/customer/components/AppDownloadButtons";
import {
  EasyCards,
  QaGrid,
  SellerBand,
  type Qa,
} from "@/apps/web-info/features/customer/components/CustomerSections";
import photoHero from "@/apps/web-info/features/customer/assets/photo-hero-heart.jpg";
import screenDesignPick from "@/apps/web-info/features/customer/assets/screen-design-pick.png";
import screenHome from "@/apps/web-info/features/customer/assets/screen-home.png";
import screenHomeDesigns from "@/apps/web-info/features/customer/assets/screen-home-designs.png";

/**
 * 손님 소개 페이지 (`https://info.picakes.com/`, 2026-11-20 새로).
 * 예전에는 첫 주소가 사장님 소개를 그대로 보여 줬다(next.config rewrite, 네이버 소유 확인 때문). 이제 손님 소개가 첫 주소이고
 * 사장님 소개는 `/seller/about` 그대로다. 위쪽 줄 "사장님이세요?"와 아래 띠로 사장님 쪽으로 잇는다(배민·쿠팡이츠처럼).
 *
 * 운영자 결정(2026-11-20): 첫 화면은 시안 F(어두운 케이크 사진 + 흰 글자, 위쪽 줄·바탕은 밝게),
 * 두 번째 화면부터는 시안 B(고민 → 해결) + 문답·예약이 쉬운 이유·"이것도 돼요". 앱 받기는 배민처럼 버튼(PC는 QR을 눌러 열기).
 *
 * 내세우는 것과 근거(손님이 한 말, 기획 R-02 설문·R-11 의견). 없는 기능·숫자·후기는 쓰지 않는다
 *   디자인부터   인스타·블로그·카톡을 오가며 비교할 수 없다(R-02) → 디자인 모음·어떤 날(F-70·F-03)
 *   여러 가게 견적 가격을 미리 볼 수 없고 개별 문의가 필수(R-02) → 요청서 한 번에 가게 5곳까지(F-19, P-84)
 *   사진만 고르면 카톡 작은 입력창이 불편(R-11) → 사진에서 가져갈 것 고르기·내 사진 AI 읽기(F-70, P-89)
 *   결과물 걱정  사진만 보고 판단해 다를까 불안(R-02) → 견적의 "얼마나 비슷하게"(P-84)
 *   예약 안내    예약 가능 날짜·진행 상황을 모른다(R-02) → 가게가 여는 날만(F-24), 알림톡(F-61)
 * 실제 가게가 아직 없어 가게 수·후기 수·평점은 쓰지 않는다. 사진 후기는 기능만 한 줄.
 *
 * 화면 그림: 상용 손님 웹을 2026-11-20 휴대폰 크기(390×844, 2배)로 찍은 것(로그인 안 함).
 * 사진: 첫 화면 Unsplash m4uypz8-zHU(Kurt Harvey, 분홍 하트 케이크 — 손님 앱 디자인 모음 "하트 빈티지"와 같은 사진의 큰 원본).
 *   상업 사용·수정 무료, 출처 표시 의무 없음.
 */
const TITLE = "주문제작 케이크 예약·견적 | 픽케이크(Picake)";
const DESCRIPTION =
  "픽케이크(Picake)는 주문제작 케이크를 견적과 주문서로 예약하는 서비스예요. 사진을 고르면 요청서가 채워지고, 가게 5곳까지 한 번에 견적을 받아요. 디자인 모음에서 고르고, 가게가 여는 날만 골라 예약해요.";
const SHARE_TITLE = "원하는 케이크, 사진으로 견적 받아요 | 픽케이크";
const SHARE_DESCRIPTION =
  "디자인 고르기부터 예약·픽업 안내까지 한 곳에서. 주문제작 케이크 예약은 픽케이크.";
const PAGE_URL = `${SITE_BASE_URL}/`;

const ANCHOR = {
  design: "design",
  quote: "quote",
  reserve: "reserve",
  faq: "faq",
} as const;

const HERO_CTA_ID = "customer-hero-cta";
const BAND_ID = "customer-seller-band";
const FOOTER_ID = "customer-footer";

const PAINS: Pain[] = [
  {
    problem: "가격을 몰라 가게마다 따로 물어봐요",
    answerName: "견적",
    answer: "요청서 한 번에 가게 5곳까지",
  },
  {
    problem: "카톡 작은 칸에 레터링·사진·날짜를 하나씩 쳐요",
    answerName: "주문서",
    answer: "화면에서 골라 담아요",
  },
  {
    problem: "사진이랑 다르게 나올까 걱정돼요",
    answerName: "견적",
    answer: "얼마나 비슷하게 만들지 적혀 와요",
  },
  {
    problem: "예약됐는지, 언제 찾으러 가는지 헷갈려요",
    answerName: "알림톡",
    answer: "예약 확인·입금·픽업 전날 안내",
  },
];

const QAS: Qa[] = [
  {
    q: "이 날 픽업 돼요?",
    a: (
      <>
        가게가 <b>여는 날·시간만</b> 고를 수 있어요
      </>
    ),
  },
  {
    q: "얼마예요?",
    a: (
      <>
        정해진 케이크는 가격이 보이고, 디자인 케이크는 <b>견적</b>으로 받아요
      </>
    ),
  },
  {
    q: "이런 디자인 돼요?",
    a: (
      <>
        사진을 넣은 <b>요청서</b>로 여러 가게에 물어봐요
      </>
    ),
  },
  {
    q: "사진이랑 똑같이 돼요?",
    a: (
      <>
        견적에 <b>얼마나 비슷하게</b> 만들지 적혀 와요
      </>
    ),
  },
  {
    q: "더 물어볼 게 있어요",
    a: (
      <>
        가게와 <b>채팅</b>으로 이야기해요
      </>
    ),
  },
  {
    q: "다른 사람은 어땠어요?",
    a: (
      <>
        픽업한 손님이 <b>사진 후기</b>를 남겨요
      </>
    ),
  },
];

const EASY = [
  { title: "가입은 마지막에", body: "다 고른 뒤 한 번, 카카오·네이버·구글·애플 중 하나로" },
  { title: "입금은 간편하게", body: "가게 계좌로 바로, 토스·카카오페이 송금 화면이 열려요" },
  { title: "취소 규정은 미리", body: "가게 환불·취소 규정을 예약 전에 봐요" },
];

const MORE: Tile[] = [
  { title: "지도로 근처 가게", body: "지금 보이는 곳의 가게만 모아 봐요" },
  { title: "저장", body: "디자인·케이크·가게를 모아 둬요" },
  { title: "예약 바꾸기", body: "가게가 확인하기 전엔 날짜·옵션을 바꿔요" },
  { title: "알림", body: "예약·견적 소식을 알림톡과 앱 알림으로" },
  { title: "검색 추천", body: "최근·추천 검색어와 자동완성" },
  { title: "크리스마스 디자인", body: "12월 25일까지 크리스마스 디자인을 모아 봐요" },
  { title: "앱·웹 둘 다", body: "앱이 없어도 picakes.com에서 찾고 예약해요" },
  { title: "없는 가게에도 견적", body: "지도에서 픽케이크에 없는 가게에도 물어봐요" },
];

/** 자주 묻는 질문. 같은 글을 FAQPage 구조화 데이터로도 쓴다(펼친 채로) */
const FAQS: Faq[] = [
  {
    q: "픽케이크는 어떤 서비스예요?",
    a: "주문제작 케이크를 견적과 주문서로 예약하는 서비스예요. 가게를 찾아 예약하고, 케이크는 매장에서 픽업해요.",
  },
  {
    q: "견적은 어떻게 받나요?",
    a: "사진·픽업 날짜·예산을 적은 요청서를 보내면 가게가 금액을 보내요. 마음에 드는 견적을 골라 예약해요.",
  },
  {
    q: "결제는 어떻게 하나요?",
    a: "가게 계좌로 바로 입금해요. 토스·카카오페이로 간편하게 보낼 수도 있어요.",
  },
  {
    q: "앱이 없어도 되나요?",
    a: "네. picakes.com에서 웹으로도 찾고 예약할 수 있어요.",
  },
  { q: "배달도 되나요?", a: "지금은 매장 픽업만 돼요." },
];

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "Picake",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    // 손님 웹과 같은 공유 그림(카카오톡·인스타그램은 PNG만 보여 준다)
    images: [SITE_OG_IMAGE],
  },
};

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
      mainEntity: {
        "@type": "Service",
        name: "픽케이크 주문제작 케이크 예약",
        serviceType: "주문제작 케이크 예약·견적",
        provider: { "@id": "https://picakes.com/#organization" },
        areaServed: { "@type": "Country", name: "대한민국" },
        description:
          "케이크 디자인 모음에서 생일·기념일 같은 어떤 날이나 레터링·꽃 같은 모양으로 디자인을 골라 저장하고, 사진에서 가져갈 것(모양·색·장식·글자)을 고르면 요청서가 채워진다. 내 사진은 AI가 읽어 설명을 채운다. 픽업 날짜·동네·예산을 적어 가게 5곳까지 한 번에 견적을 받고, 견적에는 사진과 얼마나 비슷하게 만들지가 적혀 온다. 정해진 케이크는 사이즈·맛·레터링을 골라 주문서로 예약하고, 가게가 여는 날·시간만 고른다. 가입은 다 고른 뒤 마지막에 카카오·네이버·구글·애플로 하고, 입금은 가게 계좌로 바로(토스·카카오페이 송금 화면), 예약 확인·입금 안내·픽업 전날 안내는 알림톡으로 온다. 매장 픽업만, 앱과 웹(picakes.com) 모두.",
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

export default function CustomerHomePage() {
  return (
    <>
      <JsonLd data={STRUCTURED_DATA} />
      <SiteHeader
        menu={[
          { label: "디자인", href: `#${ANCHOR.design}` },
          { label: "견적 받기", href: `#${ANCHOR.quote}` },
          { label: "예약", href: `#${ANCHOR.reserve}` },
          { label: "자주 묻는 질문", href: `#${ANCHOR.faq}` },
        ]}
        secondary={{ label: "사장님이세요?", href: "/seller/about" }}
        cta={{ label: "앱 받기", href: APP_DOWNLOAD_URL }}
      />

      <main className="bg-white text-gray-900">
        {/* 1. 첫 화면: 어두운 하트 케이크 사진 + 흰 글자(시안 F), 앱 받기(배민처럼 버튼, PC는 QR을 눌러 열기) */}
        <PhotoHero photo={photoHero} position={{ phone: "50% 45%", pc: "62% 50%" }}>
          <HeroTitle eyebrow="주문제작 케이크 예약">
            원하는 케이크,
            <br />
            사진으로 <em>견적</em> 받아요
          </HeroTitle>
          <HeroLead>디자인 고르기부터 예약·픽업 안내까지 한 곳에서</HeroLead>
          <div className="mt-7 w-full md:mt-9 md:w-auto">
            <AppDownloadButtons id={HERO_CTA_ID} />
          </div>
          <a
            href={CUSTOMER_WEB_URL}
            className="mt-4 inline-block rounded-sm py-1 text-[15px] text-white/80 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white md:mt-5"
          >
            앱 없이 웹으로 둘러보기
          </a>
        </PhotoHero>

        {/* 2. 고민: 손님이 겪는 번거로움(R-02·R-11) */}
        <section aria-labelledby="pains-title" className={`${PAPER} ${SECTION_Y}`}>
          <div className={WRAP}>
            <SectionHeading
              id="pains-title"
              kicker="주문제작 케이크, 이래서 번거로웠죠"
              title={
                <>
                  케이크 하나 주문하는데
                  <br />왜 이렇게 오래 걸릴까요
                </>
              }
            />
            <PainGrid items={PAINS} />
          </div>
        </section>

        {/* 3. 해결 줄: 디자인 고르기 · 견적 받기 · 예약 */}
        <section aria-label="픽케이크로 고르고 묻고 예약하기" className={SECTION_Y}>
          <div className={`${WRAP} grid gap-4 md:gap-5`}>
            <SolveRow
              id={ANCHOR.design}
              tag="디자인 고르기"
              title={
                <>
                  어떤 케이크가 좋을지
                  <br />
                  디자인부터 둘러봐요
                </>
              }
              body="생일·기념일처럼 어떤 날로, 레터링·꽃처럼 모양으로 골라 저장해요."
              shot={
                <PhoneShot
                  src={screenHomeDesigns}
                  alt="손님 앱 홈의 '이런 디자인은 어떠세요?' 칸. 크리스마스 리스 케이크 사진과 '이 디자인으로 견적 받기'"
                  className="h-[300px] w-[240px] md:h-[400px] md:w-[300px]"
                />
              }
            />
            <SolveRow
              id={ANCHOR.quote}
              flip
              tag="견적 받기"
              title={
                <>
                  사진만 고르면
                  <br />
                  요청서가 채워져요
                </>
              }
              body="사진에서 가져갈 것(모양·색·장식·글자)을 고르고 날짜·동네·예산을 적으면 가게 5곳까지 물어봐요. 내 사진을 올리면 AI가 모양·색·장식·글자를 읽어 설명을 채워요."
              shot={
                <PhoneShot
                  src={screenDesignPick}
                  alt="손님 앱 디자인 상세에서 '이 사진에서 무엇을 가져갈까요?' 창. 전체·모양·색·장식·글자 고르기와 '견적 요청서 쓰기'"
                  className="h-[300px] w-[240px] md:h-[400px] md:w-[300px]"
                />
              }
            />
            <SolveRow
              id={ANCHOR.reserve}
              tag="예약"
              title={
                <>
                  바로 예약할 케이크는
                  <br />
                  주문서 한 장으로
                </>
              }
              body="사이즈·맛·레터링을 골라 예약해요. 가게가 여는 날·시간만 고를 수 있고, 오늘 가져갈 케이크는 당일픽업으로 찾아요."
              shot={
                <PhoneShot
                  src={screenHome}
                  alt="손님 앱 홈. 검색창, 레터링·드로잉·캐릭터 등 카테고리 12칸, '오늘 바로 가져갈 수 있어요' 당일픽업 줄"
                  className="h-[300px] w-[240px] md:h-[400px] md:w-[300px]"
                />
              }
            />
          </div>
        </section>

        {/* 4. 물어보기 전에 여기서(R-02 손님이 바란 기능) */}
        <section aria-labelledby="qa-title" className={`${PAPER} ${SECTION_Y}`}>
          <div className={WRAP}>
            <SectionHeading
              id="qa-title"
              kicker="케이크 고를 때 궁금한 것"
              title={
                <>
                  물어보기 전에 <em>여기서</em> 알 수 있어요
                </>
              }
            />
            <QaGrid items={QAS} />
          </div>
        </section>

        {/* 5. 예약도 간단해요 + 이것도 돼요 */}
        <section aria-labelledby="easy-title" className={SECTION_Y}>
          <div className={WRAP}>
            <SectionHeading
              id="easy-title"
              title={
                <>
                  예약도 <em>간단해요</em>
                </>
              }
            />
            <EasyCards items={EASY} />
            <TileGrid items={MORE} className="mt-4 md:mt-5" />
          </div>
        </section>

        {/* 6. 자주 묻는 질문 */}
        <SplitSection id={ANCHOR.faq} title="자주 묻는 질문">
          <FaqList items={FAQS} />
        </SplitSection>

        {/* 7. 사장님 쪽으로 */}
        <SellerBand id={BAND_ID} href="/seller/about" />
      </main>

      <SiteFooter
        id={FOOTER_ID}
        links={[
          { label: "사장님 입점 안내", href: "/seller/about" },
          { label: "이용약관", href: "https://picakes.com/mypage/terms/terms-of-service" },
          { label: "개인정보 처리방침", href: "https://picakes.com/mypage/terms/privacy-policy" },
        ]}
        // 손님 홈 맨 아래와 같은 문장(전자상거래법 제20조, hq 법무 점검표 2)
        notice="두루랩스는 통신판매중개자로서 통신판매의 당사자가 아니에요. 상품과 거래에 대한 책임은 각 가게에 있어요."
      />

      <StickyCta
        label="앱 받기"
        href={APP_DOWNLOAD_URL}
        watchIds={[HERO_CTA_ID, BAND_ID, FOOTER_ID]}
      />
    </>
  );
}
