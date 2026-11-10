/**
 * 스토어 이름 유효성 검증 및 에러 메시지 반환
 */
export const validateStoreName = (name: string): string | null => {
  // 미입력 검증
  if (!name || !name.trim()) {
    return "스토어 이름을 입력해 주세요.";
  }

  const trimmedName = name.trim();

  // 2자 미만 검증
  if (trimmedName.length < 2) {
    return "스토어 이름을 2자 이상 입력해 주세요.";
  }

  // 30자 초과 검증
  if (trimmedName.length > 30) {
    return "스토어 이름은 30자 이하여야 해요.";
  }

  // 특수문자 제한 검증 (한글, 영문, 숫자, 공백만 허용)
  const storeNamePattern = /^[가-힣a-zA-Z0-9\s]+$/;
  if (!storeNamePattern.test(trimmedName)) {
    return "스토어 이름은 한글·영문·숫자만 쓸 수 있어요.";
  }

  return null;
};

/**
 * 스토어 설명 최대 글자 수 (P-46). 네이버 플레이스 소개글 한도와 같은 2,000자라
 * 네이버에서 가져온 소개글이 잘리지 않는다. 손님 화면은 길면 접어서 보여 준다.
 */
export const STORE_DESCRIPTION_MAX_LENGTH = 2000;

/**
 * 스토어 설명 유효성 검증 및 에러 메시지 반환
 */
export const validateStoreDescription = (description: string | undefined): string | null => {
  // 선택 필드이므로 값이 없으면 통과
  if (!description) {
    return null;
  }

  // 최대 글자 수 초과 검증
  if (description.length > STORE_DESCRIPTION_MAX_LENGTH) {
    return `스토어 설명은 ${STORE_DESCRIPTION_MAX_LENGTH}자 이하로 입력해 주세요.`;
  }

  // HTML 태그 검증 (< > 태그가 포함되어 있는지 확인)
  const htmlTagPattern = /<[^>]*>/;
  if (htmlTagPattern.test(description)) {
    return "스토어 설명에는 HTML 태그를 쓸 수 없어요.";
  }

  return null;
};

/**
 * 스토어 연락처 유효성 검증 (필수)
 */
export const validateStorePhoneNumber = (value: string | undefined): string | null => {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return "스토어 연락처를 입력해 주세요.";
  }
  if (trimmed.length < 8 || trimmed.length > 20) {
    return "스토어 연락처는 8자 이상 20자 이하여야 해요.";
  }
  if (!/^[0-9\-+() ]+$/.test(trimmed)) {
    return "스토어 연락처는 숫자·하이픈(-)·공백·괄호·+만 쓸 수 있어요.";
  }
  return null;
};

/**
 * 상세주소 유효성 검증 및 에러 메시지 반환
 */
export const validateDetailAddress = (detailAddress: string): string | null => {
  // 미입력 검증
  if (!detailAddress || !detailAddress.trim()) {
    return "상세주소를 입력해 주세요.";
  }

  const trimmedAddress = detailAddress.trim();

  // 2자 미만 검증
  if (trimmedAddress.length < 2) {
    return "상세주소를 2자 이상 입력해 주세요.";
  }

  // 1000자 초과 검증
  if (trimmedAddress.length > 1000) {
    return "상세주소는 1,000자 이하여야 해요.";
  }

  return null;
};

/**
 * 정산 계좌번호 유효성 검증
 */
export const validateBankAccountNumber = (value: string): string | null => {
  if (!value || !value.trim()) {
    return "계좌번호를 입력해 주세요.";
  }
  const trimmed = value.trim();
  if (trimmed.length < 4 || trimmed.length > 30) {
    return "계좌번호는 4자 이상 30자 이하여야 해요.";
  }
  if (!/^[0-9\- ]+$/.test(trimmed)) {
    return "계좌번호는 숫자·하이픈(-)·공백만 쓸 수 있어요.";
  }
  return null;
};

/**
 * 예금주명 유효성 검증
 */
export const validateAccountHolderName = (value: string): string | null => {
  if (!value || !value.trim()) {
    return "예금주명을 입력해 주세요.";
  }
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 30) {
    return "예금주명은 2자 이상 30자 이하여야 해요.";
  }
  const pattern = /^[가-힣a-zA-Z0-9\s]+$/;
  if (!pattern.test(trimmed)) {
    return "예금주명은 한글·영문·숫자만 쓸 수 있어요.";
  }
  return null;
};
