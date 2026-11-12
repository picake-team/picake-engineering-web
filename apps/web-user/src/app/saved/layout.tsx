import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "저장",
  description: "저장한 케이크와 매장 목록을 확인하세요.",
};

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
