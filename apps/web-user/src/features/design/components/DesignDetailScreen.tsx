"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FadeInImage } from "@/apps/web-user/common/components/motion/FadeInImage";
import { Icon } from "@/apps/web-user/common/components/icons";
import { LikePop } from "@/apps/web-user/common/components/motion/LikePop";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import type { DesignEntryPoint } from "@/apps/web-user/common/types/analytics.type";
import {
  useDesignLikes,
  useToggleDesignLike,
} from "@/apps/web-user/features/design/hooks/useDesignLikes";
import { designRows } from "@/apps/web-user/features/design/utils/design-fill.util";
import {
  designDetailHref,
  designHashtags,
  designImageSrc,
  designQuoteHref,
  getDesign,
  similarDesigns,
} from "@/apps/web-user/features/design/utils/design.util";

const FROM: DesignEntryPoint[] = ["home", "search", "saved", "similar", "direct"];

/** 들어온 곳(?from=)을 읽어 화면 보기 이벤트만 보낸다(이 부분만 Suspense라 나머지는 서버에서 그린다) */
function DesignViewTracker({
  designId,
  onFrom,
}: {
  designId: string;
  onFrom: (f: DesignEntryPoint) => void;
}) {
  const params = useSearchParams();
  const fromParam = params.get("from") as DesignEntryPoint | null;
  const from: DesignEntryPoint = fromParam && FROM.includes(fromParam) ? fromParam : "direct";
  const tracked = useRef<string | null>(null);
  useEffect(() => {
    onFrom(from);
    if (tracked.current === designId) return;
    tracked.current = designId;
    trackEvent("view_design_detail", { design_id: designId, entry_point: from });
  }, [designId, from, onFrom]);
  return null;
}

/** 케이크 디자인 상세(기획 I-112 ③) */
export function DesignDetailScreen({ designId }: { designId: string }) {
  const design = getDesign(designId);
  const router = useRouter();
  const [from, setFrom] = useState<DesignEntryPoint>("direct");
  const [creditOpen, setCreditOpen] = useState(false);
  const { data } = useDesignLikes();
  const toggle = useToggleDesignLike();
  const liked = data?.myLikes.includes(designId) ?? false;
  const count = data?.counts[designId] ?? 0;

  if (!design) return null;
  const similar = similarDesigns(design);
  const rows = designRows(design.parts);

  return (
    <div className="bg-white pb-[100px]">
      <Suspense fallback={null}>
        <DesignViewTracker designId={designId} onFrom={setFrom} />
      </Suspense>
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
        <FadeInImage
          src={designImageSrc(design.image.file)}
          alt={design.name}
          fill
          priority
          sizes="(max-width: 640px) 100vw, 640px"
          className="object-cover"
        />
        {/* 출처는 "참고 사진"을 누르면(운영자 11-14 고름) */}
        <button
          type="button"
          onClick={() => setCreditOpen(true)}
          aria-label="참고 사진 안내와 사진 출처"
          className="absolute right-[12px] top-[12px] flex items-center gap-[3px] rounded-full bg-white/90 px-[10px] py-[4px] text-xs font-semibold text-gray-900"
        >
          참고 사진
          <span aria-hidden className="text-gray-700">
            ⓘ
          </span>
        </button>
      </div>

      <div className="px-[20px] pt-[16px]">
        <h1 className="text-xl font-bold text-gray-900">{design.name}</h1>
        <div className="mt-[6px] flex flex-wrap gap-x-[10px]">
          {designHashtags(design).map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className="py-[2px] text-sm font-semibold text-primary"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <section className="px-[20px] pt-[18px]">
        <div className="border-t border-gray-50">
          {rows.map((r) => (
            <div key={r.label} className="flex border-b border-gray-50 py-[10px] text-sm">
              <span className="w-[56px] shrink-0 text-gray-500">{r.label}</span>
              <span className="text-gray-900">{r.value}</span>
            </div>
          ))}
        </div>
        <p className="mt-[10px] text-2sm text-gray-500">
          <span aria-hidden className="text-primary">
            ✦
          </span>{" "}
          사진에서 읽었어요 · 가게마다 조금 달라요
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

      <BottomSheet isOpen={creditOpen} onClose={() => setCreditOpen(false)} title="참고 사진이에요">
        <div className="px-[20px] pb-[28px]">
          <p className="text-sm leading-[22px] text-gray-700">
            Picake가 고른 무료 사진이에요. 손으로 만드는 케이크라 가게마다 조금 달라요.
          </p>
          <p className="mt-[14px] text-2sm text-gray-500">
            사진 {design.credit.author} · {design.credit.site}
          </p>
        </div>
      </BottomSheet>
    </div>
  );
}
