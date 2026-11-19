import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/apps/web-seller/features/auth/store/auth.store";
import { mypageApi } from "@/apps/web-seller/features/mypage/apis/mypage.api";
import { mypageQueryKeys } from "@/apps/web-seller/features/mypage/constants/mypageQueryKeys.constant";
import type { SellerMypageProfileResponseDto } from "@/apps/web-seller/features/mypage/types/mypage.dto";

export function useMypageProfile() {
  const { isAuthenticated } = useAuthStore();

  const query = useQuery<SellerMypageProfileResponseDto>({
    queryKey: mypageQueryKeys.profile(),
    queryFn: () => mypageApi.getProfile(),
    enabled: isAuthenticated,
  });

  return query;
}
