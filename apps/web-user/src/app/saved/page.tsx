"use client";

import { MainPageHeader } from "@/apps/web-user/common/components/headers/MainPageHeader";
import { BottomNav } from "@/apps/web-user/common/components/navigation/BottomNav";
import { Tabs, Tab } from "@/apps/web-user/common/components/tabs/Tabs";
import { useLikedStores } from "@/apps/web-user/features/like/hooks/queries/useLikedStores";
import { useLikedProducts } from "@/apps/web-user/features/like/hooks/queries/useLikedProducts";
import { LikedStoreListSection } from "@/apps/web-user/features/like/components/sections/LikedStoreListSection";
import {
  LikedDesignSection,
  useLikedDesignCount,
} from "@/apps/web-user/features/design/components/DesignListSections";
import { LikedProductListSection } from "@/apps/web-user/features/like/components/sections/LikedProductListSection";
import { useAuthStore, useAuthHasHydrated } from "@/apps/web-user/common/store/auth.store";
import { useLoginSheetStore } from "@/apps/web-user/common/store/login-sheet.store";
import { useScrollRestoration } from "@/apps/web-user/common/hooks/useScrollRestoration";

export default function SavedPage() {
  // 뒤로 오면 보던 자리 그대로(새로 들어오면 맨 위부터)
  useScrollRestoration();
  const hasHydrated = useAuthHasHydrated();
  const { isAuthenticated } = useAuthStore();
  const openLoginSheet = useLoginSheetStore((s) => s.openLoginSheet);

  return (
    <div className="pb-[60px]">
      <MainPageHeader title="저장" />

      {!hasHydrated ? null : isAuthenticated ? (
        <AuthedSavedContent />
      ) : (
        <UnauthenticatedSavedContent onLoginClick={() => openLoginSheet("save_menu")} />
      )}

      <BottomNav />
    </div>
  );
}

function AuthedSavedContent() {
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

  return <Tabs tabs={tabs} defaultTab="product" />;
}

function UnauthenticatedSavedContent({ onLoginClick }: { onLoginClick: () => void }) {
  const loginPrompt = (
    <div className="flex flex-col items-center justify-center gap-3 px-5 min-h-[calc(100vh-204px)]">
      <p className="text-sm text-gray-700">더욱 편리한 이용을 위해</p>
      <button
        type="button"
        onClick={onLoginClick}
        className="py-[10px] px-5 text-sm font-bold text-white bg-primary rounded-lg"
      >
        로그인 / 회원가입
      </button>
    </div>
  );

  const tabs: Tab[] = [
    { id: "product", label: "상품", content: loginPrompt },
    { id: "store", label: "스토어", content: loginPrompt },
    { id: "design", label: "디자인", content: loginPrompt },
  ];

  return <Tabs tabs={tabs} defaultTab="product" />;
}
