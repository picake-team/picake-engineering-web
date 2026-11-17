import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "알림",
  description: "픽케이크 서비스 알림을 확인하세요.",
};

export default function AlarmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
