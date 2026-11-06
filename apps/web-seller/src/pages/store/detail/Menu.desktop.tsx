import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";

/** 스토어 탭(SC-88)·설정(SC-98)·처음 사용 안내(SC-69)는 휴대폰 화면에만 있다. PC 폭에서는 스토어 홈으로 */
export const StoreDetailMenuPage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  return <Navigate to={ROUTES.STORE_DETAIL_HOME(storeId)} replace />;
};
