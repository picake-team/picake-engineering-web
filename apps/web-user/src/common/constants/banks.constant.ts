/**
 * 은행 선택 바텀시트용 데이터.
 * - value: 백엔드 StoreBankName enum 값 (백엔드 스펙과 정확히 일치하지 않으면 교체 필요)
 * - label: 사용자 노출 한글명
 * - imageUrl: /public/images/banks/ 하위 로고 경로
 *
 * 일부 은행은 동일 로고를 공유함:
 * - 신한은행 / 제주은행: shinhan.png
 * - 경남은행 / 부산은행: bnk.png (BNK 금융지주)
 * - 광주은행 / 전북은행: jb.png (JB 금융지주)
 */
export interface BankItem {
  value: string;
  label: string;
  imageUrl?: string;
}

export const BANK_LIST: BankItem[] = [
  // 시중은행
  { value: "KB_KOOKMIN", label: "KB국민은행", imageUrl: "/images/banks/kb.png" },
  { value: "SHINHAN", label: "신한은행", imageUrl: "/images/banks/shinhan.png" },
  { value: "WOORI", label: "우리은행", imageUrl: "/images/banks/woori.png" },
  { value: "HANA", label: "KEB하나은행", imageUrl: "/images/banks/hana.png" },
  { value: "NH_NONGHYUP", label: "NH농협은행", imageUrl: "/images/banks/nh.png" },
  { value: "IBK", label: "IBK기업은행", imageUrl: "/images/banks/ibk.png" },
  { value: "KDB", label: "KDB산업은행", imageUrl: "/images/banks/kdb.png" },
  { value: "SUHYUP", label: "수협은행", imageUrl: "/images/banks/suhyup.png" },

  // 인터넷전문은행
  { value: "KAKAO_BANK", label: "카카오뱅크", imageUrl: "/images/banks/kakao.png" },
  { value: "TOSS_BANK", label: "토스뱅크", imageUrl: "/images/banks/toss.png" },
  { value: "K_BANK", label: "케이뱅크", imageUrl: "/images/banks/kbank.png" },

  // 지방은행 (BNK·JB 금융지주는 로고 공유)
  { value: "KYONGNAM", label: "경남은행", imageUrl: "/images/banks/bnk.png" },
  { value: "BUSAN", label: "부산은행", imageUrl: "/images/banks/bnk.png" },
  { value: "IM_BANK_DAEGU", label: "iM뱅크", imageUrl: "/images/banks/im.png" },
  { value: "GWANGJU", label: "광주은행", imageUrl: "/images/banks/jb.png" },
  { value: "JEONBUK", label: "전북은행", imageUrl: "/images/banks/jb.png" },
  { value: "JEJU", label: "제주은행", imageUrl: "/images/banks/shinhan.png" },

  // 외국계
  { value: "SC_JEIL", label: "SC제일은행", imageUrl: "/images/banks/sc.png" },
  { value: "CITI", label: "시티은행", imageUrl: "/images/banks/citi.png" },
  { value: "SAVINGS_BANK", label: "SBI저축은행", imageUrl: "/images/banks/sbi.png" },

  // 기타
  { value: "SAEMAEUL", label: "MG새마을금고", imageUrl: "/images/banks/mg.png" },
  { value: "POST_OFFICE", label: "우체국", imageUrl: "/images/banks/post.png" },
  { value: "SINHYEOP", label: "신협", imageUrl: "/images/banks/shinhyup.png" },
];
