/**
 * 판매자 앱 휴대폰 화면 부품 모음. `yarn web-seller:storybook`으로 본다.
 * 어느 부품을 어떤 크기로 쓰는지는 docs/web-seller/판매자 앱 디자인 기준.md.
 * 휴대폰 폭(390)으로 보려면 Storybook 위쪽의 화면 크기에서 "Small mobile"이나 직접 390을 고른다.
 */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { Button, ButtonPair, CircleIconButton, FieldIconButton, HeaderIconButton } from "./Button";
import { CountBubble, StatusPill } from "./Badge";
import { ChipGroup, ChoiceGrid, SegmentedTabs } from "./Choice";
import { Checkbox, Radio, Switch } from "./Toggle";
import { Field, PickerButton, SearchInput, TextArea, TextInput } from "./Field";
import { SheetSelect } from "./OptionSheet";
import { DateRangeSheet } from "./DateRangeSheet";
import { addDaysToKey, kstDateKey } from "../utils/kst-date.util";
import {
  GrayBand,
  GroupTitle,
  InfoRow,
  ListRow,
  ListRowButton,
  ListRowLink,
  RowCount,
  RowIconBox,
  SectionTitle,
} from "./List";
import {
  Card,
  CardFooterButton,
  EmptyState,
  LoadErrorState,
  SkeletonCards,
  StepBar,
  Thumb,
  WarningBox,
} from "./Surface";
import { AppScreen, BackHeader, BottomActionBar, HomeHeader, TabHeader } from "./Screen";
import { BottomSheet } from "./Sheet";
import { TaskIcon } from "./icons";

const meta: Meta = {
  title: "판매자 앱/부품",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="mx-auto max-w-[390px] bg-white font-app text-ink-900">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};
export default meta;

type Story = StoryObj;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-ink-100 p-5">
      <h2 className="text-badge font-bold text-ink-600">{title}</h2>
      {children}
    </section>
  );
}

export const 버튼: Story = {
  render: () => (
    <>
      <Section title="버튼 48 · 주 버튼은 오른쪽 하나">
        <ButtonPair>
          <Button variant="secondary">돌아가기</Button>
          <Button>예약 확정</Button>
        </ButtonPair>
      </Section>
      <Section title="누를 수 없을 때(회색 채움) · 처리 중">
        <ButtonPair>
          <Button variant="secondary" disabled>
            돌아가기
          </Button>
          <Button disabled>등록하기</Button>
        </ButtonPair>
        <Button loading block>
          예약 확정
        </Button>
      </Section>
      <Section title="작은 버튼 40 · 회색 글자 버튼(갈색 글자 버튼은 쓰지 않음)">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="md">
            다시 시도
          </Button>
          <Button size="md">켜기</Button>
          <Button variant="secondary" size="md">
            네이버 영업시간으로 채우기
          </Button>
          <Button variant="quiet">나중에 할게요</Button>
        </div>
      </Section>
      <Section title="동그라미 아이콘 36(누르는 칸 44) · 위쪽 줄 아이콘 · 숫자">
        <div className="flex items-center gap-1">
          <CircleIconButton icon="phone" label="전화" />
          <CircleIconButton icon="message" label="문자" />
          <CircleIconButton icon="copy" label="복사" />
          <CircleIconButton icon="share" label="링크 보내기" />
          <HeaderIconButton icon="bell" label="알림" count={3} />
          <HeaderIconButton icon="plus" label="상품 등록" />
          <HeaderIconButton icon="settings" label="설정" />
          <CountBubble count={3} />
        </div>
      </Section>
    </>
  ),
};

export const 배지와_고르기: Story = {
  render: function Render() {
    const [tab, setTab] = useState<"todo" | "doing" | "past">("todo");
    const [chip, setChip] = useState<"all" | "on" | "off" | "hidden">("all");
    const [days, setDays] = useState<string[]>(["0"]);
    return (
      <>
        <Section title="상태 배지 · 사장님 차례(주황 테두리) / 기다림(회색) / 끝(회색 테두리)">
          <div className="flex flex-wrap gap-2">
            <StatusPill tone="turn">입금완료</StatusPill>
            <StatusPill tone="wait">예약확정</StatusPill>
            <StatusPill tone="done">픽업완료</StatusPill>
          </div>
        </Section>
        <Section title="위쪽 탭">
          <SegmentedTabs
            label="주문 묶음"
            value={tab}
            onChange={setTab}
            options={[
              { value: "todo", label: "처리할 것", count: 4, countAccent: true },
              { value: "doing", label: "진행 중", count: 5 },
              { value: "past", label: "지난 주문" },
            ]}
          />
        </Section>
        <Section title="칩 36 · 고른 칩은 주황 채움(분류처럼 여러 개 고를 때도 같음)">
          <ChipGroup
            label="판매 상태"
            value={chip}
            onChange={setChip}
            options={[
              { value: "all", label: "전체", count: 6 },
              { value: "on", label: "판매중", count: 4 },
              { value: "off", label: "판매중지", count: 2 },
              { value: "hidden", label: "숨김", count: 1 },
            ]}
          />
        </Section>
        <Section title="고르는 네모 버튼 40">
          <ChoiceGrid
            label="쉬는 요일"
            selected={days}
            onToggle={(v) => setDays((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]))}
            options={["일", "월", "화", "수", "목", "금", "토"].map((l, i) => ({
              value: String(i),
              label: l,
            }))}
          />
        </Section>
      </>
    );
  },
};

