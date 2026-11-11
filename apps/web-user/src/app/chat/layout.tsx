import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "채팅",
  description: "가게 사장님과 채팅으로 물어보세요.",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
