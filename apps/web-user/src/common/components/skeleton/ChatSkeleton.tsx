import { Skeleton, SkeletonCircle, SkeletonText } from "./Skeleton";

/** 채팅 목록 뼈대(가게 사진 동그라미 + 이름·미리보기 두 줄 + 시각, 기획 I-11) */
export function ChatListSkeleton() {
  return (
    <div className="px-[20px]" aria-busy="true" aria-label="불러오는 중">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-[12px] py-[14px]">
          <SkeletonCircle className="h-[44px] w-[44px] shrink-0" />
          <div className="min-w-0 flex-1 space-y-[6px]">
            <SkeletonText className="w-28" />
            <SkeletonText className="w-48" />
          </div>
          <SkeletonText className="w-10 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** 채팅방 뼈대(왼쪽·오른쪽 말풍선) */
export function ChatRoomSkeleton({ count = 6 }: { count?: number }) {
  const widths = ["w-48", "w-36", "w-56", "w-40", "w-52", "w-32"];
  return (
    <div className="flex flex-col gap-[10px]" aria-busy="true" aria-label="불러오는 중">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-[44px] rounded-2xl ${widths[i % widths.length]} ${i % 2 === 1 ? "self-end" : ""}`}
        />
      ))}
    </div>
  );
}
