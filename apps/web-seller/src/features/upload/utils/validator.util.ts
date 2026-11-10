/**
 * 파일 크기 유효성 검증 및 에러 메시지 반환
 */
export const validateFileSize = (file: File, maxSize: number): string | null => {
  if (!file) {
    return null;
  }

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return `파일 용량은 ${maxSizeMB}MB 이하로 업로드해 주세요.`;
  }

  return null;
};

/**
 * 최대 이미지 개수 유효성 검증 및 에러 메시지 반환
 */
export const validateMaxImages = (currentImageCount: number, maxImages: number): string | null => {
  if (currentImageCount >= maxImages) {
    return `사진은 ${maxImages}장까지 올릴 수 있어요.`;
  }

  return null;
};

/**
 * 파일 타입 유효성 검증 및 에러 메시지 반환
 */
export const validateFileType = (file: File, accept: string): string | null => {
  if (!file || !accept) {
    return null;
  }

  // accept 문자열을 확장자 배열로 변환
  const acceptedExtensions = accept
    .split(",")
    .map((ext) => ext.trim().toLowerCase())
    .filter((ext) => ext.length > 0);

  if (acceptedExtensions.length === 0) {
    return null; // accept가 비어있으면 검증하지 않음
  }

  // 파일명에서 확장자 추출
  const fileName = file.name.toLowerCase();
  const lastDotIndex = fileName.lastIndexOf(".");
  const fileExtension =
    lastDotIndex !== -1 && lastDotIndex < fileName.length - 1
      ? fileName.substring(lastDotIndex)
      : "";

  // 확장자가 없으면 검증 실패
  if (!fileExtension) {
    const allowedTypes = acceptedExtensions
      .map((ext) => (ext.startsWith(".") ? ext : ext.split("/")[1] || ext))
      .join(", ");
    return `${allowedTypes} 형식의 이미지만 업로드 가능합니다.`;
  }

  // 확장자로만 검증
  const isValidExtension = acceptedExtensions.some((accepted) => {
    const normalizedAccepted = accepted.toLowerCase();

    // 확장자로 매칭 (예: ".jpg", ".png")
    if (normalizedAccepted.startsWith(".")) {
      return fileExtension === normalizedAccepted;
    }

    return false;
  });

  if (!isValidExtension) {
    const allowedTypes = acceptedExtensions
      .map((ext) => (ext.startsWith(".") ? ext : ext.split("/")[1] || ext))
      .join(", ");
    return `${allowedTypes} 형식의 이미지만 업로드 가능합니다.`;
  }

  return null;
};
