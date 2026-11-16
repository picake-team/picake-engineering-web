import { RotateCcw } from "lucide-react";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { cn } from "@/apps/web-seller/common/utils/classname.util";

/**
 * PC 화면에서 불러오지 못했을 때(휴대폰 화면 LoadErrorState와 같은 글). 실패를 "없음"으로 보이면
 * 스토어가 있는데 "스토어가 없습니다"로 보여 같은 가게를 또 만들 위험이 있었다(11-17).
 */
export function PcLoadError({ onRetry, className }: { onRetry: () => void; className?: string }) {
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  return (
    <div className={cn("flex flex-col items-center gap-3 py-12 text-center", className)}>
      <p className="text-base font-semibold">
        {offline ? "인터넷 연결을 확인해 주세요" : "불러오지 못했어요"}
      </p>
      <p className="text-sm text-muted-foreground">
        {offline ? "연결되면 다시 불러올게요" : "잠시 뒤 다시 시도해 주세요"}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
        <RotateCcw className="h-4 w-4" />
        다시 시도
      </Button>
    </div>
  );
}
