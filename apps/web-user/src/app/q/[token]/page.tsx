"use client";

import { useParams } from "next/navigation";
import { QuoteLinkScreen } from "@/apps/web-user/features/quote/components/link/QuoteLinkScreen";

/** 사장님 견적 링크(기획 I-46 SC-19). 운영자가 인스타 DM·카톡으로 보낸 그 가게만의 주소 */
export default function QuoteLinkPage() {
  const { token } = useParams<{ token: string }>();
  return <QuoteLinkScreen token={token ?? ""} />;
}
