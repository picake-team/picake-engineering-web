import React from "react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";

/** 휴대폰 번호 변경·회원 탈퇴는 PC 마이페이지 한 화면에 있어 PC 폭에서는 마이페이지로 */
export const MypageSubPage: React.FC = () => <Navigate to={ROUTES.MYPAGE} replace />;
