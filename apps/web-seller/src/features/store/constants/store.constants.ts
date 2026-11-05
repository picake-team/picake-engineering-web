import { StoreBankName } from "@/apps/web-seller/features/store/types/store.dto";
import type { SelectOption } from "@/apps/web-seller/common/components/selects/SelectBox";

/** 정산 계좌 은행 선택 옵션 (백엔드 StoreBankName·Prisma enum과 동일 순서·값) */
export const STORE_BANK_OPTIONS: readonly SelectOption[] = [
  { value: StoreBankName.NH_NONGHYUP, label: "NH농협" },
  { value: StoreBankName.KAKAO_BANK, label: "카카오뱅크" },
  { value: StoreBankName.KB_KOOKMIN, label: "KB국민" },
  { value: StoreBankName.TOSS_BANK, label: "토스뱅크" },
  { value: StoreBankName.SHINHAN, label: "신한" },
  { value: StoreBankName.WOORI, label: "우리" },
  { value: StoreBankName.IBK, label: "IBK기업" },
  { value: StoreBankName.HANA, label: "하나" },
  { value: StoreBankName.SAEMAEUL, label: "새마을" },
  { value: StoreBankName.BUSAN, label: "부산" },
  { value: StoreBankName.IM_BANK_DAEGU, label: "iM뱅크(대구)" },
  { value: StoreBankName.K_BANK, label: "케이뱅크" },
  { value: StoreBankName.SINHYEOP, label: "신협" },
  { value: StoreBankName.POST_OFFICE, label: "우체국" },
  { value: StoreBankName.SC_JEIL, label: "SC제일" },
  { value: StoreBankName.KYONGNAM, label: "경남" },
  { value: StoreBankName.GWANGJU, label: "광주" },
  { value: StoreBankName.SUHYUP, label: "수협" },
  { value: StoreBankName.JEONBUK, label: "전북" },
  { value: StoreBankName.SAVINGS_BANK, label: "저축은행" },
  { value: StoreBankName.JEJU, label: "제주" },
  { value: StoreBankName.CITI, label: "씨티" },
  { value: StoreBankName.KDB, label: "KDB산업" },
] as const;

/**
 * 스토어 만들기에서 통신판매업 신고 정보를 받을지 (2026-11 법 검토로 받지 않음).
 * 동네 가게가 근처 손님에게 음식료를 파는 거래는 전자상거래법 제3조 ④로 통신판매업 신고(제12조)가
 * 적용되지 않는다. 다시 받으려면 true로 바꾸면 '통신판매사업자 정보 등록' 단계가 돌아온다(서버는 둘 다 받음).
 */
export const REQUIRE_ONLINE_TRADING_REGISTRATION: boolean = false;
