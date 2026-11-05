import type { ReactNode } from "react";
import { Package, ShoppingBag, Wallet } from "lucide-react";
import { StatusBadge } from "@/apps/web-admin/common/components/badges/StatusBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/apps/web-admin/common/components/cards/Card";
import { EmptyState } from "@/apps/web-admin/common/components/fallbacks/EmptyState";
import { ContentLoading } from "@/apps/web-admin/common/components/loading/ContentLoading";
import {
  LIST_CARD,
  LIST_CARD_TITLE,
  LIST_TABLE_CELL,
  LIST_TABLE_CELL_MUTED,
  LIST_TABLE_HEAD,
} from "@/apps/web-admin/common/constants/list-typography.constant";
import { cn } from "@/apps/web-admin/common/utils/classname.util";
import { StatisticsStatusCountCard } from "@/apps/web-admin/features/statistics/components/shared/StatisticsStatusCountCard";
import { StatisticsSummaryCard } from "@/apps/web-admin/features/statistics/components/shared/StatisticsSummaryCard";
import { STATISTICS_ORDER_STATUS_LABELS } from "@/apps/web-admin/features/statistics/constants/statistics.constant";
import { useStoreManagementDetail } from "@/apps/web-admin/features/store-management/hooks/queries/useStoreManagementQuery";
import { getStoreBankLabel } from "@/apps/web-admin/features/store-management/utils/store-bank.ui.util";
import {
  formatStoreAddress,
  formatStoreManagementDateTime,
} from "@/apps/web-admin/features/store-management/utils/store-management-date.util";
import {
  getMemberStatus,
  getMemberStatusBadgeVariant,
  getMemberStatusLabel,
  getSellerVerificationStatusBadgeVariant,
  getSellerVerificationStatusLabel,
} from "@/apps/web-admin/features/member-management/utils/member-status.ui.util";

