/**
 * 회원 탈퇴 (SC-95, 디자인 A95). 진행 중인 주문(예약신청~픽업대기, 취소환불대기)이 있으면 미리 알리고 "주문 보기"(P-34).
 * 사유(필수)와 동의가 있어야 누를 수 있고, 창으로 한 번 묻는다(지금 PC 문구).
 */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { AppScreen, BackHeader, BottomActionBar } from "@/apps/web-seller/common/ui/Screen";
import { Button, ButtonPair } from "@/apps/web-seller/common/ui/Button";
import { Field, TextArea } from "@/apps/web-seller/common/ui/Field";
import { Checkbox } from "@/apps/web-seller/common/ui/Toggle";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { WarningBox } from "@/apps/web-seller/common/ui/Surface";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { readLastStoreId } from "@/apps/web-seller/common/utils/last-store.util";
import { useAuthStore } from "@/apps/web-seller/features/auth/store/auth.store";
import { useMypageWithdraw } from "@/apps/web-seller/features/mypage/hooks/mutations/useMypageMutation";
import { orderApi } from "@/apps/web-seller/features/order/apis/order.api";
import { OrderSortBy, OrderStatus } from "@/apps/web-seller/features/order/types/order.dto";
import { useMyStores } from "@/apps/web-seller/features/store/hooks/queries/useMyStores";

const MAX_REASON = 1000;

/** 탈퇴를 막는 진행 중 주문 상태(P-34) */
const ACTIVE_STATUSES = [
  OrderStatus.RESERVATION_REQUESTED,
  OrderStatus.PAYMENT_PENDING,
  OrderStatus.PAYMENT_COMPLETED,
  OrderStatus.CONFIRMED,
  OrderStatus.PICKUP_PENDING,
  OrderStatus.CANCEL_REFUND_PENDING,
];

export const MypageWithdrawMobilePage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const withdraw = useMypageWithdraw();
  const { stores } = useMyStores();
  const [reason, setReason] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 내 모든 스토어의 진행 중 주문 수(상태마다 1건만 받아 전체 수를 본다)
  const active = useQueries({
    queries: ACTIVE_STATUSES.map((orderStatus) => ({
      queryKey: ["order", "list", "withdraw-check", orderStatus],
      queryFn: () =>
        orderApi.getOrders({ page: 1, limit: 1, sortBy: OrderSortBy.LATEST, orderStatus }),
    })),
  });
  const activeCount = active.reduce((sum, q) => sum + (q.data?.meta.totalItems ?? 0), 0);
  const activeStoreId =
    active.map((q) => q.data?.data[0]?.storeId).find(Boolean) ?? readLastStoreId() ?? stores[0]?.id;

  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && agreed && !withdraw.isPending;

  return (
    <AppScreen
      header={<BackHeader title="회원 탈퇴" />}
      bodyClassName="pt-2"
      footer={
        <BottomActionBar>
          <Button block disabled={!canSubmit} onClick={() => setConfirmOpen(true)}>
            회원 탈퇴
          </Button>
        </BottomActionBar>
      }
    >
      <div className="rounded-card border border-ink-100 p-4 text-sub leading-normal text-ink-600">
        탈퇴 시 계정·스토어·상품 등 모든 정보가 삭제되며, 같은 카카오·구글·애플 계정과 휴대폰 번호로
        다시 가입할 수 있어요.
      </div>
      {activeCount > 0 ? (
        <WarningBox className="rounded-control">
          진행 중인 주문이 있어 탈퇴할 수 없어요.{" "}
          {activeStoreId ? (
            <Link
              to={`${ROUTES.STORE_DETAIL_ORDERS_LIST(activeStoreId)}?tab=todo`}
              className="inline-flex min-h-11 items-center font-bold text-brand-ink"
            >
              주문 보기
            </Link>
          ) : null}
        </WarningBox>
      ) : null}
      <div className="flex flex-col gap-1">
        <h2 className="text-body font-bold text-ink-900">탈퇴 사유</h2>
        <p className="text-caption text-ink-600">남겨주시면 서비스 개선에 활용됩니다</p>
      </div>
      <Field counter={`${trimmed.length}/${MAX_REASON}`}>
        {(p) => (
          <TextArea
            id={p.id}
            aria-label="탈퇴 사유"
            aria-describedby={p.describedBy}
            className="min-h-[120px]"
            maxLength={MAX_REASON}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="탈퇴 사유를 입력해주세요."
          />
        )}
      </Field>
      <Checkbox checked={agreed} onChange={setAgreed}>
        회원 탈퇴 시 계정 정보가 삭제되는 것에 동의합니다.
      </Checkbox>

      <BottomSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        dismissible={!withdraw.isPending}
        title="정말로 회원 탈퇴를 진행하시겠어요?"
        description="탈퇴 시 계정·스토어·상품 등 모든 정보가 삭제되며 복구할 수 없습니다."
        footer={
          <ButtonPair>
            <Button
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={withdraw.isPending}
            >
              돌아가기
            </Button>
            <Button
              loading={withdraw.isPending}
              onClick={async () => {
                try {
                  await withdraw.mutateAsync({ reason: trimmed });
                  logout(navigate);
                } catch {
                  setConfirmOpen(false);
                }
              }}
            >
              회원 탈퇴
            </Button>
          </ButtonPair>
        }
      />
    </AppScreen>
  );
};
