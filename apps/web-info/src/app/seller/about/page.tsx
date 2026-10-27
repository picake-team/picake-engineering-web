import type { Metadata } from "next";
import { Icon, type IconName } from "@/apps/web-info/common/components/icons";
import { Reveal } from "@/apps/web-info/common/components/motion/Reveal";
import { PARTNER_SURVEY_URL } from "@/apps/web-info/common/constants/partner.constants";
import { AutoNoticeDemo } from "@/apps/web-info/features/seller/components/AutoNoticeDemo";
import { BeforeAfterToggle } from "@/apps/web-info/features/seller/components/BeforeAfterToggle";
import { FaqAccordion } from "@/apps/web-info/features/seller/components/FaqAccordion";
import { MessageFunnel } from "@/apps/web-info/features/seller/components/MessageFunnel";
import { QuestionMarquee } from "@/apps/web-info/features/seller/components/QuestionMarquee";
import { StickySurveyCta } from "@/apps/web-info/features/seller/components/StickySurveyCta";
import styles from "@/apps/web-info/features/seller/components/partner.module.css";

/**
 * 사장님 입점 소개 페이지 (`https://info.picakes.com/seller/about`).
 *
 * web-user의 `/partner/about`을 옮겨 온 페이지. 입점 안내 진입점(`picakes.com/partner`)의
 * "소개페이지 바로가기"가 (`/partner/about` 리다이렉트를 거쳐) 연결되는 곳.
 * 핵심 메시지는 "문자·DM·전화로 흩어진 손님 연락을 한 곳으로" 하나다.
 * 섹션 순서도 그 흐름을 따른다: 흩어진 연락 -> 주문서로 모음 -> 안내는 자동 -> 그 밖의 운영 기능.
 *
 * 시각 방향 (밝은 에디토리얼)
 * - 흰 바탕에 헤어라인으로 섹션을 나눈다. 앱 본체와 같은 밝은 톤이라 캡처해서 공유하기도 좋다.
 * - 감정이 가장 낮은 "사장님의 하루" 한 구간만 먹색 색면으로 끊어 리듬을 만든다.
 * - 섹션 머리에 번호를 붙여 "세션 순서"처럼 읽히게 한다. 숫자만 모노스페이스를 쓰고
 *   한글 라벨은 본문 서체로 둔다(모노 폰트에 한글 글리프가 없어 폴백되면 어긋난다).
 *
 * 흰 배경에서 주황(#FF653E)을 쓰는 규칙
 * - 글자로 쓰면 2.91:1로 AA(4.5:1) 미달이라 라벨·수치·본문에는 쓰지 않는다.
 * - 면으로만 쓰고(버튼, 혜택 블록, 번호 배지) 그 위 글자는 gray-900으로 얹어 5.64:1을 확보한다.
 * - 예외는 히어로 h1의 마지막 줄 하나. 44px extra-bold 디스플레이라 가독에는 지장이 없다.
 * - 먹색 색면 위(사장님의 하루)에서는 주황이 5.64:1이라 글자로 써도 된다.
 *
 * 내용의 근거 (없는 기능·수치·후기는 쓰지 않는다. 아래 출처에 있는 것만 적는다)
 * - 주문서 항목: web-user 주문 화면(픽업 일시·옵션·레터링·참고 사진)
 * - 자동 안내: backend `notification/constants/user-order-alimtalk.constants.ts` 발송 시점
 * - 운영 기능: web-seller 실제 메뉴(주문·캘린더·피드·통계·알림)
 * - 입점 절차: docs/common/feature/스토어 등록(3단계) - 가이드.md
 * - 초기 혜택: 설문 안내문에 고지된 내용
 * - 실시간 채팅은 아직 열지 않은 기능이라 소개하지 않는다
 */
export const metadata: Metadata = {
  title: "사장님 입점 소개",
  description:
    "문자, DM, 전화로 흩어진 케이크 예약 주문을 Picake 한 곳에서 받으세요. 주문서로 받고, 손님 안내는 자동으로 보내드려요.",
  // 정보 사이트의 공개 랜딩이라 검색에 노출한다 (web-user 시절에는 noindex였다).
  alternates: { canonical: "/seller/about" },
};

