import { Skeleton, SkeletonText } from "./Skeleton";

export function ProductDetailSkeleton() {
  return (
    <div className="pb-[100px]">
      {/* 이미지 갤러리 */}
      <Skeleton className="w-full aspect-square" />

      {/* 상품 정보 */}
      <div className="px-5 py-5 space-y-3">
        <SkeletonText className="w-20" />
        <Skeleton className="h-6 w-48 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-24 rounded" />
          <SkeletonText className="w-16 line-through" />
        </div>
        <div className="flex items-center gap-1 mt-2">
          <Skeleton className="w-[18px] h-[18px] rounded-full" />
          <SkeletonText className="w-8" />
          <SkeletonText className="w-20" />
        </div>
      </div>

      {/* 탭 */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {["상세정보", "사이즈·옵션", "후기", "이용안내"].map((tab) => (
            <div key={tab} className="flex-1 py-3 flex justify-center">
              <SkeletonText className="w-14" />
            </div>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="px-5 py-6 space-y-3">
        <SkeletonText className="w-full" />
        <SkeletonText className="w-full" />
        <SkeletonText className="w-3/4" />
        <Skeleton className="w-full h-[200px] rounded-xl mt-4" />
      </div>

      {/* 하단 바 */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[638px] bg-white border-gray-200 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.16)]">
        <div className="flex items-center gap-[16px] px-[20px] py-[10px]">
          <Skeleton className="w-[40px] h-[40px] rounded" />
          <Skeleton className="flex-1 h-[48px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
