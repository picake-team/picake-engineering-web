"use client";

import { ProductDetailSubTitle } from "../common/ProductDetailSubTitle";
import { CakeSizeOption, CakeFlavorOption, VisibleStatus } from "../../types/product.type";

interface ProductDetailSizeFlavorSectionProps {
  cakeSizeOptions: CakeSizeOption[];
  cakeFlavorOptions: CakeFlavorOption[];
}

const SIZE_PIXELS = [40, 60, 84, 96];

function getSizePixel(index: number): number {
  if (index < SIZE_PIXELS.length) {
    return SIZE_PIXELS[index];
  }
  return SIZE_PIXELS[SIZE_PIXELS.length - 1]; // 96px
}

export function ProductDetailSizeFlavorSection({
  cakeSizeOptions,
  cakeFlavorOptions,
}: ProductDetailSizeFlavorSectionProps) {
  const visibleSizeOptions = cakeSizeOptions.filter(
    (option) => option.visible === VisibleStatus.ENABLE,
  );

  const visibleFlavorOptions = cakeFlavorOptions.filter(
    (option) => option.visible === VisibleStatus.ENABLE,
  );

  const maxSize = getSizePixel(visibleSizeOptions.length - 1);

  return (
    <div>
      {/* 사이즈 옵션 */}
      {visibleSizeOptions.length > 0 && (
        <div className="mt-[4px] mb-[36px]">
          <ProductDetailSubTitle>사이즈</ProductDetailSubTitle>
          <div className="mb-[24px] px-[18px] overflow-x-auto">
            {/* 내용이 넘치지 않으면 mx-auto로 중앙, 넘치면 왼쪽부터 스크롤(잘림 없음) */}
            <div className="flex items-end gap-[6px] w-max mx-auto">
              {visibleSizeOptions.map((option, index) => {
                const size = getSizePixel(index);
                return (
                  <div key={index} className="flex flex-col items-center text-center gap-[9px]">
                    <div className="flex items-center justify-center" style={{ height: maxSize }}>
                      <div
                        className="relative overflow-hidden rounded-full border border-gray-300 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-0 before:w-full before:border-b before:border-dashed before:border-gray-300"
                        style={{ width: size, height: size }}
                      />
                    </div>
                    <span className="text-sm text-gray-700">
                      {option.displayName} <br /> {option.lengthCm}cm
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-[4px] py-[16px] px-[20px] bg-gray-50 rounded-lg">
            {visibleSizeOptions.map((option, index) => {
              return (
                <div key={index} className="flex justify-between text-[13px]">
                  <span className="text-gray-700">{option.displayName}</span>
                  <span className="ml-auto text-gray-900">{option.description}</span>
                  <span className="relative ml-[24px] w-[70px] text-right text-gray-900 after:absolute after:left-[-12px] after:top-1/2 after:-translate-y-1/2 after:w-[1px] after:h-[8px] after:bg-gray-200 after:content-['']">
                    + {option.price.toLocaleString()}원
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* 맛 옵션 */}
      {visibleFlavorOptions.length > 0 && (
        <div>
          <ProductDetailSubTitle>케이크 맛</ProductDetailSubTitle>
          <div className="flex flex-col gap-[4px] py-[16px] px-[20px] bg-gray-50 rounded-lg">
            {visibleFlavorOptions.map((option, index) => {
              return (
                <div key={index} className="flex justify-between text-[13px]">
                  <span className="text-gray-700">{option.displayName}</span>
                  <span className="relative ml-[24px] w-[70px] text-right text-gray-900">
                    + {option.price.toLocaleString()}원
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