const HERO_CTA_ID = "partner-hero-cta";
const FINAL_CTA_ID = "partner-final-cta";

/** web-seller에 실제로 있는 메뉴 기준 */
const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "reservation",
    title: "주문 관리",
    body: "들어온 주문을 상태별로 한눈에 보고 처리해요",
  },
  {
    icon: "calendar",
    title: "스토어 캘린더",
    body: "휴무일을 막아두면 손님은 가능한 날만 골라요",
  },
  {
    icon: "addPhoto",
    title: "피드",
    body: "만든 케이크를 올리면 손님이 보고 찾아와요",
  },
  {
    icon: "alarm",
    title: "새 주문 알림",
    body: "주문이 들어오면 바로 알려드려요",
  },
];

/** docs/common/feature/스토어 등록(3단계) - 가이드.md 기준 */
const STEPS = [
  {
    label: "사업자등록번호 확인",
    body: "국세청 자료로 바로 확인해요. 서류를 따로 보내실 필요 없어요.",
  },
  {
    label: "통신판매업 신고번호 조회",
    body: "신고하신 정보가 사업자 정보와 맞는지 확인해요.",
  },
  {
    label: "매장 정보 입력",
    body: "매장 이름, 위치, 영업시간을 넣으면 끝. 바로 상품을 올릴 수 있어요.",
  },
];

const FAQS = [
  {
    q: "손님 문의는 이제 어디로 오나요?",
    a: "날짜, 사이즈, 맛, 레터링, 참고 사진처럼 주문에 필요한 내용은 손님이 앱에서 직접 골라 주문서로 보내요. 입금 안내, 예약 확정, 픽업 안내는 상태만 바꾸시면 손님께 알림톡으로 자동 발송돼요.",
  },
  {
    q: "지금 바로 입점할 수 있나요?",
    a: "사업자등록과 통신판매업 신고가 되어 있으면 가능해요. 준비 중이시라면 설문을 남겨 주세요. 열리는 대로 안내드릴게요.",
  },
  {
    q: "상품 등록이 어렵지는 않나요?",
    a: "초기에는 저희가 함께 올려 드려요. 사진과 가격만 주시면 사이즈, 맛 옵션까지 맞춰 세팅해 드려요.",
  },
  {
    q: "픽업만 되나요?",
    a: "지금은 매장 픽업 기준으로 운영해요. 손님이 고른 픽업 시간에 맞춰 준비하시면 돼요.",
  },
];

