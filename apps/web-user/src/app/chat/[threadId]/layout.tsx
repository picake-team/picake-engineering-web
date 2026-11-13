import { IosCustomSchemeRedirect } from "@/apps/web-user/common/components/deep-link/IosCustomSchemeRedirect";

/**
 * 채팅방(`/chat/:threadId`). 카카오 알림톡 [답변 보기] 버튼이 여는 주소라, 주문·견적 화면처럼
 * 아이폰에서는 손님 앱으로 넘긴다(picake-link-app-deep-links). 앱은 예전·새 앱 모두 `picake://` 뒤 경로를 그대로 연다.
 * 채팅 목록(`/chat`)·가게에서 문의 시작(`/chat/store/:storeId`)은 웹에서 이어 쓰는 화면이라 넘기지 않는다.
 */
export default function ChatRoomLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IosCustomSchemeRedirect />
      {children}
    </>
  );
}
