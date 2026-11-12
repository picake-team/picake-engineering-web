/**
 * 사업자등록번호 유효성 검증 및 에러 메시지 반환
 */
export const validateBusinessNo = (businessNo: string): string | null => {
  const BUSINESS_NO_PATTERN = /^\d{10}$/; // 사업자등록번호: 10자리 숫자

  if (!businessNo || !businessNo.trim()) {
    return "사업자등록번호를 입력해 주세요.";
  }

  // 숫자가 아닌 문자가 포함되어 있는지 확인
  if (!/^\d+$/.test(businessNo)) {
    return "숫자만 넣을 수 있어요.";
  }

  // 자리 수 확인 (패턴 사용)
  if (!BUSINESS_NO_PATTERN.test(businessNo)) {
    return "사업자 등록번호는 10자리 숫자로 입력해 주세요.";
  }

  return null;
};

/**
 * 대표자명 유효성 검증 및 에러 메시지 반환
 */
export const validateRepresentativeName = (representativeName: string): string | null => {
  const REPRESENTATIVE_NAME_PATTERN = /^[가-힣\s()&.,-]+$/; // 대표자명 허용 문자: 한글, 공백, 괄호(), &, ., ,, -

  if (!representativeName || !representativeName.trim()) {
    return "대표자명을 입력해 주세요.";
  }

  const trimmed = representativeName.trim();

  // 2자 미만 체크
  if (trimmed.length < 2) {
    return "2자 이상 입력해 주세요.";
  }

  // 30자 초과 체크
  if (trimmed.length > 30) {
    return "30자 이하로 입력해 주세요.";
  }

  // 한글 포함 여부 체크 (숫자나 영어만으로 구성된 경우 방지)
  if (!/[가-힣]/.test(trimmed)) {
    return "한글을 포함해서 입력해 주세요.";
  }

  // 허용된 문자 패턴 체크 (한글, 공백, 괄호(), &, ., ,, -)
  if (!REPRESENTATIVE_NAME_PATTERN.test(trimmed)) {
    return "특수문자·이모지는 쓸 수 없어요.";
  }

  return null;
};

/**
 * 개업일 유효성 검증 및 에러 메시지 반환
 */
export const validateStartDate = (startDate: string): string | null => {
  const START_DATE_PATTERN = /^\d{8}$/; // 개업일: YYYYMMDD 8자리 숫자

  if (!startDate || !startDate.trim()) {
    return "개업일을 입력해 주세요.";
  }

  const trimmed = startDate.trim();

  // 형식 체크 (8자리 숫자)
  if (!START_DATE_PATTERN.test(trimmed)) {
    return "YYYYMMDD 형식으로 입력해 주세요.";
  }

  // 날짜 파싱
  const year = parseInt(trimmed.substring(0, 4), 10);
  const month = parseInt(trimmed.substring(4, 6), 10);
  const day = parseInt(trimmed.substring(6, 8), 10);

  // 1900년 이전 체크
  if (year < 1900) {
    return "1900년 이후 날짜를 입력해 주세요.";
  }

  // 날짜 유효성 체크
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return "없는 날짜예요. 다시 확인해 주세요.";
  }

  // 미래 날짜 체크
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    return "개업일은 오늘 뒤 날짜로 적을 수 없어요.";
  }

  return null;
};

/**
 * 상호 유효성 검증 및 에러 메시지 반환
 */
export const validateBusinessName = (businessName: string): string | null => {
  if (!businessName || !businessName.trim()) {
    return "상호를 입력해 주세요.";
  }

  const trimmed = businessName.trim();

  // 2자 미만 체크
  if (trimmed.length < 2) {
    return "상호는 2자 이상 입력해 주세요.";
  }

  // 50자 초과 체크
  if (trimmed.length > 50) {
    return "상호는 50자 이하로 입력해 주세요.";
  }

  // 의미 없는 반복 문자 체크 (같은 문자가 3번 이상 연속 반복)
  if (/(.)\1{2,}/.test(trimmed)) {
    return "같은 글자만 되풀이해 적을 수 없어요.";
  }

  return null;
};

/**
 * 업태 유효성 검증 및 에러 메시지 반환
 */
export const validateBusinessSector = (businessSector: string): string | null => {
  if (!businessSector || !businessSector.trim()) {
    return "업태를 입력해 주세요.";
  }

  const trimmed = businessSector.trim();

  // 2자 미만 체크
  if (trimmed.length < 2) {
    return "업태는 2자 이상 입력해 주세요.";
  }

  // 50자 초과 체크
  if (trimmed.length > 50) {
    return "업태는 50자 이하로 입력해 주세요.";
  }

  return null;
};

/**
 * 종목 유효성 검증 및 에러 메시지 반환
 */
export const validateBusinessType = (businessType: string): string | null => {
  if (!businessType || !businessType.trim()) {
    return "종목을 입력해 주세요.";
  }

  const trimmed = businessType.trim();

  // 2자 미만 체크
  if (trimmed.length < 2) {
    return "종목은 2자 이상 입력해 주세요.";
  }

  // 50자 초과 체크
  if (trimmed.length > 50) {
    return "종목은 50자 이하로 입력해 주세요.";
  }

  return null;
};

/**
 * 인허가관리번호 유효성 검증 및 에러 메시지 반환
 * 형식: YYYY-한글지역명-숫자4자리 (예: 2021-서울강동-0422)
 */
export const validatePermissionManagementNumber = (prmmiMnno: string): string | null => {
  const PERMISSION_MANAGEMENT_NUMBER_PATTERN = /^\d{4}-[가-힣]+-\d{4}$/; // 인허가관리번호: YYYY-한글지역명-숫자4자리

  if (!prmmiMnno || !prmmiMnno.trim()) {
    return "인허가관리번호를 입력해 주세요.";
  }

  const trimmed = prmmiMnno.trim();

  // 인허가관리번호 형식: YYYY-한글지역명-숫자4자리
  if (!PERMISSION_MANAGEMENT_NUMBER_PATTERN.test(trimmed)) {
    return "YYYY-한글지역명-숫자4자리 형식으로 입력해 주세요. (예: 2021-서울강동-0422)";
  }

  // 연도 검증 (1900년부터 현재 연도까지)
  const parts = trimmed.split("-");
  if (parts.length !== 3) {
    return "YYYY-한글지역명-숫자4자리 형식으로 입력해 주세요. (예: 2021-서울강동-0422)";
  }

  const year = parseInt(parts[0], 10);
  const currentYear = new Date().getFullYear();

  if (year < 1900 || year > currentYear) {
    return `연도는 1900년부터 ${currentYear}년까지 넣을 수 있어요.`;
  }

  // 지역명이 한글로만 이루어져 있는지 확인
  const regionName = parts[1];
  if (!/^[가-힣]+$/.test(regionName)) {
    return "지역명은 한글로만 입력해 주세요.";
  }

  // 마지막 숫자 4자리 검증
  const number = parts[2];
  if (!/^\d{4}$/.test(number)) {
    return "마지막 숫자는 4자리로 입력해 주세요.";
  }

  return null;
};
