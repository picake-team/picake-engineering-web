/** 운영자 대신 입력(기획 I-41) — 서버 `modules/act-as/dto/act-as.dto.ts`와 같은 모양 */

export interface StartActAsSessionRequestDto {
  reason: string;
  totpCode: string;
}

export interface StartActAsSessionResponseDto {
  sessionId: string;
  /** 판매자 화면 들어오기 주소(한 번만 쓰는 코드, 60초) */
  sellerUrl: string;
  expiresAt: string;
}

export interface ActAsActionSummaryDto {
  product: number;
  manualOrder: number;
  calendar: number;
  store: number;
  view: number;
  blocked: number;
}

export type ActAsSessionStatus = "ACTIVE" | "ENDED" | "EXPIRED";

export interface ActAsSessionItemDto {
  id: string;
  adminUsername: string;
  reason: string;
  startedAt: string;
  expiresAt: string;
  endedAt: string | null;
  endedBy: string | null;
  status: ActAsSessionStatus;
  summary: ActAsActionSummaryDto;
}

export interface ActAsActionItemDto {
  id: string;
  method: string;
  route: string;
  targetId: string | null;
  fields: string[];
  status: number;
  createdAt: string;
}
