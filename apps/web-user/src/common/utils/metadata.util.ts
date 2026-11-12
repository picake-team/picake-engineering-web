import type { Metadata } from "next";
import {
  SITE_BASE_URL,
  SITE_OG_IMAGE,
  SITE_NAME,
} from "@/apps/web-user/common/constants/site.constants";

const DEFAULT_DESCRIPTION =
  "Picake에서 내 주변 케이크 전문 매장을 찾고 예약하세요. 생일케이크, 레터링케이크, 커스텀케이크 등 다양한 케이크를 간편하게 주문할 수 있어요.";

export function toAbsoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function toMetaDescription(
  text: string | undefined,
  fallback: string,
  maxLength = 160,
): string {
  if (!text) return fallback;

  const plain = text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) return fallback;
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength - 1)}…`;
}

export function formatKrwPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

interface BuildShareMetadataInput {
  title: string;
  description: string;
  path: string;
  imageUrl?: string | null;
}

/** 카카오·SNS 공유·검색 스니펫용 metadata 빌더 */
export function buildShareMetadata({
  title,
  description,
  path,
  imageUrl,
}: BuildShareMetadataInput): Metadata {
  const url = toAbsoluteUrl(path);
  // 사진이 없으면 Picake PNG(메신저들이 SVG 로고를 보여 주지 않음)
  const ogImage = imageUrl ? toAbsoluteUrl(imageUrl) : SITE_OG_IMAGE.url;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url,
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [
        {
          url: ogImage,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
  };
}

export function buildNotFoundMetadata(title: string): Metadata {
  return {
    title,
    description: DEFAULT_DESCRIPTION,
    // 없는(지워진) 상품·가게 주소는 화면이 200으로 "찾을 수 없어요"를 보여 줘서, 검색에 빈 페이지로 남지 않게 막는다
    robots: { index: false, follow: false },
  };
}
