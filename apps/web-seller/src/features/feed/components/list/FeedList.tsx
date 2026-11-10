import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import DOMPurify from "isomorphic-dompurify";
import he from "he";
import type { FeedResponseDto } from "@/apps/web-seller/features/feed/types/feed.dto";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { EmptyState } from "@/apps/web-seller/common/components/fallbacks/EmptyState";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { EmptyState as AppEmptyState } from "@/apps/web-seller/common/ui/Surface";

function getContentPreview(content: string, maxLength = 80): string {
  const sanitized = DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  const textContent = he.decode(sanitized.replace(/&nbsp;/g, " ")).trim();
  return textContent.length > maxLength ? `${textContent.substring(0, maxLength)}...` : textContent;
}

interface FeedListProps {
  feeds: FeedResponseDto[];
}

export const FeedList: React.FC<FeedListProps> = ({ feeds }) => {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const inFrame = useInMobileFrame();

  if (feeds.length === 0) {
    if (inFrame) {
      // 휴대폰: 다른 빈 화면처럼 남은 칸 가운데 아이콘 + 한 줄 + 할 일 버튼
      return (
        <AppEmptyState
          big
          title="등록된 피드가 없어요"
          description="가게 소식을 올리면 손님 앱 스토어 화면에 보여요"
          action={
            <Button
              className="px-8"
              onClick={() => storeId && navigate(ROUTES.STORE_DETAIL_FEED_CREATE(storeId))}
            >
              피드 등록
            </Button>
          }
        />
      );
    }
    return <EmptyState message="등록된 피드가 없어요." />;
  }

  if (inFrame) {
    // 휴대폰(디자인 A90): 72 사진 + 제목·두 줄 미리보기·날짜, 줄마다 아래 선
    return (
      <div className="-mt-2 flex flex-col font-app">
        {feeds.map((feed) => {
          const createdAt =
            feed.createdAt instanceof Date ? feed.createdAt : new Date(feed.createdAt);
          const thumbnailUrl = feed.imageUrls?.[0] ?? feed.storeLogoImageUrl;
          return (
            <button
              key={feed.id}
              type="button"
              onClick={() => storeId && navigate(ROUTES.STORE_DETAIL_FEED_DETAIL(storeId, feed.id))}
              className="flex w-full gap-3 border-b border-ink-100 py-4 text-left active:bg-ink-50"
            >
              <span className="flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-control bg-ink-50 text-ink-400">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover"
                  />
                ) : (
                  <Icon name="cake" size={24} strokeWidth={1.6} />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="line-clamp-1 text-body font-bold text-ink-900">{feed.title}</span>
                <span className="line-clamp-2 text-sub leading-normal text-ink-600">
                  {getContentPreview(feed.content)}
                </span>
                <span className="text-caption text-ink-600">
                  {createdAt.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  const handleFeedClick = (feedId: string) => {
    if (storeId) {
      navigate(ROUTES.STORE_DETAIL_FEED_DETAIL(storeId, feedId));
    }
  };

  return (
    <div className="space-y-2">
      {feeds.map((feed) => {
        const createdAt =
          feed.createdAt instanceof Date ? feed.createdAt : new Date(feed.createdAt);
        const thumbnailUrl = feed.imageUrls?.[0] ?? feed.storeLogoImageUrl;

        return (
          <div
            key={feed.id}
            onClick={() => handleFeedClick(feed.id)}
            className="group flex cursor-pointer items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md"
          >
            {/* 피드 썸네일 (피드 이미지 → 스토어 로고 → 플레이스홀더) */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt="피드"
                  width={64}
                  height={64}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs font-medium text-muted-foreground">
                  No Image
                </div>
              )}
            </div>

            {/* 피드 정보 */}
            <div className="flex flex-1 min-w-0 flex-col justify-center">
              <div className="mb-1 text-sm font-semibold">{feed.title}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">
                {getContentPreview(feed.content)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {createdAt.toLocaleString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
