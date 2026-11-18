import type { Metadata } from "next";
import { IosCustomSchemeRedirect } from "@/apps/web-user/common/components/deep-link/IosCustomSchemeRedirect";

export const metadata: Metadata = {
  title: "주문",
  description: "픽케이크 주문 정보를 확인하세요.",
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IosCustomSchemeRedirect />
      {children}
    </>
  );
}
