/**
 * GET `/v1/seller/statistics/orders/overview`. 기간·스토어마다 쿼리 키 분리, 기간만 바꿀 때는 이전 데이터 유지(`keepPreviousData`).
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { statisticsApi } from "@/apps/web-seller/features/statistics/apis/statistics.api";
import { statisticsQueryKeys } from "@/apps/web-seller/features/statistics/constants/statisticsQueryKeys.constant";
import type { OrderStatisticsOverviewResponseDto } from "@/apps/web-seller/features/statistics/types/statistics.dto";

export function useStatisticsOverviewQuery(params: {
  storeId: string;
  startDate: string;
  endDate: string;
}) {
  const { storeId, startDate, endDate } = params;

  const query = useQuery<OrderStatisticsOverviewResponseDto>({
    queryKey: statisticsQueryKeys.overview({ storeId, startDate, endDate }),
    queryFn: () => statisticsApi.getOverview({ storeId, startDate, endDate }),
    enabled: !!storeId && !!startDate && !!endDate && startDate <= endDate,
    placeholderData: keepPreviousData,
  });

  return query;
}
