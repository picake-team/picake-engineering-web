import { safeHttpUrl } from "@/apps/web-admin/common/utils/safe-url.util";
import type { ReactNode } from "react";
import { ContentLoading } from "@/apps/web-admin/common/components/loading/ContentLoading";
import { LIST_CARD_TITLE } from "@/apps/web-admin/common/constants/list-typography.constant";
import { useStoreEntryRequestDetail } from "@/apps/web-admin/features/store-entry-request-management/hooks/queries/useStoreEntryRequestManagementQuery";
import {
  formatStoreEntryRequestAddress,
  formatStoreEntryRequestDateTime,
} from "@/apps/web-admin/features/store-entry-request-management/utils/store-entry-request-date.util";

interface StoreEntryRequestDetailDialogProps {
  requestId: string | null;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 border-b border-border/60 py-2 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground break-all">{value ?? "-"}</dd>
    </div>
  );
}

export function StoreEntryRequestDetailDialog({
  requestId,
  onClose,
}: StoreEntryRequestDetailDialogProps) {
  const { data, isLoading } = useStoreEntryRequestDetail(requestId);

  if (!requestId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-card text-card-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className={LIST_CARD_TITLE}>입점 요청 상세</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            닫기
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {isLoading && (
            <ContentLoading
              variant="section"
              message="입점 요청 정보를 불러오는 중…"
              className="py-12"
            />
          )}

          {!isLoading && data && (
            <div className="space-y-6">
              <section>
                <h4 className="mb-2 text-sm font-semibold">장소 정보</h4>
                <dl>
                  <DetailRow label="장소명" value={data.placeName} />
                  <DetailRow label="카테고리" value={data.categoryName || "-"} />
                  <DetailRow label="연락처" value={data.phone || "-"} />
                  <DetailRow label="주소" value={formatStoreEntryRequestAddress(data)} />
                  <DetailRow
                    label="좌표"
                    value={
                      data.latitude != null && data.longitude != null
                        ? `${data.latitude}, ${data.longitude}`
                        : "-"
                    }
                  />
                  <DetailRow label="카카오 장소 ID" value={data.kakaoPlaceId} />
                  <DetailRow
                    label="카카오 링크"
                    value={
                      safeHttpUrl(data.placeUrl) ? (
                        <a
                          href={safeHttpUrl(data.placeUrl)!}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {data.placeUrl}
                        </a>
                      ) : (
                        "-"
                      )
                    }
                  />
                  <DetailRow
                    label="동일 장소 요청"
                    value={`${data.samePlaceRequestCount.toLocaleString()}건`}
                  />
                </dl>
              </section>

              <section>
                <h4 className="mb-2 text-sm font-semibold">요청자</h4>
                <dl>
                  <DetailRow
                    label="닉네임 / 이름"
                    value={`${data.consumer.nickname ?? "-"} / ${data.consumer.name ?? "-"}`}
                  />
                  <DetailRow label="휴대폰" value={data.consumer.phone} />
                </dl>
              </section>

              <section>
                <h4 className="mb-2 text-sm font-semibold">요청 정보</h4>
                <dl>
                  <DetailRow
                    label="요청일시"
                    value={formatStoreEntryRequestDateTime(data.createdAt)}
                  />
                  <DetailRow
                    label="수정일시"
                    value={formatStoreEntryRequestDateTime(data.updatedAt)}
                  />
                </dl>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
