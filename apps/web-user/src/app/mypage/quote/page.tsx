"use client";

import Link from "next/link";
import Header from "@/apps/web-user/common/components/headers/Header";
import { Tabs } from "@/apps/web-user/common/components/tabs/Tabs";
import { Icon } from "@/apps/web-user/common/components/icons";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { useMyQuoteRequests } from "@/apps/web-user/features/quote/hooks/useQuoteRequests";
import { QuoteRequestCard } from "@/apps/web-user/features/quote/components/QuoteRequestCard";
import type { QuoteRequestListTab } from "@/apps/web-user/features/quote/types/quote.type";
import { QuoteLoginGate } from "@/apps/web-user/features/quote/components/QuoteLoginGate";

function QuoteList({ tab }: { tab: QuoteRequestListTab }) {
  const { data, isLoading } = useMyQuoteRequests(tab);
  if (isLoading) return <p className="py-[40px] text-center text-sm text-gray-400">불러오는 중…</p>;
  const items = data?.data ?? [];
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-[20px] px-[20px] py-[60px]">
        <Icon name="noData" width={62} height={57} />
        <p className="text-center text-sm text-gray-500">
          {tab === "ONGOING" ? "진행 중인 견적 요청이 없어요" : "지난 견적 요청이 없어요"}
        </p>
        {tab === "ONGOING" && (
          <Link href={`${PATHS.QUOTE.NEW}?entry=MYPAGE`}>
            <Button size="md" className="px-[20px]">
              견적 받기
            </Button>
          </Link>
        )}
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-[12px] py-[16px]">
      {items.map((item) => (
        <li key={item.id}>
          <QuoteRequestCard item={item} />
        </li>
      ))}
    </ul>
  );
}

/** MY > 내 견적 요청(SC-17 2): 진행 중 / 지난 요청 */
export default function MyQuotesPage() {
  return (
    <div>
      <Header variant="back-title" title="내 견적 요청" backFallbackPath={PATHS.MYPAGE} />
      <QuoteLoginGate>
        <QuoteTabs />
      </QuoteLoginGate>
    </div>
  );
}

function QuoteTabs() {
  const { data } = useMyQuoteRequests("ONGOING");
  const counts = data?.counts ?? { ongoing: 0, past: 0 };
  return (
    <>
      <Tabs
        defaultTab="ongoing"
        tabs={[
          {
            id: "ongoing",
            label: `진행 중 ${counts.ongoing}`,
            content: <QuoteList tab="ONGOING" />,
          },
          { id: "past", label: `지난 요청 ${counts.past}`, content: <QuoteList tab="PAST" /> },
        ]}
      />
    </>
  );
}
