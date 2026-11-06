/**
 * 스토어 선택 창 (SC-72). 지금 스토어에 ✓, 다른 스토어는 안 읽은 알림 수(제안).
 * 다른 스토어를 누르면 그 스토어 홈으로. "스토어 만들기"는 스토어 만들기 1단계로.
 */
import { useNavigate } from "react-router-dom";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { rememberLastStoreId } from "@/apps/web-seller/common/utils/last-store.util";
import { useMyStores } from "@/apps/web-seller/features/store/hooks/queries/useMyStores";
import { useNotificationUnreadCount } from "@/apps/web-seller/features/notification/hooks/queries/useNotificationQuery";
import type { StoreResponseDto } from "@/apps/web-seller/features/store/types/store.dto";

function StoreLogo({ store }: { store: StoreResponseDto }) {
  return (
    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-control bg-brand-tint">
      {store.logoImageUrl ? (
        <img src={store.logoImageUrl} alt="" className="size-full object-cover" />
      ) : null}
    </span>
  );
}

function UnreadBubble({ storeId }: { storeId: string }) {
  const { data } = useNotificationUnreadCount(storeId);
  if (!data) return null;
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-tab font-bold text-white">
      <span className="sr-only">안 읽은 알림 </span>
      {data > 99 ? "99+" : data}
    </span>
  );
}

export function StoreSwitchSheet({
  open,
  currentStoreId,
  onClose,
}: {
  open: boolean;
  currentStoreId: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { stores } = useMyStores();
  return (
    <BottomSheet open={open} onClose={onClose} showClose title="스토어 선택">
      <div className="-mt-1 flex flex-col">
        {stores.map((s) => {
          const current = s.id === currentStoreId;
          return (
            <button
              key={s.id}
              type="button"
              aria-current={current ? "true" : undefined}
              onClick={() => {
                onClose();
                if (!current) {
                  rememberLastStoreId(s.id);
                  navigate(ROUTES.STORE_DETAIL_HOME(s.id));
                }
              }}
              className="flex min-h-16 items-center gap-3 border-b border-ink-100 text-left active:bg-ink-50"
            >
              <StoreLogo store={s} />
              <span
                className={cx(
                  "min-w-0 flex-1 truncate text-body text-ink-900",
                  current ? "font-bold" : "font-normal",
                )}
              >
                {s.name}
              </span>
              {current ? (
                <span className="shrink-0 text-brand">
                  <Icon name="check" size={22} strokeWidth={2.4} />
                </span>
              ) : (
                <UnreadBubble storeId={s.id} />
              )}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => {
          onClose();
          navigate(ROUTES.STORE_CREATE);
        }}
        className="flex min-h-13 items-center gap-3 text-left text-body font-semibold text-ink-900 active:bg-ink-50"
      >
        <span className="flex size-10 items-center justify-center rounded-full border border-ink-200 text-ink-700">
          <Icon name="plus" size={18} strokeWidth={1.9} />
        </span>
        스토어 만들기
      </button>
    </BottomSheet>
  );
}
