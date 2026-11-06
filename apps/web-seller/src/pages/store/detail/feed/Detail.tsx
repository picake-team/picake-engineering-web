import React, { useState } from "react";
import { PageTitle } from "@/apps/web-seller/common/components/layouts/MobileFrame";
import {
  FRAME_SUBMIT_BUTTON_CLASS,
  useInMobileFrame,
} from "@/apps/web-seller/common/components/layouts/mobile-frame.context";

import { useParams } from "react-router-dom";
import { useFeedDetail } from "@/apps/web-seller/features/feed/hooks/queries/useFeedQuery";
import {
  useUpdateFeed,
  useDeleteFeed,
} from "@/apps/web-seller/features/feed/hooks/mutations/useFeedMutation";
import type { UpdateFeedRequestDto } from "@/apps/web-seller/features/feed/types/feed.dto";
import { Card, CardContent } from "@/apps/web-seller/common/components/cards/Card";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { Label } from "@/apps/web-seller/common/components/labels/Label";
import { Textarea } from "@/apps/web-seller/common/components/textareas/Textarea";
import { ImageMultiUpload } from "@/apps/web-seller/features/upload/components/ImageMultiUpload";
import { ContentLoading } from "@/apps/web-seller/common/components/loading/ContentLoading";

const FEED_MAX_IMAGES = 5;

export const StoreDetailFeedDetailPage: React.FC = () => {
  const inFrame = useInMobileFrame();
  const { storeId, feedId } = useParams<{ storeId: string; feedId: string }>();
  const updateFeedMutation = useUpdateFeed();
  const deleteFeedMutation = useDeleteFeed();

  const { data: feed, isLoading } = useFeedDetail(storeId || "", feedId || "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");

  // 피드 데이터 로드 시 폼 초기화
  React.useEffect(() => {
    if (feed) {
      setTitle(feed.title);
      setContent(feed.content);
      setImageUrls(feed.imageUrls ?? []);
    }
  }, [feed]);

  if (!storeId || !feedId) {
    return (
      <div>
        <h2 className="text-xl font-semibold">스토어 또는 피드가 선택되지 않았습니다.</h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <ContentLoading
        variant="page"
        message="피드를 불러오는 중…"
        className="border-0 shadow-none"
      />
    );
  }

  if (!feed) {
    return (
      <div>
        <h2 className="text-xl font-semibold">피드를 찾을 수 없습니다.</h2>
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    let isValid = true;
    if (!title.trim()) {
      setTitleError("제목을 입력해주세요.");
      isValid = false;
    } else {
      setTitleError("");
    }

    if (!content.trim()) {
      setContentError("내용을 입력해주세요.");
      isValid = false;
    } else {
      setContentError("");
    }

    if (!isValid) return;

    const request: UpdateFeedRequestDto = {
      title: title.trim(),
      content,
      imageUrls,
    };

    await updateFeedMutation.mutateAsync({ storeId, feedId, request });
  };

  const handleDelete = async () => {
    if (!window.confirm("정말 이 피드를 삭제하시겠습니까?")) {
      return;
    }

    await deleteFeedMutation.mutateAsync({ feedId, storeId });
  };

  return (
    <div className="space-y-6">
      <PageTitle className="text-3xl font-bold">피드 수정</PageTitle>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleUpdate} className="space-y-6">
            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError("");
                }}
                placeholder="피드 제목을 입력해주세요"
                className={titleError ? "border-destructive" : ""}
              />
              {titleError && <p className="text-sm text-destructive">{titleError}</p>}
            </div>

            {/* 이미지 */}
            <div className="space-y-2">
              <Label>이미지</Label>
              <ImageMultiUpload
                value={imageUrls}
                onChange={setImageUrls}
                maxImages={FEED_MAX_IMAGES}
                width={160}
                height={160}
                enableDragDrop={true}
                showMinResolutionHint={false}
              />
            </div>

            {/* 내용 */}
            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (contentError) setContentError("");
                }}
                placeholder="피드 내용을 입력해주세요."
                rows={8}
                className={contentError ? "border-destructive" : ""}
              />
              {contentError && <p className="text-sm text-destructive">{contentError}</p>}
            </div>

            {/* 버튼 */}
            <div className={inFrame ? "flex gap-2 pt-6" : "flex justify-center gap-4 pt-6"}>
              <Button
                type="button"
                variant={inFrame ? "outline" : "destructive"}
                onClick={handleDelete}
                disabled={deleteFeedMutation.isPending || updateFeedMutation.isPending}
                className={inFrame ? FRAME_SUBMIT_BUTTON_CLASS : undefined}
              >
                삭제하기
              </Button>
              <Button
                type="submit"
                disabled={updateFeedMutation.isPending}
                className={inFrame ? FRAME_SUBMIT_BUTTON_CLASS : undefined}
              >
                {updateFeedMutation.isPending ? "수정 중..." : "수정하기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
