/**
 * 아직 휴대폰 디자인으로 다시 그리지 않은 PC 화면을 휴대폰 틀(뒤로 + 제목) 안에 담는다.
 * 기능은 PC와 똑같이 쓰고, 화면 위쪽의 PC 제목(h1)은 위쪽 줄과 겹치므로 숨긴다(PageTitle).
 * 상품 등록·수정, 피드, 스토어 정보·만들기처럼 긴 입력 화면이 여기에 해당한다. PC 부품(버튼·입력·이름표·묶음·체크·창·
 * 고르는 칸·카드·사진 올리기)이 useInMobileFrame()으로 판매자 앱 디자인(6-E·6-F·6-G·A87·A90·A91·8-E·8-F·A66b·A67)대로 그려진다.
 * 틀이 열려 있는 동안 <html>에 `app-form`을 붙여 PC 화면의 색(검정 주 버튼·초록 등)을 앱 디자인 기준 색으로 바꾼다
 * (globals.css, 운영자 의견 2026-11-06). 아래 저장 줄은 useInMobileFrame()으로 앱처럼 가득 찬 버튼으로 그린다.
 */
import React, { useContext, useEffect } from "react";
import { AppScreen, BackHeader } from "@/apps/web-seller/common/ui/Screen";
import { cx } from "@/apps/web-seller/common/ui/cx";

import { InMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";

/** PC 화면 제목. 휴대폰 틀 안에서는 위쪽 줄이 제목을 보여 주므로 그리지 않는다 */
export function PageTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  if (useContext(InMobileFrame)) return null;
  return <h1 className={className}>{children}</h1>;
}

export function MobileFrame({
  title,
  actions,
  onBack,
  noBack,
  children,
}: {
  title: string;
  /** 위쪽 줄 오른쪽(예: 피드 목록의 + 아이콘 "피드 등록") */
  actions?: React.ReactNode;
  /** 왼쪽 위 뒤로(없으면 브라우저 뒤로) */
  onBack?: () => void;
  /** 뒤로를 그리지 않는다(돌아갈 곳이 없는 화면) */
  noBack?: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("app-form");
    return () => root.classList.remove("app-form");
  }, []);
  return (
    <InMobileFrame.Provider value>
      <AppScreen
        header={<BackHeader title={title} actions={actions} onBack={onBack} noBack={noBack} />}
        bodyClassName={cx("pt-2")}
      >
        {children}
      </AppScreen>
    </InMobileFrame.Provider>
  );
}
