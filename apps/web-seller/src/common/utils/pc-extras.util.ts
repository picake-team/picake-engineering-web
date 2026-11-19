/**
 * PC에만 있는 엑셀 내려받기·주문서 인쇄(기획 I-54)를 보여 줄지.
 * - 앱 안(아이패드 등 PC 틀이 뜨는 폭): 웹뷰가 파일 받기·인쇄 창을 열지 못한다
 * - 운영자 대신 입력 중(기획 I-41): 손님 이름이 든 파일을 운영자 PC에 남기지 않는다(P-93). 인쇄 새 탭은 대리 출입증이 없어 열리지도 않는다
 */
import { isActAsMode } from "@/apps/web-seller/common/utils/act-as.util";
import { isSellerAppWebView } from "@/apps/web-seller/common/utils/webview.bridge";

export function canExportOrPrint(): boolean {
  return !isSellerAppWebView() && !isActAsMode();
}
