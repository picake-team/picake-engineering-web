import React, { useState } from "react";
import { PageTitle } from "@/apps/web-seller/common/components/layouts/MobileFrame";
import {
  FRAME_SUBMIT_BUTTON_CLASS,
  useInMobileFrame,
} from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { FrameSubmitBar } from "@/apps/web-seller/common/components/layouts/FrameSubmitBar";

import { useParams } from "react-router-dom";
import { useCreateFeed } from "@/apps/web-seller/features/feed/hooks/mutations/useFeedMutation";
import type { CreateFeedRequestDto } from "@/apps/web-seller/features/feed/types/feed.dto";
import { Card, CardContent } from "@/apps/web-seller/common/components/cards/Card";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { Label } from "@/apps/web-seller/common/components/labels/Label";
import { Textarea } from "@/apps/web-seller/common/components/textareas/Textarea";
import { ImageMultiUpload } from "@/apps/web-seller/features/upload/components/ImageMultiUpload";

const FEED_MAX_IMAGES = 5;

export const StoreDetailFeedCreatePage: React.FC = () => {
  const inFrame = useInMobileFrame();
  const { storeId } = useParams<{ storeId: string }>();
  const createFeedMutation = useCreateFeed();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");

  if (!storeId) {
    return (
      <div>
        <h2 className="text-xl font-semibold">스토어가 선택되지 않았습니다.</h2>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

    const request: CreateFeedRequestDto = {
      storeId,
      title: title.trim(),
      content,
      imageUrls,
    };

    await createFeedMutation.mutateAsync({ storeId, request });
  };

  // 버튼: 휴대폰 틀 안에서는 늘 화면 맨 아래 저장 줄(FrameSubmitBar), PC는 폼 아래 가운데
  const submitButton = (
    <Button
      type="submit"
      disabled={createFeedMutation.isPending}
      className={inFrame ? FRAME_SUBMIT_BUTTON_CLASS : undefined}
    >
      {createFeedMutation.isPending ? "등록 중..." : "등록하기"}
    </Button>
  );

  return (
    <div className={inFrame ? "flex flex-1 flex-col" : "space-y-6"}>
      <PageTitle className="text-3xl font-bold">피드 등록</PageTitle>

      <Card className={inFrame ? "flex flex-1 flex-col" : undefined}>
        <CardContent className={inFrame ? "flex flex-1 flex-col" : "p-6"}>
          {/* 휴대폰 틀 안: 내용이 짧아도 등록 버튼 줄이 화면 아래에 붙게(디자인 A91) */}
          <form
            onSubmit={handleSubmit}
            className={inFrame ? "flex flex-1 flex-col gap-6" : "space-y-6"}
          >
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
            {inFrame ? (
              <FrameSubmitBar>{submitButton}</FrameSubmitBar>
            ) : (
              <div className="flex justify-center gap-4 pt-6">{submitButton}</div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
