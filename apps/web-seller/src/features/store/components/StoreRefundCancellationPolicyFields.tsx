import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/apps/web-seller/common/components/labels/Label";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import type { RefundCancellationPolicyDto } from "@/apps/web-seller/features/store/types/store.dto";
import {
  appendRefundRule,
  removeRefundRuleAt,
  updateRefundRuleAt,
} from "@/apps/web-seller/features/store/utils/refund-cancellation-policy.util";

interface Props {
  policy: RefundCancellationPolicyDto;
  onChange: (next: RefundCancellationPolicyDto) => void;
  sectionError?: string;
}

export const StoreRefundCancellationPolicyFields: React.FC<Props> = ({
  policy,
  onChange,
  sectionError,
}) => {
  const rules = policy.rules ?? [];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-border bg-muted/10">
        <div className="flex items-center justify-end gap-2 border-b border-border bg-muted/30 px-3 py-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
            disabled={rules.length >= 30}
            onClick={() => onChange(appendRefundRule(policy))}
          >
            <Plus className="h-3.5 w-3.5" />
            추가
          </Button>
        </div>
        <div className="space-y-2 p-3">
          {rules.map((row, index) => (
            <div
              key={index}
              className="flex flex-nowrap items-center gap-2 rounded-md border border-border bg-background p-3 sm:gap-3"
            >
              <span className="text-sm text-muted-foreground shrink-0">픽업</span>
              <div className="w-[72px] shrink-0 sm:w-[100px]">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  required
                  aria-label={`픽업 며칠 전 (${index + 1}번째)`}
                  value={row.daysBeforePickup ?? ""}
                  onChange={(e) => {
                    // type="text"에서도 숫자 검증이 동작하도록 숫자만 추출해 파싱한다.
                    const raw = e.target.value.replace(/[^\d]/g, "");
                    const n = raw === "" ? undefined : Number.parseInt(raw, 10);
                    onChange(
                      updateRefundRuleAt(policy, index, {
                        daysBeforePickup: Number.isFinite(n) ? (n as number) : 0,
                      }),
                    );
                  }}
                />
              </div>
              <span className="text-sm text-muted-foreground shrink-0">일 전</span>
              <div className="min-w-0 flex-1">
                <Label className="sr-only">환불·취소 조건</Label>
                <Input
                  required
                  placeholder="예: 결제액의 50% 환불"
                  value={row.refundDescription}
                  onChange={(e) =>
                    onChange(
                      updateRefundRuleAt(policy, index, { refundDescription: e.target.value }),
                    )
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto shrink-0 text-destructive"
                disabled={rules.length <= 1}
                onClick={() => onChange(removeRefundRuleAt(policy, index))}
                aria-label={`${index + 1}번째 규칙 삭제`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {sectionError && <p className="text-sm text-destructive">{sectionError}</p>}
    </div>
  );
};
