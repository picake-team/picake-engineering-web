import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/apps/web-seller/common/components/cards/Card";
import { Textarea } from "@/apps/web-seller/common/components/textareas/Textarea";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { useMypageWithdraw } from "@/apps/web-seller/features/mypage/hooks/mutations/useMypageMutation";
import { useAuthStore } from "@/apps/web-seller/features/auth/store/auth.store";

const MAX_REASON_LENGTH = 1000;

export const MypageWithdrawSection: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const withdrawMutation = useMypageWithdraw();

  const [reason, setReason] = useState("");
  const [agreed, setAgreed] = useState(false);

  const trimmedReason = useMemo(() => reason.trim(), [reason]);
  const canSubmit = trimmedReason.length > 0 && agreed && !withdrawMutation.isPending;

  const handleWithdraw = async () => {
    if (!canSubmit) return;
    const ok = window.confirm(
      "정말로 회원 탈퇴를 진행하시겠어요? 탈퇴 시 계정·스토어·상품 등 모든 정보가 삭제되며 복구할 수 없습니다.",
    );
    if (!ok) return;

    await withdrawMutation.mutateAsync({ reason: trimmedReason });
    logout(navigate);
  };

  return (
    <Card className="border-red-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-red-600">회원 탈퇴</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          탈퇴 사유를 남겨주시면 서비스 개선에 활용됩니다. 탈퇴 시 계정·스토어·상품 등 모든 정보가
          삭제되며, 동일 OAuth·휴대폰으로 다시 가입할 수 있습니다.
        </p>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="withdraw-reason">
            탈퇴 사유
          </label>
          <Textarea
            id="withdraw-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="탈퇴 사유를 입력해 주세요."
            maxLength={MAX_REASON_LENGTH}
            rows={5}
          />
          <p className="text-right text-xs text-muted-foreground">
            {trimmedReason.length}/{MAX_REASON_LENGTH}
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="h-4 w-4"
          />
          회원 탈퇴 시 계정 정보가 삭제되는 것에 동의합니다.
        </label>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleWithdraw()}
            disabled={!canSubmit}
          >
            {withdrawMutation.isPending ? "탈퇴 처리 중…" : "회원 탈퇴"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
