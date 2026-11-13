import { IosCustomSchemeRedirect } from "@/apps/web-user/common/components/deep-link/IosCustomSchemeRedirect";

/**
 * 견적 요청 상세(`/quote/:requestId`). 카카오 알림톡 [견적 보기]·[요청 보기] 버튼이 여는 주소라,
 * 주문 화면(`app/order/layout.tsx`)과 같이 아이폰에서는 손님 앱으로 넘긴다(picake-link-app-deep-links).
 * 요청서 쓰기(`/quote/new`)·보낸 뒤(`/quote/sent`)는 웹에서 이어 쓰는 화면이라 넘기지 않는다.
 */
export default function QuoteRequestDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IosCustomSchemeRedirect />
      {children}
    </>
  );
}
