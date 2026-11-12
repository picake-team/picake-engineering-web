import { useState } from "react";
import { BaseButton as Button } from "@/apps/web-admin/common/components/buttons/BaseButton";
import { Checkbox } from "@/apps/web-admin/common/components/inputs/Checkbox";
import { Input } from "@/apps/web-admin/common/components/inputs/Input";
import { Label } from "@/apps/web-admin/common/components/labels/Label";
import { useCreateNotice } from "@/apps/web-admin/features/notice/hooks/mutations/useNoticeMutation";

export function NoticeAddSection() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateNotice();
  const isBusy = createMutation.isPending;

  const resetForm = () => {
    setTitle("");
    setContent("");
    setIsPinned(false);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setFormError("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      setFormError("내용을 입력해주세요.");
      return;
    }

    await createMutation.mutateAsync({
      title: title.trim(),
      content: content.trim(),
      isPinned,
      isActive: true,
    });
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="notice-title">제목</Label>
        <Input
          id="notice-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="공지사항 제목을 입력하세요"
          disabled={isBusy}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notice-content">내용</Label>
        <textarea
          id="notice-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="공지사항 내용을 입력하세요"
          disabled={isBusy}
          rows={5}
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <Checkbox
        id="notice-is-pinned"
        checked={isPinned}
        onChange={setIsPinned}
        disabled={isBusy}
        label="핀 고정 (목록 최상단에 고정 표시)"
      />

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <div className="flex justify-end border-t pt-4">
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isBusy || !title.trim() || !content.trim()}
        >
          {createMutation.isPending ? "등록 중..." : "공지사항 등록"}
        </Button>
      </div>
    </div>
  );
}
