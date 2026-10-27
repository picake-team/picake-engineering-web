import {
  CakeFlavorOption,
  CakeSizeOption,
  CustomOption,
} from "@/apps/web-user/features/product/types/product.type";
import type {
  StoreBusinessCalendar,
  RefundCancellationPolicy,
} from "@/apps/web-user/features/store/types/store.type";
import type { OptionSelections } from "@/apps/web-user/features/product/utils/custom-option.util";

/** 바텀시트에서 담은 상품 1개 (옵션은 ID 기준, 이름·가격은 표시용으로 함께 보관) */
export interface OrderItem {
  sizeId: string;
  sizeName: string;
  sizePrice: number;
  flavorId: string;
  flavorName: string;
  flavorPrice: number;
  /** 추가 옵션 선택값 (사진첨부형은 업로드 전 File 포함) */
  selections: OptionSelections;
  optionsPrice: number;
  requestMessage: string;
  quantity: number;
}

/** '선택완료'를 눌렀을 때 처음으로 비어 있는 항목 (스크롤 대상) */
export type OptionsFieldKey = "date" | "size" | "flavor" | `option:${string}`;

export interface ReservationBottomSheetProps {
  isOpen: boolean;
  productId: string;
  price: number;
  cakeTitle: string;
  cakeImageUrl: string;
  cakeImages?: string[];
  cakeSizeOptions?: CakeSizeOption[];
  cakeFlavorOptions?: CakeFlavorOption[];
  customOptions?: CustomOption[];
  /** 옵션을 고를 때 본 상품 optionsVersion (주문 시 그대로 전달) */
  optionsVersion: number;
  cakeSize?: string;
  productNoticeProducer?: string;
  productNoticeAddress?: string;
  storeName: string;
  // 픽업장소
  pickupAddress: string;
  pickupRoadAddress: string;
  pickupDetailAddress?: string;
  pickupZonecode: string;
  pickupLatitude: number;
  pickupLongitude: number;
  /** 스토어 영업 캘린더 — 캘린더에서 휴무일 disable + 영업 시간만 노출 */
  businessCalendar?: StoreBusinessCalendar;
  /** 판매자 환불·취소 규정 — 주문확인 단계 안내 박스에 노출 */
  refundCancellationPolicy?: RefundCancellationPolicy;
  onClose: () => void;
}

export type ViewType = "options" | "calendar" | "confirm";
