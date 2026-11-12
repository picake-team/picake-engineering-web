import { useEffect, useState } from "react";
import { Button } from "@/apps/web-admin/common/components/buttons/Button";
import { Checkbox } from "@/apps/web-admin/common/components/inputs/Checkbox";
import { Input } from "@/apps/web-admin/common/components/inputs/Input";
import { Label } from "@/apps/web-admin/common/components/labels/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/apps/web-admin/common/components/selects/Select";
import { LIST_CARD_TITLE } from "@/apps/web-admin/common/constants/list-typography.constant";
import { HOME_BANNER_ALIGN_OPTIONS } from "@/apps/web-admin/features/home-banner/constants/homeBanner.constant";
import { useUpdateHomeBanner } from "@/apps/web-admin/features/home-banner/hooks/mutations/useHomeBannerMutation";
import type {
  HomeBannerImageAlign,
  HomeBannerItemResponseDto,
} from "@/apps/web-admin/features/home-banner/types/home-banner.dto";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/apps/web-admin/features/home-banner/utils/home-banner-period.ui.util";

interface HomeBannerEditDialogProps {
  item: HomeBannerItemResponseDto | null;
  onClose: () => void;
}

export function HomeBannerEditDialog({ item, onClose }: HomeBannerEditDialogProps) {
  const updateMutation = useUpdateHomeBanner();
  const [linkUrl, setLinkUrl] = useState("");
  const [imageAlign, setImageAlign] = useState<HomeBannerImageAlign>("CENTER");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [endsAtLocal, setEndsAtLocal] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setLinkUrl(item.linkUrl ?? "");
    setImageAlign(item.imageAlign);
    setStartsAtLocal(toDatetimeLocalValue(item.startsAt));
    setEndsAtLocal(toDatetimeLocalValue(item.endsAt));
    setIsActive(item.isActive);
    setError(null);
  }, [item]);

  if (!item) return null;

  const handleSave = async () => {
    const startsAt = fromDatetimeLocalValue(startsAtLocal);
    const endsAt = fromDatetimeLocalValue(endsAtLocal);
    if (startsAt && endsAt && new Date(startsAt) > new Date(endsAt)) {
      setError("노출 종료 시각은 시작 시각보다 이후여야 합니다.");
      return;
    }

    await updateMutation.mutateAsync({
      id: item.id,
      dto: { linkUrl: linkUrl.trim() || null, imageAlign, startsAt, endsAt, isActive },
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
        className="w-full max-w-md rounded-lg border border-border bg-card text-card-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-6 py-4">
          <h3 className={LIST_CARD_TITLE}>배너 설정</h3>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="edit-link">링크 URL</Label>
            <Input
              id="edit-link"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="비우면 링크 없음"
              disabled={updateMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-align">이미지 정렬</Label>
            <Select
              value={imageAlign}
              onValueChange={(value) => setImageAlign(value as HomeBannerImageAlign)}
              disabled={updateMutation.isPending}
            >
              <SelectTrigger id="edit-align">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOME_BANNER_ALIGN_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-starts">노출 시작</Label>
              <Input
                id="edit-starts"
                type="datetime-local"
                value={startsAtLocal}
                onChange={(e) => setStartsAtLocal(e.target.value)}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ends">노출 종료</Label>
              <Input
                id="edit-ends"
                type="datetime-local"
                value={endsAtLocal}
                onChange={(e) => setEndsAtLocal(e.target.value)}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>
          <Checkbox
            checked={isActive}
            onChange={setIsActive}
            disabled={updateMutation.isPending}
            label="앱에 노출"
          />
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
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}