export const 입력_칸: Story = {
  render: function Render() {
    const [on, setOn] = useState(true);
    const [agree, setAgree] = useState(true);
    const [pick, setPick] = useState("a");
    const [desc, setDesc] = useState("");
    const [today] = useState(() => kstDateKey(new Date()));
    const [range, setRange] = useState(() => ({ start: addDaysToKey(today, -6), end: today }));
    const [bank, setBank] = useState<string | undefined>(undefined);
    const [rangeOpen, setRangeOpen] = useState(false);
    return (
      <>
        <Section title="입력 칸 · 기본 / 고칠 곳 / 꺼진 칸">
          <Field label="휴대폰 번호" helper="하이픈 없이 숫자만">
            {(p) => (
              <TextInput
                id={p.id}
                aria-describedby={p.describedBy}
                inputMode="numeric"
                placeholder="01012345678"
              />
            )}
          </Field>
          <Field label="위치" error="주소를 골라 주세요">
            {(p) => (
              <TextInput
                id={p.id}
                aria-describedby={p.describedBy}
                invalid={p.invalid}
                placeholder="주소 검색"
              />
            )}
          </Field>
          <Field label="사업자등록번호" helper="바꿀 수 없는 칸">
            {(p) => (
              <TextInput id={p.id} aria-describedby={p.describedBy} value="000-00-00000" readOnly />
            )}
          </Field>
          <Field label="인증번호" trailing={<Button variant="secondary">재전송</Button>}>
            {(p) => <TextInput id={p.id} inputMode="numeric" placeholder="6자리" />}
          </Field>
        </Section>
        <Section title="고르는 칸 48 · 몇 개 중 하나·날짜·기간 모두 앱 창으로 · 여러 줄 · 검색">
          <SheetSelect
            label="정산 은행"
            value={bank}
            placeholder="은행 고르기"
            options={[
              { value: "kb", label: "KB국민" },
              { value: "shinhan", label: "신한" },
              { value: "kakao", label: "카카오뱅크" },
            ]}
            onChange={setBank}
          />
          <PickerButton
            aria-label="기간 고르기"
            value={`${range.start} ~ ${range.end}`}
            onClick={() => setRangeOpen(true)}
          />
          <DateRangeSheet
            open={rangeOpen}
            onClose={() => setRangeOpen(false)}
            start={range.start}
            end={range.end}
            max={today}
            onApply={(start, end) => {
              setRange({ start, end });
              setRangeOpen(false);
            }}
          />
          <Field
            label="스토어 설명"
            counter={`${desc.length}/2,000`}
            helper="가게 소개, 주문 방법, 픽업 안내"
          >
            {(p) => (
              <TextArea
                id={p.id}
                aria-describedby={p.describedBy}
                maxLength={2000}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="가게 소개, 주문 방법, 픽업 안내 등을 적어 주세요."
              />
            )}
          </Field>
          <div className="flex gap-2">
            <SearchInput label="상품 찾기" placeholder="상품명 검색" />
            <FieldIconButton icon="filter" label="정렬과 거르기" active />
          </div>
        </Section>
        <Section title="켜고 끄기 · 체크 · 하나 고르기">
          <div className="flex items-center gap-4">
            <Switch label="주문 알림 받기" checked={on} onChange={setOn} />
            <Switch label="꺼진 예" checked={false} onChange={() => undefined} />
          </div>
          <Checkbox checked={agree} onChange={setAgree}>
            [필수] 판매자 이용약관 동의
          </Checkbox>
          <Radio name="sort" value="a" checked={pick === "a"} onChange={setPick}>
            픽업 가까운 순
          </Radio>
          <Radio name="sort" value="b" checked={pick === "b"} onChange={setPick}>
            최신순
          </Radio>
        </Section>
      </>
    );
  },
};

