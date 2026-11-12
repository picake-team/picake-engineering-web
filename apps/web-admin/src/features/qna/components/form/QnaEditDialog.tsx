import { useEffect, useState } from "react";
import { Button } from "@/apps/web-admin/common/components/buttons/Button";
import { Checkbox } from "@/apps/web-admin/common/components/inputs/Checkbox";
import { Input } from "@/apps/web-admin/common/components/inputs/Input";
import { Label } from "@/apps/web-admin/common/components/labels/Label";
import { LIST_CARD_TITLE } from "@/apps/web-admin/common/constants/list-typography.constant";
import { useUpdateQna } from "@/apps/web-admin/features/qna/hooks/mutations/useQnaMutation";
import type { QnaItemResponseDto } from "@/apps/web-admin/features/qna/types/qna.dto";

interface QnaEditDialogProps {
  item: QnaItemResponseDto | null;
  onClose: () => void;
}

export function QnaEditDialog({ item, onClose }: QnaEditDialogProps) {
  const updateMutation = useUpdateQna();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setQuestion(item.question);
    setAnswer(item.answer);
    setCategory(item.category);
    setIsPinned(item.isPinned);
    setIsActive(item.isActive);
    setError(null);
  }, [item]);

  if (!item) return null;

  const handleSave = async () => {
    if (!question.trim()) {
      setError("질문을 입력해주세요.");
      return;
    }
    if (!answer.trim()) {
      setError("답변을 입력해주세요.");
      return;
    }

    await updateMutation.mutateAsync({
      id: item.id,
      dto: {
        question: question.trim(),
        answer: answer.trim(),
        category: category.trim(),
        isPinned,
        isActive,
      },
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg rounded-lg border border-border bg-card text-card-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-6 py-4">
          <h3 className={LIST_CARD_TITLE}>Q&A 수정</h3>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="edit-qna-category">카테고리 (선택)</Label>
            <Input
              id="edit-qna-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="예: 주문/예약, 서비스 이용"
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-qna-question">질문</Label>
            <Input
              id="edit-qna-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Q&A 질문을 입력하세요"
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-qna-answer">답변</Label>
            <textarea
              id="edit-qna-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Q&A 답변을 입력하세요"
              disabled={updateMutation.isPending}
              rows={6}
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Checkbox
              id="edit-qna-is-pinned"
              checked={isPinned}
              onChange={setIsPinned}
              disabled={updateMutation.isPending}
              label="핀 고정"
            />
            <Checkbox
              id="edit-qna-is-active"
              checked={isActive}
              onChange={setIsActive}
              disabled={updateMutation.isPending}
              label="노출 활성화"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={updateMutation.isPending || !question.trim() || !answer.trim()}
          >
            {updateMutation.isPending ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}
