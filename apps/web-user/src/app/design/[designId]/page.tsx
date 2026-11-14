import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DESIGNS } from "@/apps/web-user/features/design/constants/designs.constant";
import {
  designImageSrc,
  getDesign,
  similarDesigns,
} from "@/apps/web-user/features/design/utils/design.util";
import { buildShareMetadata } from "@/apps/web-user/common/utils/metadata.util";
import { DesignDetailScreen } from "@/apps/web-user/features/design/components/DesignDetailScreen";

interface Props {
  params: Promise<{ designId: string }>;
}

/** 계절 디자인이 기간에 맞게 보이도록 하루에 한 번 다시 그린다 */
export const revalidate = 86400;

export function generateStaticParams() {
  return DESIGNS.map((d) => ({ designId: d.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const design = getDesign((await params).designId);
  if (!design) return {};
  return buildShareMetadata({
    title: `${design.name} · 케이크 디자인`,
    description: design.description,
    path: `/design/${design.id}`,
    imageUrl: designImageSrc(design.image.file),
  });
}

/** 케이크 디자인 상세(기획 I-112 ③) */
export default async function DesignDetailPage({ params }: Props) {
  const { designId } = await params;
  const design = getDesign(designId);
  if (!design) notFound();
  // 비슷한 디자인(계절 디자인은 기간에만)은 서버가 정해 넘긴다. 휴대폰에서 다시 계산하면
  // 미리 그린 페이지와 날짜가 달라 화면이 어긋날 수 있다(크리스마스가 지난 뒤)
  return (
    <DesignDetailScreen designId={designId} similarIds={similarDesigns(design).map((d) => d.id)} />
  );
}
