/**
 * 처음 사용 안내 (SC-69, 디자인 8-G · A69b, 앱에서만). 알림이 왜 필요한지 알리고 휴대폰 알림 허용을 한 번 묻는다.
 * 허용하면 "테스트 알림 보내기"로 확인, 허용하지 않으면 홈에 "알림 켜기" 안내가 남는다.
 */
import React from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { APP_COLUMN_CLASS } from "@/apps/web-seller/common/ui/Screen";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import { usePushPermissionStore } from "@/apps/web-seller/common/store/push-permission.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import {
  isSellerAppWebView,
  requestPushPermission,
} from "@/apps/web-seller/common/utils/webview.bridge";
import { sellerPushApi } from "@/apps/web-seller/features/notification/apis/notification.api";
import { markWelcomeSeen } from "@/apps/web-seller/features/notification/utils/welcome.util";

const REASONS = [
  "새 예약신청이 들어왔을 때",
  "손님이 입금 완료를 눌렀을 때",
  "취소·환불 요청이 왔을 때",
  "매일 아침 8시, 오늘 픽업 요약",
];

export const StoreWelcomeMobilePage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const status = usePushPermissionStore((s) => s.status);
  const addAlert = useAlertStore((s) => s.addAlert);
  const granted = status === "granted";
  // 허용하면 이 휴대폰을 알림 받을 곳으로 다시 등록하는 것은 SellerAppBridgeProvider가 한다(어디서 허용해도 같게)

  const testPush = useMutation({
    mutationFn: sellerPushApi.sendTestPush,
    onSuccess: (count) =>
      addAlert({
        severity: count > 0 ? "success" : "warning",
        message:
          count > 0
            ? "알림을 보냈어요. 휴대폰에 왔는지 확인해 주세요."
            : "알림을 받을 휴대폰이 없어요. 앱에서 로그인해 주세요.",
      }),
    onError: (e) => addAlert({ severity: "error", message: getApiMessage.error(e) }),
  });

  if (!isSellerAppWebView()) return <Navigate to={ROUTES.STORE_DETAIL_HOME(storeId)} replace />;

  const goHome = () => {
    markWelcomeSeen();
    navigate(ROUTES.STORE_DETAIL_HOME(storeId), { replace: true });
  };

  return (
    <div
      className={cx(
        APP_COLUMN_CLASS,
        "flex min-h-dvh flex-col gap-3 bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+40px)] font-app text-ink-900",
      )}
    >
      <div className="flex flex-col gap-3">
        <span className="flex size-14 items-center justify-center rounded-card bg-ink-50 text-brand">
          <Icon name="bell" size={28} strokeWidth={1.8} />
        </span>
        <h1 className="text-title font-bold">
          새 예약을 놓치지 않게
          <br />
          휴대폰으로 알려 드려요
        </h1>
      </div>
      <ul className="mt-2 flex flex-col gap-3">
        {REASONS.map((r) => (
          <li key={r} className="flex items-center gap-3 text-body">
            <span className="text-brand">
              <Icon name="check" size={20} strokeWidth={2.4} />
            </span>
            {r}
          </li>
        ))}
      </ul>
      <div className="flex-1" />
      {granted ? (
        <>
          <div className="flex flex-col gap-1 rounded-card bg-ink-50 px-4 py-3">
            <p className="text-body font-semibold">알림을 허용했어요</p>
            <p className="text-caption text-ink-600">알림이 잘 오는지 확인해 보세요</p>
          </div>
          <Button
            variant="secondary"
            block
            loading={testPush.isPending}
            loadingLabel="보내는 중"
            onClick={() => testPush.mutate()}
          >
            테스트 알림 보내기
          </Button>
          <Button block onClick={goHome}>
            시작하기
          </Button>
        </>
      ) : (
        <>
          <Button block onClick={() => requestPushPermission()}>
            알림 받기
          </Button>
          <Button variant="quiet" className="self-center" onClick={goHome}>
            나중에 할게요
          </Button>
        </>
      )}
    </div>
  );
};
