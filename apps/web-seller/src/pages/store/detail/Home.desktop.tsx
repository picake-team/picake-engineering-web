import React from "react";
import { useParams } from "react-router-dom";
import { StoreHomeContent } from "@/apps/web-seller/features/home/components/StoreHomeContent";
import { HOME_SCREEN_HEADING } from "@/apps/web-seller/features/home/constants/store-home-typography.constant";

export const StoreDetailHomePage: React.FC = () => {
  const { storeId } = useParams();

  if (!storeId) {
    return (
      <div>
        <h2 className="text-xl font-semibold">스토어가 선택되지 않았습니다.</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className={HOME_SCREEN_HEADING}>스토어 홈</h1>
      </header>
      <StoreHomeContent storeId={storeId} />
    </div>
  );
};
