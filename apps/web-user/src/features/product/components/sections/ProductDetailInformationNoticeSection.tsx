"use client";

import { useRef } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/apps/web-user/common/components/accordions/Accordion";
import { Product } from "@/apps/web-user/features/product/types/product.type";
import {
  formatRefundRulePeriodLabel,
  visibleRefundRules,
} from "@/apps/web-user/features/store/types/store.type";

interface ProductDetailInformationNoticeSectionProps {
  product: Product;
}

interface NoticeItem {
  label: string;
  value: string;
}

export function ProductDetailInformationNoticeSection({
  product,
}: ProductDetailInformationNoticeSectionProps) {
  // 가게가 정한 환불·취소 규정(예약 확인·예약 상세와 같은 표)
  const refundRules = visibleRefundRules(product.storeRefundCancellationPolicy);
  const noticeInfoRef = useRef<HTMLDivElement>(null);
  const cancellationRef = useRef<HTMLDivElement>(null);

  const handleValueChange = (value: string) => {
    if (!value) return;

    setTimeout(() => {
      const targetRef = value === "notice-info" ? noticeInfoRef : cancellationRef;
      targetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const noticeItems: NoticeItem[] = [
    { label: "상품번호", value: product.id },
    { label: "제품명", value: product.name },
    { label: "식품의 유형", value: product.productNoticeFoodType },
    { label: "제조사", value: product.productNoticeProducer },
    { label: "원산지", value: product.productNoticeOrigin },
    { label: "소재지", value: product.productNoticeAddress },
    { label: "제조연월일", value: product.productNoticeManufactureDate },
    { label: "소비기한 또는 품질유지기한", value: product.productNoticeExpirationDate },
    { label: "포장단위별 용량/수량", value: product.productNoticePackageCapacity },
    { label: "포장 단위별 수량", value: product.productNoticePackageQuantity },
    { label: "원재료명 및 함량", value: product.productNoticeIngredients },
    { label: "영양성분", value: product.productNoticeCalories },
    { label: "소비자안전을 위한 주의사항", value: product.productNoticeSafetyNotice },
    { label: "유전자변형식품에 해당하는 경우", value: product.productNoticeGmoNotice },
    { label: "수입식품의 경우", value: product.productNoticeImportNotice },
    { label: "고객센터", value: product.productNoticeCustomerService },
    // 판매자가 적은 항목만 보여 준다 (고시는 원산지만 필수, 나머지는 선택)
  ].filter((item) => item.value?.trim());

  return (
    <div>
      <Accordion type="single" collapsible onValueChange={handleValueChange}>
        <AccordionItem
          ref={noticeInfoRef}
          value="notice-info"
          style={{ border: "none", scrollMarginTop: "52px" }}
        >
          <AccordionTrigger className="py-[16px]">상품 정보</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-[12px] py-[12px] px-[16px] text-[13px] bg-gray-50 rounded-lg">
              {noticeItems.map((item, index) => (
                <div key={index} className="flex flex-col gap-[2px]">
                  <p className="text-gray-500">{item.label}</p>
                  <p className="text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem
          ref={cancellationRef}
          value="cancellation-refund"
          style={{ border: "none", scrollMarginTop: "52px" }}
        >
          <AccordionTrigger className="py-[16px]">취소 및 환불</AccordionTrigger>
          <AccordionContent>
            {refundRules.length === 0 ? (
              <p className="text-2sm text-gray-500">등록된 환불·취소 규정이 없어요.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
                {refundRules.map(({ daysBeforePickup, refundDescription }, index) => (
                  <div
                    key={`${daysBeforePickup}-${index}`}
                    className="flex items-center border-b border-gray-100 text-2sm text-gray-900 last:border-b-0"
                  >
                    <span className="w-[110px] shrink-0 border-r border-gray-100 px-4 py-3 text-gray-500">
                      {formatRefundRulePeriodLabel(daysBeforePickup)}
                    </span>
                    <span className="px-4 py-3 text-gray-900">{refundDescription}</span>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
