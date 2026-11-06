import React from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/apps/web-seller/common/components/cards/Card";
import { useSellerNotificationsRequired } from "@/apps/web-seller/features/notification/components/providers/SellerNotificationProvider";
import type { SellerNotificationSettings } from "@/apps/web-seller/features/notification/types/notification.dto";
import { cn } from "@/apps/web-seller/common/utils/classname.util";

/** 스토어별 주문 알림·알림음 설정 (백엔드 preferences API와 동기화). */
export const StoreDetailNotificationsSettingsPage: React.FC = () => {
  const { storeId } = useParams();
  const { settings, setSettings } = useSellerNotificationsRequired();

  if (!storeId) {
    return (
      <div>
        <h2 className="text-xl font-semibold">스토어가 선택되지 않았습니다.</h2>
      </div>
    );
  }

  const patch = (partial: Partial<SellerNotificationSettings>) => {
    setSettings({ ...settings, ...partial });
  };

  const orderOn = settings.orderNotificationsEnabled;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">알림 설정</h1>

      <Card className="shadow-sm">
        <CardContent className="space-y-6 pt-6">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-input p-4 shadow-sm hover:bg-accent/40">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-input"
              checked={settings.orderNotificationsEnabled}
              onChange={(e) => patch({ orderNotificationsEnabled: e.target.checked })}
            />
            <span>
              <span className="font-medium">주문 알림 받기</span>
              <p className="mt-1 text-sm text-muted-foreground">
                예약 신청, 입금·확정, 픽업, 취소·환불 등 주문과 관련된 알림을 저장·전달합니다.
              </p>
            </span>
          </label>

          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-md border border-input p-4 shadow-sm",
              !orderOn ? "opacity-50" : "hover:bg-accent/40",
            )}
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-input"
              disabled={!orderOn}
              checked={settings.orderNotificationSoundEnabled}
              onChange={(e) => patch({ orderNotificationSoundEnabled: e.target.checked })}
            />
            <span>
              <span className="font-medium">주문 알림 소리</span>
              <p className="mt-1 text-sm text-muted-foreground">
                주문 관련 알림이 실시간으로 도착할 때 알림 멜로디를 재생합니다. 브라우저 정책상 첫
                클릭 전에는 재생이 막힐 수 있습니다.
              </p>
            </span>
          </label>
        </CardContent>
      </Card>
    </div>
  );
};
