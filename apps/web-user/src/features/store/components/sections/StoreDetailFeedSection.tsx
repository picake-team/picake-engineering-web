"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import DOMPurify from "isomorphic-dompurify";
import { Feed } from "@/apps/web-user/features/feed/types/feed.type";
import { useStoreFeeds } from "@/apps/web-user/features/feed/hooks/queries/useStoreFeeds";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";

interface StoreDetailFeedSectionProps {
  storeId: string;
}

interface FeedItemProps {
  feed: Feed;
}

// HTML에서 이미지 URL 추출 (레거시 HTML 콘텐츠 호환용)
function extractImagesFromHtml(html: string): string[] {
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  const images: string[] = [];
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    images.push(match[1]);
  }
  return images;
}

// HTML 엔티티 디코딩 (브라우저 내장 방식)
function decodeHtmlEntities(text: string): string {
  if (typeof document === "undefined") return text;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

// HTML에서 텍스트만 추출 (레거시 HTML 콘텐츠 호환용)
function extractTextFromHtml(html: string): string {
  const withoutTags = html.replace(/<[^>]*>/g, " ");
  const decoded = decodeHtmlEntities(withoutTags);
  return decoded.replace(/\s+/g, " ").trim();
}

// 피드 이미지 캐러셀 (좌우 스와이프, 고정 정사각형 규격)
function FeedImageCarousel({ images, title }: { images: string[]; title: string }) {
  return (
    <div className="store-feed-gallery mb-[12px] rounded-lg overflow-hidden">
      <Swiper
        modules={[Pagination]}
        pagination={{ type: "fraction" }}
        loop={images.length > 1}
        className="w-full aspect-square"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <div className="w-full h-full relative">
              <Image
                src={image}
                alt={`${title} - 이미지 ${index + 1}`}
                fill
                sizes="(min-width: 640px) 640px, 100vw"
                className="object-cover"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

function FeedItem({ feed }: FeedItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  // 신규 피드는 imageUrls 사용, 레거시 HTML 콘텐츠는 본문에서 추출
  const hasHtmlContent = /<[^>]+>/.test(feed.content);
  const images =
    feed.imageUrls && feed.imageUrls.length > 0
      ? feed.imageUrls
      : hasHtmlContent
        ? extractImagesFromHtml(DOMPurify.sanitize(feed.content))
        : [];
  const textContent = hasHtmlContent
    ? extractTextFromHtml(DOMPurify.sanitize(feed.content))
    : feed.content;

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setIsTruncated(el.scrollHeight > el.clientHeight);
    }
  }, [textContent]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className="py-[20px]">
      {/* 헤더: 로고 + 제목 + 날짜 */}
      <div className="flex items-center gap-[10px] mb-[12px]">
        {feed.storeLogoImageUrl ? (
          <div className="w-[32px] h-[32px] relative rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={feed.storeLogoImageUrl}
              alt="스토어 로고"
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-[32px] h-[32px] rounded-full bg-gray-200 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate">{feed.title}</h3>
          <p className="text-2sm text-gray-500">{formatDate(feed.createdAt)}</p>
        </div>
      </div>

      {/* 이미지 (여러 장일 경우 좌우 스와이프) */}
      {images.length > 0 && <FeedImageCarousel images={images} title={feed.title} />}

      {/* 텍스트 내용 */}
      {textContent && (
        <div>
          <p
            ref={contentRef}
            className={`text-sm text-gray-700 leading-[145%] whitespace-pre-wrap ${
              !isExpanded ? "line-clamp-4" : ""
            }`}
          >
            {textContent}
          </p>
          {isTruncated && !isExpanded && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="text-sm text-gray-500 mt-1"
            >
              더보기
            </button>
          )}
          {isExpanded && (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-sm text-gray-500 mt-1"
            >
              접기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function StoreDetailFeedSection({ storeId }: StoreDetailFeedSectionProps) {
  const { data: feedData, isLoading } = useStoreFeeds({ storeId });

  if (isLoading) {
    return <></>;
  }

  if (!feedData?.data || feedData.data.length === 0) {
    return <EmptyState message="등록된 피드가 없습니다." fill />;
  }

  return (
    <div>
      {feedData.data.map((feed) => (
        <FeedItem key={feed.id} feed={feed} />
      ))}
    </div>
  );
}
