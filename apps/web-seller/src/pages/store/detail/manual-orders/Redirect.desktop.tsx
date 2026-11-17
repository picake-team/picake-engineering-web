/**
 * 직접 적은 주문(기획 I-42) 적기·상세·고치기는 휴대폰 화면만 있다. PC 폭에서는 캘린더(그날 목록에 보이기만)로.
 */
import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";

export const StoreDetailManualOrderDesktopRedirect: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  return <Navigate to={ROUTES.STORE_DETAIL_CALENDAR(storeId)} replace />;
};
