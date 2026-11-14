"use client";

import Header from "@/apps/web-user/common/components/headers/Header";
import { Tabs, Tab } from "@/apps/web-user/common/components/tabs/Tabs";
import { useLikedStores } from "@/apps/web-user/features/like/hooks/queries/useLikedStores";
import { useLikedProducts } from "@/apps/web-user/features/like/hooks/queries/useLikedProducts";
import { LikedStoreListSection } from "@/apps/web-user/features/like/components/sections/LikedStoreListSection";
import {
  LikedDesignSection,
  useLikedDesignCount,
} from "@/apps/web-user/features/design/components/DesignListSections";
import { LikedProductListSection } from "@/apps/web-user/features/like/components/sections/LikedProductListSection";

export default function SavedPage() {
  const { data: storeData } = useLikedStores();
  const { data: productData } = useLikedProducts();

  const storeCount = storeData?.pages[0]?.meta.totalItems ?? 0;
  const productCount = productData?.pages[0]?.meta.totalItems ?? 0;
  const designCount = useLikedDesignCount();

  const tabs: Tab[] = [
    {
      id: "product",
      label: `상품 ${productCount}`,
      content: <LikedProductListSection />,
    },
    {
      id: "store",
      label: `스토어 ${storeCount}`,
      content: <LikedStoreListSection />,
    },
    {
      id: "design",
      label: `디자인 ${designCount}`,
      content: <LikedDesignSection />,
    },
  ];

  return (
    <div>
      <Header variant="back-title" title="저장" />
      <Tabs tabs={tabs} defaultTab="product" />
    </div>
  );
}
