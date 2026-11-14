"use client";

import { useRouter } from "next/navigation";
import { FadeInImage } from "@/apps/web-user/common/components/motion/FadeInImage";
import { Icon } from "@/apps/web-user/common/components/icons";
import { LikePop } from "@/apps/web-user/common/components/motion/LikePop";
import type { DesignEntryPoint } from "@/apps/web-user/common/types/analytics.type";
import type { Design } from "@/apps/web-user/features/design/types/design.type";
import {
  useDesignLikes,
  useToggleDesignLike,
} from "@/apps/web-user/features/design/hooks/useDesignLikes";
import {
  designCaption,
  designDetailHref,
  designImageSrc,
} from "@/apps/web-user/features/design/utils/design.util";

/** 디자인 모음 격자 카드(상품 카드와 같은 크기·하트 자리) */
export function DesignCard({
  design,
  liked,
  onLike,
  from,
}: {
  design: Design;
  liked: boolean;
  onLike: () => void;
  from: DesignEntryPoint;
}) {
  const router = useRouter();
  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={design.name}
      onClick={() => router.push(designDetailHref(design.id, from))}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(designDetailHref(design.id, from));
      }}
      className="press min-w-0 cursor-pointer bg-white"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-50">
        <FadeInImage
          src={designImageSrc(design.image.thumb)}
          alt={design.name}
          fill
          sizes="(max-width: 640px) 50vw, 300px"
          className="object-cover"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
          aria-label={liked ? "저장 취소" : "저장"}
          aria-pressed={liked}
          className="absolute bottom-3 right-3 h-[28px] w-[28px]"
        >
          <LikePop liked={liked}>
            <Icon
              name={liked ? "favoriteShadowFilled" : "favoriteShadow"}
              width={28}
              height={28}
              className={liked ? "text-primary" : "text-white"}
            />
          </LikePop>
        </button>
      </div>
      <div className="pt-2">
        <p className="text-sm text-gray-900">{design.name}</p>
        <p className="mt-[2px] text-xs text-gray-500">{designCaption(design)}</p>
      </div>
    </div>
  );
}

/** 두 줄 격자 */
export function DesignGrid({ designs, from }: { designs: Design[]; from: DesignEntryPoint }) {
  return <DesignGridInner designs={designs} from={from} />;
}

function DesignGridInner({ designs, from }: { designs: Design[]; from: DesignEntryPoint }) {
  const { data } = useDesignLikes();
  const toggle = useToggleDesignLike();
  const mine = new Set(data?.myLikes ?? []);
  return (
    <div className="grid grid-cols-2 gap-x-[7px] gap-y-6">
      {designs.map((d) => (
        <DesignCard
          key={d.id}
          design={d}
          from={from}
          liked={mine.has(d.id)}
          onLike={() => toggle(d.id, mine.has(d.id))}
        />
      ))}
    </div>
  );
}