interface StoreManagementDetailDialogProps {
  storeId: string | null;
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

export function StoreManagementDetailDialog({
  storeId,
  onClose,
}: StoreManagementDetailDialogProps) {
  const { data, isLoading } = useStoreManagementDetail(storeId);

  if (!storeId) return null;

  const sellerStatus = data ? getMemberStatus(data.seller) : null;
  const statistics = data?.statistics;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-border bg-card text-card-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className={LIST_CARD_TITLE}>스토어 상세</h3>
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
              message="스토어 정보를 불러오는 중…"
              className="py-12"
            />
          )}

          {!isLoading && data && statistics && (
            <div className="space-y-6">
              <section>
                <h4 className="mb-3 text-sm font-semibold">주문·매출 통계</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatisticsSummaryCard
                    icon={<Wallet className="h-4 w-4" />}
                    title="GMV (픽업 완료)"
                    value={`${statistics.gmv.toLocaleString()}원`}
                    footnote="픽업 완료된 주문의 총 금액 합"
                  />
                  <StatisticsSummaryCard
                    icon={<ShoppingBag className="h-4 w-4" />}
                    title="픽업 완료 주문"
                    value={`${statistics.completedOrders.toLocaleString()}건`}
                    footnote="실적에 포함되는 주문"
                  />
                  <StatisticsSummaryCard
                    icon={<Package className="h-4 w-4" />}
                    title="전체 주문"
                    value={`${statistics.totalOrders.toLocaleString()}건`}
                    footnote="모든 상태의 주문 포함"
                  />
                </div>
              </section>

              <section>
                <h4 className="mb-3 text-sm font-semibold">최근 기간 (Asia/Seoul)</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatisticsSummaryCard
                    icon={<ShoppingBag className="h-4 w-4" />}
                    title="최근 7일"
                    value={`${statistics.last7Days.gmv.toLocaleString()}원`}
                    rows={[
                      {
                        label: "전체 주문",
                        value: `${statistics.last7Days.orders.toLocaleString()}건`,
                      },
                      {
                        label: "픽업 완료",
                        value: `${statistics.last7Days.completedOrders.toLocaleString()}건`,
                      },
                    ]}
                  />
                  <StatisticsSummaryCard
                    icon={<ShoppingBag className="h-4 w-4" />}
                    title="최근 30일"
                    value={`${statistics.last30Days.gmv.toLocaleString()}원`}
                    rows={[
                      {
                        label: "전체 주문",
                        value: `${statistics.last30Days.orders.toLocaleString()}건`,
                      },
                      {
                        label: "픽업 완료",
                        value: `${statistics.last30Days.completedOrders.toLocaleString()}건`,
                      },
                    ]}
                  />
                </div>
              </section>

              <StatisticsStatusCountCard
                title="주문 상태별 현황"
                description={`전체 ${statistics.totalOrders.toLocaleString()}건`}
                items={statistics.byStatus}
                labels={STATISTICS_ORDER_STATUS_LABELS}
                emptyMessage="주문이 없습니다."
              />

              <Card className={LIST_CARD}>
                <CardHeader>
                  <CardTitle className={LIST_CARD_TITLE}>매출 상위 상품</CardTitle>
                  <p className="text-sm text-muted-foreground">픽업 완료 기준 매출 Top 5</p>
                </CardHeader>
                <CardContent>
                  {statistics.topProductsByRevenue.length === 0 ? (
                    <EmptyState message="픽업 완료 주문이 없습니다." className="py-6" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[420px]">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className={cn("px-2 py-2", LIST_TABLE_HEAD)}>상품</th>
                            <th className={cn("px-2 py-2 text-right", LIST_TABLE_HEAD)}>주문</th>
                            <th className={cn("px-2 py-2 text-right", LIST_TABLE_HEAD)}>매출</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statistics.topProductsByRevenue.map((product) => (
                            <tr
                              key={product.productId}
                              className="border-b border-border/80 last:border-0"
                            >
                              <td className={cn("px-2 py-2", LIST_TABLE_CELL)}>
                                {product.productName}
                              </td>
                              <td className={cn("px-2 py-2 text-right", LIST_TABLE_CELL_MUTED)}>
                                {product.orderCount.toLocaleString()}건
                              </td>
                              <td className={cn("px-2 py-2 text-right", LIST_TABLE_CELL)}>
                                {product.revenue.toLocaleString()}원
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <section>
                <h4 className="mb-2 text-sm font-semibold">운영 지표</h4>
                <dl>
                  <DetailRow label="상품 수" value={data.productCount.toLocaleString()} />
                  <DetailRow label="피드 수" value={data.feedCount.toLocaleString()} />
                  <DetailRow label="좋아요" value={data.likeCount.toLocaleString()} />
                </dl>
              </section>

              <section>
                <h4 className="mb-2 text-sm font-semibold">기본 정보</h4>
                <dl>
                  <DetailRow label="스토어명" value={data.name} />
                  <DetailRow label="소개" value={data.description || "-"} />
                  <DetailRow label="연락처" value={data.phoneNumber || "-"} />
                  <DetailRow
                    label="주소"
                    value={
                      <>
                        {data.zonecode ? `[${data.zonecode}] ` : ""}
                        {formatStoreAddress(data)}
                      </>
                    }
                  />
                  <DetailRow
                    label="좌표"
                    value={
                      data.latitude != null && data.longitude != null
                        ? `${data.latitude}, ${data.longitude}`
                        : "-"
                    }
                  />
                  <DetailRow
                    label="채널"
                    value={
                      [
                        data.kakaoChannelId && `카카오: ${data.kakaoChannelId}`,
                        data.instagramId && `인스타: ${data.instagramId}`,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "-"
                    }
                  />
                  <DetailRow
                    label="등록일시"
                    value={formatStoreManagementDateTime(data.createdAt)}
                  />
                  <DetailRow
                    label="수정일시"
                    value={formatStoreManagementDateTime(data.updatedAt)}
                  />
                </dl>
              </section>

              <section>
                <h4 className="mb-2 text-sm font-semibold">사업자 정보</h4>
                <dl>
                  <DetailRow label="사업자명" value={data.businessName} />
                  <DetailRow label="사업자번호" value={data.businessNo} />
                  <DetailRow label="대표자" value={data.representativeName} />
                  <DetailRow label="개업일자" value={data.openingDate} />
                  <DetailRow label="업종" value={data.businessSector} />
                  <DetailRow label="업태" value={data.businessType} />
                  <DetailRow
                    label="통신판매번호"
                    value={data.permissionManagementNumber ?? "없음 (받지 않음)"}
                  />
                </dl>
              </section>

              <section>
                <h4 className="mb-2 text-sm font-semibold">정산 계좌</h4>
                <dl>
                  <DetailRow label="은행" value={getStoreBankLabel(data.bankName)} />
                  <DetailRow label="계좌번호" value={data.bankAccountNumber || "-"} />
                  <DetailRow label="예금주" value={data.accountHolderName || "-"} />
                </dl>
              </section>

              <section>
                <h4 className="mb-2 text-sm font-semibold">판매자</h4>
                <dl>
                  <DetailRow
                    label="닉네임 / 이름"
                    value={`${data.seller.nickname ?? "-"} / ${data.seller.name ?? "-"}`}
                  />
                  <DetailRow label="휴대폰" value={data.seller.phone} />
                  <DetailRow
                    label="검증 상태"
                    value={
                      <StatusBadge
                        variant={getSellerVerificationStatusBadgeVariant(
                          data.seller.sellerVerificationStatus,
                        )}
                      >
                        {getSellerVerificationStatusLabel(data.seller.sellerVerificationStatus)}
                      </StatusBadge>
                    }
                  />
                  {sellerStatus && (
                    <DetailRow
                      label="계정 상태"
                      value={
                        <StatusBadge variant={getMemberStatusBadgeVariant(sellerStatus)}>
                          {getMemberStatusLabel(sellerStatus)}
                        </StatusBadge>
                      }
                    />
                  )}
                  <DetailRow
                    label="가입일시"
                    value={formatStoreManagementDateTime(data.seller.createdAt)}
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
