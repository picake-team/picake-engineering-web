import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";

/** 스토어 탭(휴대폰 화면 SC-88)은 PC 화면에 없다. PC 폭에서는 스토어 홈으로 */
export const StoreDetailMenuPage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  return <Navigate to={ROUTES.STORE_DETAIL_HOME(storeId)} replace />;
};
