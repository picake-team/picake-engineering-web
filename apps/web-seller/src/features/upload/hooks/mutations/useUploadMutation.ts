import { useMutation } from "@tanstack/react-query";
import { uploadApi } from "@/apps/web-seller/features/upload/apis/upload.api";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";

// 파일 업로드 뮤테이션. silent면 위 안내를 띄우지 않는다(사진 칸 아래에 직접 알리는 곳)
export function useUploadFile({ silent = false }: { silent?: boolean } = {}) {
  const { addAlert } = useAlertStore();

  return useMutation({
    mutationFn: (file: File) => uploadApi.uploadFile(file),
    onError: (error) => {
      if (silent) return;
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
      });
    },
  });
}
