"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FadeInImage } from "@/apps/web-user/common/components/motion/FadeInImage";
import { Icon } from "@/apps/web-user/common/components/icons";
import { LikePop } from "@/apps/web-user/common/components/motion/LikePop";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import type { DesignEntryPoint } from "@/apps/web-user/common/types/analytics.type";
import {
  useDesignLikes,
  useToggleDesignLike,
} from "@/apps/web-user/features/design/hooks/useDesignLikes";
import {
  OCCASION_LABEL,
  designDetailHref,
  designImageSrc,
  designQuoteHref,
  getDesign,
  similarDesigns,
} from "@/apps/web-user/features/design/utils/design.util";

const FROM: DesignEntryPoint[] = ["home", "search", "saved", "similar", "direct"];

export function DesignDetailScreen({ designId }: { designId: string }) {
  return (
    <Suspense fallback={null}>
      <DesignDetailContent designId={designId} />
    </Suspense>
  );
}

function DesignDetailContent({ designId }: { designId: string }) {
  const design = getDesign(designId);
  const router = useRouter();
  const params = useSearchParams();
  const fromParam = params.get("from") as DesignEntryPoint | null;
  const from: DesignEntryPoint = fromParam && FROM.includes(fromParam) ? fromParam : "direct";
  const { data } = useDesignLikes();
  const toggle = useToggleDesignLike();
  const liked = data?.myLikes.includes(designId) ?? false;
  const count = data?.counts[designId] ?? 0;

  const tracked = useRef<string | null>(null);
  useEffect(() => {
    if (tracked.current === designId) return;
    tracked.current = designId;
    trackEvent("view_design_detail", { design_id: designId, entry_point: from });
  }, [designId, from]);

  if (!design) return null;
  const similar = similarDesigns(design);
  const tags = [
    ...design.occasions.map((o) => OCCASION_LABEL[o]).filter((t): t is string => !!t),
    design.seasonal === "CHRISTMAS" ? "크리스마스" : null,
    design.style,
  ].filter((t, i, a): t is string => !!t && a.indexOf(t) === i);

  return (
    <div className="bg-white pb-[100px]">
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
        <FadeInImage
          src={designImageSrc(design.image.file)}
          alt={design.name}
          fill
          priority
          sizes="(max-width: 640px) 100vw, 640px"
          className="object-cover"
        />
        <span className="absolute right-[12px] top-[12px] rounded-full bg-white/90 px-[10px] py-[4px] text-xs font-semibold text-gray-900">
          참고 사진
        </span>
      </div>
      <p className="px-[20px] pt-[8px] text-xs text-gray-400">
        무료 사진 · {design.credit.author} / {design.credit.site}
      </p>

      <div className="px-[20px] pt-[14px]">
        <h1 className="text-xl font-bold text-gray-900">{design.name}</h1>
        <div className="mt-[8px] flex flex-wrap gap-[6px]">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-gray-50 px-[10px] py-[4px] text-xs text-gray-700"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <section className="px-[20px] pt-[26px]">
        <h2 className="mb-[10px] text-base font-bold text-gray-900">사진에서 읽은 것</h2>
        <div className="border-t border-gray-50">
          {design.read.map((r) => (
            <div key={r.label} className="flex border-b border-gray-50 py-[10px] text-sm">
              <span className="w-[84px] shrink-0 text-gray-500">{r.label}</span>
              <span className={r.value ? "text-gray-900" : "text-gray-400"}>
                {r.value ?? "사진으로는 알 수 없어요"}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-[10px] text-2sm text-gray-500">
          <span className="text-primary">✦</span> 사진에서 읽었어요 · 가게마다 조금 달라요
        </p>
      </section>

      {design.tip && (
        <p className="mx-[20px] mt-[16px] rounded-xl bg-gray-50 px-[14px] py-[12px] text-2sm leading-[20px] text-gray-700">
          {design.tip}
        </p>
      )}

      {similar.length > 0 && (
        <section className="pt-[26px]">
          <h2 className="mb-[10px] px-[20px] text-base font-bold text-gray-900">비슷한 디자인</h2>
          <div className="scrollbar-hide flex gap-[10px] overflow-x-auto px-[20px]">
            {similar.map((d) => (
              <Link
                key={d.id}
                href={designDetailHref(d.id, "similar")}
                className="press w-[132px] shrink-0"
              >
                <div className="relative h-[132px] w-[132px] overflow-hidden rounded-xl bg-gray-50">
                  <FadeInImage
                    src={designImageSrc(d.image.thumb)}
                    alt={d.name}
                    fill
                    sizes="132px"
                    className="object-cover"
                  />
                </div>
                <p className="mt-[6px] text-2sm text-gray-900">{d.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-[638px] flex-col border-gray-200 bg-white shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.16)]">
        <div className="flex items-center gap-[16px] px-[20px] py-[10px]">
          <button
            type="button"
            onClick={() => toggle(design.id, liked)}
            aria-label={liked ? "저장 취소" : "저장"}
            aria-pressed={liked}
            className="flex h-[40px] w-[40px] flex-col items-center justify-center"
          >
            <LikePop liked={liked}>
              <Icon
                name={liked ? "favoriteFilled" : "favorite"}
                width={24}
                height={24}
                className={liked ? "text-primary" : "text-gray-500"}
              />
            </LikePop>
            {count > 0 && <span className="text-xs font-bold text-gray-900">{count}</span>}
          </button>
          <span className="flex-1">
            <Button
              onClick={() => {
                trackEvent("request_design_quote", { design_id: design.id, entry_point: from });
                router.push(designQuoteHref([design.id]));
              }}
            >
              이 디자인으로 견적 받기
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}
