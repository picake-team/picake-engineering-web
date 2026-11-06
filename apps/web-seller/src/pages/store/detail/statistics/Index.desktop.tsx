import React from "react";
import { useParams } from "react-router-dom";
import { StatisticsOverallContent } from "@/apps/web-seller/features/statistics/components/StatisticsOverallContent";

export const StoreDetailStatisticsPage: React.FC = () => {
  const { storeId } = useParams();

  if (!storeId) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">스토어가 선택되지 않았습니다.</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-3xl font-bold">주문 통계</h1>
      </header>
      <StatisticsOverallContent storeId={storeId} />
    </div>
  );
};
