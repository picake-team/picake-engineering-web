import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";

/** 처음 사용 안내(SC-69)는 앱에서만(알림 켜기). PC 폭에서는 스토어 홈으로 */
export const StoreWelcomeDesktopPage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  return <Navigate to={ROUTES.STORE_DETAIL_HOME(storeId)} replace />;
};
