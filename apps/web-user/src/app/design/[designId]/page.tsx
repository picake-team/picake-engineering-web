import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DESIGNS } from "@/apps/web-user/features/design/constants/designs.constant";
import { designImageSrc, getDesign } from "@/apps/web-user/features/design/utils/design.util";
import { buildShareMetadata } from "@/apps/web-user/common/utils/metadata.util";
import { DesignDetailScreen } from "@/apps/web-user/features/design/components/DesignDetailScreen";

interface Props {
  params: Promise<{ designId: string }>;
}

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
  if (!getDesign(designId)) notFound();
  return <DesignDetailScreen designId={designId} />;
}
