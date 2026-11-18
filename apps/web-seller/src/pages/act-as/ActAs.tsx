/**
 * 운영자 대신 입력(기획 I-41) 들어오기·끝난 화면.
 * 관리자 화면이 새 탭으로 연 `/act-as?code=…`의 한 번만 쓰는 코드를 대리 출입증으로 바꿔 이 탭에만 두고 스토어 홈으로 간다.
 * 코드는 주소창에서 바로 지운다. 끝내기·60분·관리자가 끝내면 `/act-as/ended`.
 */
import React, { useEffect, useRef, useState } from "react";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { EmptyState } from "@/apps/web-seller/common/ui/Surface";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import {
  ACT_AS_PATH,
  clearActAsSession,
  setActAsSession,
} from "@/apps/web-seller/common/utils/act-as.util";
import { actAsApi } from "@/apps/web-seller/features/act-as/apis/act-as.api";

function CenterScreen({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh flex-col bg-white px-5 font-app">{children}</div>;
}

export const ActAsEntryPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // 코드는 # 뒤에 온다(서버·호스팅 접근 기록에 남지 않게). 예전 주소 모양(?code=)도 받는다
    const code =
      new URLSearchParams(window.location.hash.replace(/^#/, "")).get("code") ??
      new URLSearchParams(window.location.search).get("code") ??
      "";
    // 코드가 주소창·방문 기록에 남지 않게 바로 지운다
    window.history.replaceState(null, "", ACT_AS_PATH);
    clearActAsSession();
    if (!code) {
      setError("관리자 화면에서 다시 들어가 주세요.");
      return;
    }
    actAsApi
      .exchange(code)
      .then(({ accessToken, storeId, expiresAt }) => {
        if (!setActAsSession(accessToken, { storeId, expiresAt })) {
          // 이 탭에 출입증을 둘 수 없으면(사이트 데이터 막힘 등) 들어가지 않고 세션을 바로 끝낸다
          void actAsApi.endWithToken(accessToken).catch(() => undefined);
          setError(
            "이 브라우저에서는 대신 입력을 열 수 없어요. 사이트 데이터 저장을 켜고 다시 들어가 주세요.",
          );
          return;
        }
        // 새로 불러와 처음부터 대리 출입증으로 그린다(로그인 확인·스토어 목록)
        window.location.replace(ROUTES.STORE_DETAIL_HOME(storeId));
      })
      .catch((e) => setError(getApiMessage.error(e)));
  }, []);

  if (error) {
    return (
      <CenterScreen>
        <EmptyState big icon="warning" title={error} />
      </CenterScreen>
    );
  }
  return (
    <CenterScreen>
      <div className="flex flex-1 items-center justify-center">
        <span className="inline-block size-7 animate-spin rounded-full border-[3px] border-ink-100 border-t-brand" />
      </div>
    </CenterScreen>
  );
};

export const ActAsEndedPage: React.FC = () => {
  useEffect(() => {
    clearActAsSession();
  }, []);
  return (
    <CenterScreen>
      <EmptyState big icon="check" title="운영자 대신 입력이 끝났어요" />
    </CenterScreen>
  );
};
