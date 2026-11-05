import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { StoreCreationForm } from "@/apps/web-seller/features/store/components/forms/StoreCreationForm";
import type { StoreForm } from "@/apps/web-seller/features/store/types/store.ui";
import {
  storeFormToUpdateRequest,
  storeResponseToStoreForm,
} from "@/apps/web-seller/features/store/utils/store-form.mapper";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import { useUpdateStore } from "@/apps/web-seller/features/store/hooks/mutations/useStoreMutation";
import { ContentLoading } from "@/apps/web-seller/common/components/loading/ContentLoading";

export const StoreDetailEditPage: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();

  const { data: store, isLoading } = useStoreDetail(storeId || "");
  const updateStoreMutation = useUpdateStore();
  // 같은 스토어 데이터면 폼을 다시 초기화하지 않도록 고정 (다시 불러오기·창 전환 때 입력 중인 값 유지)
  const storeForm = useMemo<StoreForm | undefined>(
    () => (store ? storeResponseToStoreForm(store) : undefined),
    [store],
  );

  if (!storeId) {
    return (
      <div>
        <h2 className="text-xl font-semibold">스토어가 선택되지 않았습니다.</h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <ContentLoading
        variant="page"
        message="스토어 정보를 불러오는 중…"
        showLogo
        className="border-0 shadow-none"
      />
    );
  }

  if (!store) {
    return (
      <div>
        <h2 className="text-xl font-semibold">스토어를 찾을 수 없습니다.</h2>
      </div>
    );
  }

  const handleUpdate = async (data: StoreForm) => {
    const request = storeFormToUpdateRequest(data);

    await updateStoreMutation.mutateAsync({
      storeId,
      request,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">스토어 수정</h1>
      <StoreCreationForm
        onSubmit={handleUpdate}
        initialValue={storeForm}
        submitButtonText="저장하기"
        naverPlace={{ storeId, connected: store.naverPlace ?? null }}
        submitting={updateStoreMutation.isPending}
      />
    </div>
  );
};
