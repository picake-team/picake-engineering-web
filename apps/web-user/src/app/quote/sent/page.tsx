"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/apps/web-user/common/components/icons";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { useQuoteRequestDetail } from "@/apps/web-user/features/quote/hooks/useQuoteRequests";

/**
 * 견적 요청을 보낸 뒤(SC-17 1) — 지금 예약 완료 화면과 같은 모양.
 * 몇 곳에 보냈다고 미리 말하지 않고, 견적이 오면 알려 준다고만 사실대로 말한다.
 */
function QuoteSentContent() {
  const router = useRouter();
  const requestId = useSearchParams().get("requestId");
  const { data, isLoading } = useQuoteRequestDetail(requestId);

  if (!requestId) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        요청 정보가 없어요.
      </div>
    );
  }
  if (isLoading || !data) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        불러오는 중…
      </div>
    );
  }

  const photo = data.photoUrls[0];
  const rows: [string, string][] = [
    ["픽업", data.summary.pickup],
    ["받을 동네", data.summary.area],
    ["케이크", data.summary.cake],
    ["예산", data.summary.budget],
  ];

  return (
    <div className="relative h-screen">
      <div className="relative h-[30%] overflow-hidden bg-gray-100">
        {photo && (
          <img
            src={photo}
            alt=""
            className="h-full w-full max-w-none scale-110 object-cover blur-sm"
          />
        )}
        <button
          type="button"
          aria-label="닫기"
          onClick={() => router.replace(PATHS.HOME)}
          className={`absolute right-[16px] top-[14px] ${photo ? "text-white" : "text-gray-900"}`}
        >
          <Icon name="close" width={24} height={24} />
        </button>
      </div>
      <div className="absolute bottom-[76px] left-0 right-0 h-[calc(70%-48px)] rounded-t-4xl bg-white px-[20px] pt-[56px]">
        <div className="absolute left-1/2 top-[-72px] h-[106px] w-[106px] -translate-x-1/2 overflow-hidden rounded-2xl border-[2px] border-white bg-gray-100">
          {photo ? (
            <img src={photo} alt="참고 사진" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Icon name="logoPicake" width={48} height={48} />
            </div>
          )}
        </div>
        <p className="mb-[28px] text-center text-xl font-bold text-gray-900">
          견적 요청을 보냈어요
        </p>
        <div className="h-[calc(100%-56px)] overflow-y-auto pb-[60px]">
          <p className="mb-[28px] flex items-center gap-[8px] rounded-xl bg-blue-50 px-[12px] py-[10px] text-sm text-gray-900">
            <Icon name="warning" width={16} height={16} className="shrink-0 text-blue-400" />
            Picake가 근처 가게에 물어보고, 견적이 오면 알려 드릴게요
          </p>
          <div className="mb-[20px] flex flex-col gap-[6px] border-b border-gray-100 px-[16px] pb-[16px]">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-[12px] text-sm">
                <span className="shrink-0 text-gray-500">{label}</span>
                <span className="text-right text-gray-900">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-[16px] text-sm">
            <span className="text-gray-500">견적 마감</span>
            <span className="font-bold text-gray-900">{data.summary.deadline}까지</span>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-[638px] gap-[8px] bg-white px-[20px] pb-[12px] pt-[10px]">
        <Link href={PATHS.QUOTE.DETAIL(data.id)} replace className="flex-1">
          <Button variant="outline" size="lg" className="w-full">
            견적 요청 보기
          </Button>
        </Link>
        <Link href={PATHS.HOME} replace className="flex-1">
          <Button variant="outline" size="lg" className="w-full">
            홈으로 가기
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function QuoteSentPage() {
  return (
    <Suspense fallback={null}>
      <QuoteSentContent />
    </Suspense>
  );
}