export const 목록과_칸: Story = {
  render: () => (
    <>
      <Section title="목록 줄 · 최소 높이 52(큰 줄 56)">
        <div>
          <ListRowLink
            to="/"
            tall
            leading={
              <RowIconBox>
                <TaskIcon name="confirm" active />
              </RowIconBox>
            }
            title="예약 확인"
            description="확인해야 손님이 입금할 수 있어요"
            trailing={<RowCount value={2} />}
          />
          <ListRowLink
            to="/"
            tall
            dimmed
            leading={
              <RowIconBox>
                <TaskIcon name="refund" active={false} />
              </RowIconBox>
            }
            title="환불 처리"
            description="송금하고 환불 완료"
            trailing={<RowCount value={0} dimmed />}
          />
          <ListRow
            title="주문 알림 받기"
            description="예약 신청, 입금·확정, 취소·환불 알림"
            trailing={<Switch label="주문 알림 받기" checked onChange={() => undefined} />}
          />
          <ListRowButton
            onClick={() => undefined}
            title="앱 버전"
            trailing={<span className="text-sub text-ink-600">1.0.0</span>}
            divider={false}
          />
        </div>
        <GrayBand />
        <GroupTitle action={<span className="text-sub text-ink-600">11월 6일(금)</span>}>
          처리할 주문 4건
        </GroupTitle>
        <SectionTitle title="가격과 사이즈" description="손님이 고를 사이즈와 가격이에요" />
        <InfoRow label="연락처" value="010-0000-0000" />
      </Section>
      <Section title="카드 · 사진 칸 · 단계 막대">
        <Card footer={<CardFooterButton onClick={() => undefined}>예약 확정</CardFooterButton>}>
          <div className="flex gap-3 p-4">
            <Thumb size={48} />
            <div className="flex flex-col gap-1">
              <span className="text-body font-bold">11월 10일(월) 11:00 픽업</span>
              <span className="text-sub text-ink-600">36,000원 · 입금자명 김○○</span>
            </div>
          </div>
        </Card>
        <StepBar
          current={2}
          filledThrough={2}
          steps={["예약신청", "입금대기", "입금완료", "예약확정", "픽업대기", "픽업완료"].map(
            (label) => ({ label }),
          )}
        />
        <WarningBox>진행 중인 예약과 맞지 않아 저장할 수 없습니다.</WarningBox>
      </Section>
      <Section title="빈 화면 · 불러오는 중 · 다시 시도">
        <EmptyState
          title="처리할 주문이 없어요"
          description="새 예약이 들어오면 휴대폰 알림으로 알려 드려요"
        />
        <SkeletonCards count={1} />
        <LoadErrorState onRetry={() => undefined} />
      </Section>
    </>
  ),
};

export const 아래_탭_화면: Story = {
  render: () => (
    <AppScreen
      tab="orders"
      storeId="store-1"
      header={
        <TabHeader title="주문" actions={<HeaderIconButton icon="search" label="주문 찾기" />} />
      }
    >
      <EmptyState big title="처리할 주문이 없어요" description="새 예약이 들어오면 여기에 보여요" />
    </AppScreen>
  ),
};

export const 홈_위쪽_줄: Story = {
  render: () => (
    <HomeHeader
      storeName="달콤케이크"
      switchable
      onSwitchStore={() => undefined}
      unreadCount={3}
      onOpenNotifications={() => undefined}
    />
  ),
};

export const 안쪽_화면과_버튼_띠: Story = {
  render: () => (
    <AppScreen
      header={<BackHeader title="상품 등록" />}
      footer={
        <BottomActionBar reason="고칠 곳 2개 · 눌러서 보기" onReasonClick={() => undefined}>
          <ButtonPair primaryWeight={2}>
            <Button variant="secondary">고칠 곳 2개</Button>
            <Button disabled>등록하기</Button>
          </ButtonPair>
        </BottomActionBar>
      }
    >
      <SectionTitle title="기본 정보" />
      <Field label="상품 이름">
        {(p) => <TextInput id={p.id} placeholder="예: 딸기 생크림 케이크" />}
      </Field>
    </AppScreen>
  ),
};

export const 확인_창: Story = {
  render: function Render() {
    const [open, setOpen] = useState(true);
    return (
      <div className="p-5">
        <Button onClick={() => setOpen(true)}>창 열기</Button>
        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
          title="예약을 확정하시겠습니까?"
          footer={
            <ButtonPair>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                돌아가기
              </Button>
              <Button onClick={() => setOpen(false)}>예약 확정</Button>
            </ButtonPair>
          }
        >
          <p className="text-sub text-ink-600">
            이 작업은 처리 후 되돌릴 수 없습니다. 계속하시겠습니까?
          </p>
        </BottomSheet>
      </div>
    );
  },
};
