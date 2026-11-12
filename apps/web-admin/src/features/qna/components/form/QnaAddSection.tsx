import { useState } from "react";
import { BaseButton as Button } from "@/apps/web-admin/common/components/buttons/BaseButton";
import { Checkbox } from "@/apps/web-admin/common/components/inputs/Checkbox";
import { Input } from "@/apps/web-admin/common/components/inputs/Input";
import { Label } from "@/apps/web-admin/common/components/labels/Label";
import { useCreateQna } from "@/apps/web-admin/features/qna/hooks/mutations/useQnaMutation";

export function QnaAddSection() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateQna();
  const isBusy = createMutation.isPending;

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setCategory("");
    setIsPinned(false);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      setFormError("질문을 입력해주세요.");
      return;
    }
    if (!answer.trim()) {
      setFormError("답변을 입력해주세요.");
      return;
    }

    await createMutation.mutateAsync({
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim(),
      isPinned,
      isActive: true,
    });
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="qna-category">카테고리 (선택)</Label>
        <Input
          id="qna-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="예: 주문/예약, 서비스 이용"
          disabled={isBusy}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="qna-question">질문</Label>
        <Input
          id="qna-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Q&A 질문을 입력하세요"
          disabled={isBusy}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="qna-answer">답변</Label>
        <textarea
          id="qna-answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Q&A 답변을 입력하세요"
          disabled={isBusy}
          rows={5}
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <Checkbox
        id="qna-is-pinned"
        checked={isPinned}
        onChange={setIsPinned}
        disabled={isBusy}
        label="핀 고정 (카테고리 내 최상단에 고정 표시)"
      />

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <div className="flex justify-end border-t pt-4">
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isBusy || !question.trim() || !answer.trim()}
        >
          {createMutation.isPending ? "등록 중..." : "Q&A 등록"}
        </Button>
      </div>
    </div>
  );
}
