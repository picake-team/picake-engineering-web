import { useEffect } from "react";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { useShowMobileScreens } from "@/apps/web-seller/common/hooks/useShowMobileScreens";

/**
 * React Query 조회 실패 시 공통 에러 알림(PC).
 * 휴대폰 화면은 화면 안에 "불러오지 못했어요 · 다시 시도"(LoadErrorState)를 두므로 위 알림 띠를 겹쳐 띄우지 않는다(2026-11-10).
 */
export function useQueryErrorAlert(query: { isError: boolean; error: unknown }) {
  const { addAlert } = useAlertStore();
  const mobile = useShowMobileScreens();

  useEffect(() => {
    if (query.isError && !mobile) {
      addAlert({
        severity: "error",
        message: getApiMessage.error(query.error),
      });
    }
  }, [query.isError, query.error, addAlert, mobile]);
}
