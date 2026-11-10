import { Skeleton, SkeletonText } from "@/apps/web-user/common/components/skeleton/Skeleton";

/**
 * 라우트 전환 공통 로딩 UI.
 * 다음 화면이 오기 전 빈틈에 흰 화면 + "페이지를 불러오는 중" 대신 회색 뼈대를 보여
 * 앱처럼 가는 화면 모양이 먼저 보이게 한다(상품 화면 뼈대와 같은 결).
 * 머리줄은 화면마다 달라(홈은 공통 머리줄이 이미 있음) 그리지 않는다.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="불러오는 중" className="min-h-screen bg-white">
      <div className="flex flex-col gap-4 px-5 pt-5">
        <Skeleton className="h-[160px] w-full rounded-xl" />
        <SkeletonText className="w-2/3" />
        <SkeletonText className="w-1/2" />
        <Skeleton className="h-[72px] w-full rounded-xl" />
        <Skeleton className="h-[72px] w-full rounded-xl" />
      </div>
    </div>
  );
}