function SurveyButton({ id, label = "5분 설문 참여하기" }: { id?: string; label?: string }) {
  return (
    <a
      id={id}
      href={PARTNER_SURVEY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-[58px] w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-base font-extrabold text-gray-900 shadow-[0_10px_30px_-12px_rgba(255,101,62,0.8)] transition-transform duration-150 active:scale-[0.98]"
    >
      {label}
      <Icon name="arrow" width={18} height={18} className="rotate-90 text-gray-900" />
    </a>
  );
}

/**
 * 섹션 머리의 번호 + 라벨.
 * `tone="onDark"`는 먹색 색면 위(사장님의 하루)에서 쓴다.
 */
function SectionLabel({
  index,
  tone = "onLight",
  children,
}: {
  index: number;
  tone?: "onLight" | "onDark";
  children: string;
}) {
  const onDark = tone === "onDark";
  return (
    <p className="flex items-center gap-2.5">
      <span
        className={`font-mono text-2xs font-bold tracking-[0.12em] ${
          onDark ? "text-primary-200" : "text-gray-900"
        }`}
      >
        {String(index).padStart(2, "0")}
      </span>
      <span aria-hidden className={`h-px w-4 ${onDark ? "bg-white/25" : "bg-primary"}`} />
      <span
        className={`text-2xs font-bold tracking-[0.1em] ${
          onDark ? "text-primary-200" : "text-gray-600"
        }`}
      >
        {children}
      </span>
    </p>
  );
}

/** 섹션 사이를 가르는 헤어라인 */
const HAIRLINE = "border-t border-gray-200";
/** 섹션 교대를 남겨둔 자리. 이 안의 카드는 흰색으로 둬야 구분된다 */
const RAISED = "bg-gray-50";

const H2 = "text-[32px] leading-[1.25] font-extrabold tracking-[-0.035em]";

export default function PartnerAboutPage() {
  return (
    <main className="relative min-h-screen w-full bg-white">
      {/* 1. 히어로 - 흩어진 연락이 한 장으로 모이는 장면 */}
      <section className="relative overflow-hidden px-5 pt-14 pb-16">
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 h-[560px] ${styles.heroGlow}`}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 ${styles.gridBackdrop}`}
        />

        <div className="relative">
          <Reveal>
            <h1 className="text-[44px] leading-[1.14] font-extrabold tracking-[-0.045em] text-gray-900">
              문자, DM, 전화로
              <br />
              흩어진 주문,
              <br />
              <span className="text-primary">이제 한 곳에서</span>
            </h1>
            <p className="mt-5 text-base leading-[1.6] text-gray-700">
              손님은 앱에서 주문서로 보내고,
              <br />
              안내 연락은 Picake가 대신 보내요.
            </p>
          </Reveal>

          <Reveal delay={120} className="mt-9">
            <MessageFunnel />
          </Reveal>

          <Reveal delay={200} className="mt-7">
            <SurveyButton id={HERO_CTA_ID} />
            <p className="mt-3.5 text-center text-xs text-gray-600">
              설문에 참여하신 매장에는 출시 초기 혜택을 먼저 안내드려요
            </p>
          </Reveal>
        </div>
      </section>

      {/* 2. 공감 - 매일 받는 같은 질문들. 페이지에서 유일한 먹색 색면 */}
      <section className="bg-gray-900 py-[72px]">
        <Reveal className="px-5">
          <SectionLabel index={1} tone="onDark">
            사장님의 하루
          </SectionLabel>
          <h2 className={`mt-4 text-white ${H2}`}>
            케이크 굽는 중에도
            <br />
            휴대폰 알림이
            <br />
            멈추지 않죠
          </h2>
          <p className="mt-5 text-sm leading-6 text-gray-300">
            문자 보고, DM 보고, 카톡 보고. 같은 질문에 답하다 보면
            <br />
            놓치는 주문이 생기고 내용이 어긋나요.
          </p>
        </Reveal>
        <Reveal delay={120} className="mt-10">
          <QuestionMarquee />
        </Reveal>
      </section>

      {/* 3. 해결 ① - 대화 대신 주문서 */}
      <section className="px-5 py-[72px]">
        <Reveal>
          <SectionLabel index={2}>하나, 주문서로 받기</SectionLabel>
          <h2 className={`mt-4 text-gray-900 ${H2}`}>
            묻고 답하던 걸
            <br />
            주문서 한 장으로
          </h2>
          <p className="mt-4 text-sm leading-6 text-gray-700">버튼을 눌러 비교해 보세요.</p>
        </Reveal>
        <Reveal delay={120} className="mt-8">
          <BeforeAfterToggle />
        </Reveal>
      </section>

      {/* 4. 해결 ② - 손님 안내는 자동 */}
      <section className={`px-5 py-[72px] ${HAIRLINE} ${RAISED}`}>
        <Reveal>
          <SectionLabel index={3}>둘, 안내는 자동으로</SectionLabel>
          <h2 className={`mt-4 text-gray-900 ${H2}`}>
            “입금했어요?” “언제 와요?”
            <br />
            따로 연락하지 마세요
          </h2>
          <p className="mt-4 text-sm leading-6 text-gray-700">
            주문 상태만 바꾸면 손님께 알림톡이 자동으로 가요. 단계를 눌러 보세요.
          </p>
        </Reveal>
        <Reveal delay={120} className="mt-8">
          <AutoNoticeDemo />
        </Reveal>
      </section>

      {/* 5. 그 밖의 운영 기능 */}
      <section className={`px-5 py-[72px] ${HAIRLINE}`}>
        <Reveal>
          <SectionLabel index={4}>판매자 페이지</SectionLabel>
          <h2 className={`mt-4 text-gray-900 ${H2}`}>
            매장 운영도
            <br />
            여기서 같이
          </h2>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 70}>
              <div className="flex h-full min-h-[172px] flex-col rounded-2xl bg-gray-50 p-5 ring-1 ring-gray-200 transition-transform duration-200 active:scale-[0.98]">
                <p className="text-base font-extrabold text-gray-900">{f.title}</p>
                <p className="mt-1.5 text-2sm leading-[1.55] text-gray-600">{f.body}</p>
                <span className="mt-auto ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-gray-200">
                  <Icon name={f.icon} width={22} height={22} className="text-primary" />
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 6. 초기 혜택 - 페이지에서 유일한 주황 면. 글자는 gray-900으로 얹어 대비를 확보한다 */}
      <section className={`px-5 py-[72px] ${HAIRLINE}`}>
        <Reveal>
          <SectionLabel index={5}>먼저 시작하는 매장께</SectionLabel>
        </Reveal>
        <Reveal delay={100} className="mt-6">
          <div className="overflow-hidden rounded-2xl bg-primary p-6 shadow-[0_18px_44px_-20px_rgba(255,101,62,0.9)]">
            <p className="text-[34px] leading-none font-extrabold tracking-[-0.035em] text-gray-900">
              수수료 0원
            </p>
            <p className="mt-2.5 text-sm font-medium text-gray-900">
              출시 초기, 자리 잡는 동안은 받지 않아요
            </p>
            <div className="mt-6 rounded-xl bg-white p-4">
              <p className="flex items-center gap-1.5 text-base font-bold text-gray-900">
                <Icon name="checkCircle" width={20} height={20} className="text-primary" />
                상품 등록 대행
              </p>
              <p className="mt-1 pl-[26px] text-2sm leading-[1.55] text-gray-600">
                사진과 가격만 주시면 사이즈, 맛 옵션까지 맞춰 올려 드려요
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 7. 입점 절차 */}
      <section className={`px-5 py-[72px] ${HAIRLINE} ${RAISED}`}>
        <Reveal>
          <SectionLabel index={6}>입점 절차</SectionLabel>
          <h2 className={`mt-4 text-gray-900 ${H2}`}>
            세 단계면
            <br />
            매장이 열려요
          </h2>
        </Reveal>
        <ol className="mt-8 flex flex-col gap-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.label} delay={i * 90}>
              <li className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-gray-200">
                {/* 번호는 주황 글자 대신 주황 배지로 둔다. 흰 배경 위 주황 글자는 대비가 모자란다 */}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-2sm font-bold text-gray-900">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-base font-bold text-gray-900">{step.label}</p>
                  <p className="mt-1 text-2sm leading-[1.55] text-gray-600">{step.body}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* 8. 자주 묻는 질문 */}
      <section className={`px-5 py-[72px] ${HAIRLINE}`}>
        <Reveal>
          <h2 className={`text-gray-900 ${H2}`}>자주 묻는 질문</h2>
        </Reveal>
        <Reveal delay={100} className="mt-7">
          <FaqAccordion items={FAQS} />
        </Reveal>
      </section>

      {/* 9. 마무리 */}
      <section
        className={`relative overflow-hidden px-5 pt-[72px] pb-[calc(40px+env(safe-area-inset-bottom))] text-center ${HAIRLINE}`}
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-[420px] rotate-180 ${styles.heroGlow}`}
        />
        <div className="relative">
          <Reveal>
            <Icon name="logoPicake" width={56} height={56} className="mx-auto" />
            <h2 className={`mt-6 text-gray-900 ${H2}`}>
              흩어진 연락,
              <br />
              Picake로 모아 보세요
            </h2>
            <p className="mt-4 text-sm leading-6 text-gray-700">
              지금 어떻게 주문을 받고 계신지 5분만 들려주세요.
              <br />
              그대로 서비스에 반영할게요.
            </p>
          </Reveal>
          <Reveal delay={120} className="mt-8">
            <SurveyButton id={FINAL_CTA_ID} />
          </Reveal>
        </div>
      </section>

      <StickySurveyCta watchIds={[HERO_CTA_ID, FINAL_CTA_ID]} />
    </main>
  );
}
