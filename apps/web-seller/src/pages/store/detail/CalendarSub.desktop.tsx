import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";

/**
 * 날짜 상세(SC-80)·영업시간(SC-81)은 휴대폰 화면 주소다. PC는 캘린더 한 화면(날짜 상세·기본 운영 관리)에 있어
 * PC 폭에서는 캘린더로 보낸다.
 */
export const StoreDetailCalendarSubPage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  return <Navigate to={ROUTES.STORE_DETAIL_CALENDAR(storeId)} replace />;
};
