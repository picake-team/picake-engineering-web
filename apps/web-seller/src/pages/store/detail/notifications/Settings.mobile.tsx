/**
 * 휴대폰 알림 설정 (SC-93, 디자인 A93). 스토어마다: 주문 알림 받기(끌 때 한 번 묻기), 아침 요약.
 * "주문 알림 소리"(앱을 켜 둔 동안의 화면 안 소리)는 PC 화면에만 둔다. 휴대폰은 휴대폰 알림 소리에 맡긴다(운영자 17차).
 * 아래 묶음 "테스트 알림 보내기"로 내 휴대폰에 오는지 확인하고(심사관도 이 버튼으로 확인), 안 오면 "알림이 안 와요"를 편다.
 * 맨 위 "이 휴대폰 알림" 칸은 앱에서만 보인다(허용 상태, 꺼져 있으면 "켜기": 허용 창 또는 휴대폰 설정).
 */
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AppScreen, BackHeader } from "@/apps/web-seller/common/ui/Screen";
import { Button, ButtonPair } from "@/apps/web-seller/common/ui/Button";
import { GrayBand, ListRow } from "@/apps/web-seller/common/ui/List";
import { Switch } from "@/apps/web-seller/common/ui/Toggle";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import { useNotificationPreferences } from "@/apps/web-seller/features/notification/hooks/queries/useNotificationQuery";
import { useUpdateNotificationPreferences } from "@/apps/web-seller/features/notification/hooks/mutations/useNotificationMutation";
import { sellerPushApi } from "@/apps/web-seller/features/notification/apis/notification.api";
import { DEFAULT_SELLER_NOTIFICATION_SETTINGS } from "@/apps/web-seller/features/notification/types/notification.dto";
import { DevicePushStatusCard } from "@/apps/web-seller/features/notification/components/mobile/PushOffBanner";

const TIPS = [
  "휴대폰 설정 > 알림에서 '픽케이크 사장님' 알림이 켜져 있는지",
  "방해 금지 모드·집중 모드가 켜져 있지 않은지",
  "배터리 절약 모드가 앱을 멈추게 하지 않는지(안드로이드는 배터리 사용 '제한 없음')",
  "이 화면 위 '주문 알림 받기'가 켜져 있는지",
  "앱에서 로그아웃하면 그 휴대폰에는 알림이 가지 않아요",
];

export const StoreDetailNotificationSettingsMobilePage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const { data: store } = useStoreDetail(storeId);
  const prefsQuery = useNotificationPreferences(storeId);
  const update = useUpdateNotificationPreferences(storeId);
  const addAlert = useAlertStore((s) => s.addAlert);
  const [confirmOff, setConfirmOff] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  const prefs = prefsQuery.data ?? DEFAULT_SELLER_NOTIFICATION_SETTINGS;
  const loaded = Boolean(prefsQuery.data);

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

  return (
    <AppScreen header={<BackHeader title="알림 설정" />} bodyClassName="pt-2">
      <DevicePushStatusCard />
      <h2 className="text-group font-bold text-ink-900">{store?.name ?? "스토어"} 알림</h2>
      <div className="-mt-2">
        <ListRow
          title="주문 알림 받기"
          description="예약 신청, 입금·확정, 픽업, 취소·환불 알림"
          divider={typeof prefs.morningSummaryEnabled === "boolean"}
          trailing={
            <Switch
              label="주문 알림 받기"
              disabled={!loaded}
              checked={prefs.orderNotificationsEnabled}
              onChange={(next) => {
                if (!next) setConfirmOff(true);
                else update.mutate({ orderNotificationsEnabled: true });
              }}
            />
          }
        />
        {typeof prefs.morningSummaryEnabled === "boolean" ? (
          <ListRow
            title="아침 요약 알림"
            description="매일 아침 8시, 오늘 픽업이 있을 때만"
            divider={false}
            trailing={
              <Switch
                label="아침 요약 알림"
                disabled={!loaded}
                checked={prefs.morningSummaryEnabled}
                onChange={(next) => update.mutate({ morningSummaryEnabled: next })}
              />
            }
          />
        ) : null}
      </div>

      {/* 테스트 알림은 이 스토어가 아니라 내 휴대폰 모두에 가서, 스토어 묶음과 띠로 나누고 "알림이 안 와요"와 한 묶음 */}
      <GrayBand />
      <ListRow
        className="-mt-1"
        title="테스트 알림 보내기"
        description="내 휴대폰에 알림이 오는지 확인해요"
        trailing={
          <Button
            variant="secondary"
            size="md"
            className="shrink-0"
            loading={testPush.isPending}
            loadingLabel="보내는 중"
            onClick={() => testPush.mutate()}
          >
            보내기
          </Button>
        }
      />

      <button
        type="button"
        aria-expanded={tipsOpen}
        onClick={() => setTipsOpen((v) => !v)}
        className="-mt-3 flex min-h-13 items-center gap-3 py-2 text-left active:bg-ink-50"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-body font-semibold text-ink-900">알림이 안 와요</span>
          <span className="text-caption text-ink-600">
            휴대폰 설정, 방해 금지 모드, 배터리 절약
          </span>
        </span>
        <span
          className={cx("shrink-0 text-ink-400 transition-transform", tipsOpen && "rotate-180")}
        >
          <Icon name="chevronDown" size={18} strokeWidth={2} />
        </span>
      </button>
      {tipsOpen ? (
        <ul className="list-disc pl-5 text-sub leading-normal text-ink-700">
          {TIPS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      ) : null}

      <BottomSheet
        open={confirmOff}
        onClose={() => setConfirmOff(false)}
        title="끄면 새 예약을 알 수 없어요. 끌까요?"
        description="새 주문 알림이 알림 목록에도 저장되지 않고 화면 안 알림·휴대폰 알림도 가지 않아요."
        footer={
          <ButtonPair>
            <Button variant="secondary" onClick={() => setConfirmOff(false)}>
              돌아가기
            </Button>
            <Button
              onClick={() => {
                update.mutate({ orderNotificationsEnabled: false });
                setConfirmOff(false);
              }}
            >
              끄기
            </Button>
          </ButtonPair>
        }
      />
    </AppScreen>
  );
};
