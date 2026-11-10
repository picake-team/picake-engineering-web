import type {
  RefundCancellationPolicyDto,
  RefundRuleItemDto,
} from "@/apps/web-seller/features/store/types/store.dto";

function emptyPolicy(): RefundCancellationPolicyDto {
  return { rules: [{ daysBeforePickup: 0, refundDescription: "" }] };
}

/** 스토어 등록·수정 폼 초기값 */
export function createInitialRefundCancellationPolicy(): RefundCancellationPolicyDto {
  return emptyPolicy();
}

function normalizeRuleItem(raw: unknown): RefundRuleItemDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as RefundRuleItemDto;
  const d = o.daysBeforePickup;
  if (typeof d !== "number" || !Number.isInteger(d) || d < 0 || d > 999) return null;
  return {
    daysBeforePickup: d,
    refundDescription: typeof o.refundDescription === "string" ? o.refundDescription : "",
  };
}

/** API 응답 → 폼용 (`rules` 또는 단일 필드 레거시) */
export function normalizeRefundPolicyFromApi(
  raw:
    | RefundCancellationPolicyDto
    | (Record<string, unknown> & { rules?: unknown })
    | undefined
    | null,
): RefundCancellationPolicyDto {
  if (!raw) return emptyPolicy();

  const asAny = raw as Record<string, unknown>;
  if (Array.isArray(asAny.rules) && asAny.rules.length > 0) {
    const rules: RefundRuleItemDto[] = [];
    for (const item of asAny.rules) {
      const r = normalizeRuleItem(item);
      if (!r) return emptyPolicy();
      rules.push(r);
    }
    if (rules.length > 30) return emptyPolicy();
    return { rules };
  }

  const d = asAny.daysBeforePickup;
  if (typeof d === "number" && Number.isInteger(d) && d >= 0 && d <= 999) {
    const refundDescription =
      typeof asAny.refundDescription === "string" ? asAny.refundDescription : "";
    return { rules: [{ daysBeforePickup: d, refundDescription }] };
  }

  return emptyPolicy();
}

export function appendRefundRule(policy: RefundCancellationPolicyDto): RefundCancellationPolicyDto {
  if (policy.rules.length >= 30) return policy;
  return { rules: [...policy.rules, { daysBeforePickup: 0, refundDescription: "" }] };
}

export function removeRefundRuleAt(
  policy: RefundCancellationPolicyDto,
  index: number,
): RefundCancellationPolicyDto {
  if (policy.rules.length <= 1) return policy;
  return { rules: policy.rules.filter((_, i) => i !== index) };
}

export function updateRefundRuleAt(
  policy: RefundCancellationPolicyDto,
  index: number,
  patch: Partial<RefundRuleItemDto>,
): RefundCancellationPolicyDto {
  const rules = policy.rules.map((r, i) => (i === index ? { ...r, ...patch } : r));
  return { rules };
}

/** 폼 검증: 오류 메시지 또는 null */
export function validateRefundCancellationPolicy(
  policy: RefundCancellationPolicyDto,
): string | null {
  if (!policy.rules?.length) {
    return "환불·취소 규칙을 최소 1개 이상 입력해 주세요.";
  }
  if (policy.rules.length > 30) {
    return "환불·취소 규칙은 30개까지 적을 수 있어요.";
  }
  for (let i = 0; i < policy.rules.length; i++) {
    const r = policy.rules[i];
    const d = r.daysBeforePickup;
    if (!Number.isInteger(d) || d < 0 || d > 999) {
      return `${i + 1}번째 규칙: 픽업 며칠 전은 0~999 사이 정수로 입력해 주세요. (0은 픽업 당일)`;
    }
    const desc = r.refundDescription?.trim() ?? "";
    if (!desc) {
      return `${i + 1}번째 규칙: 환불·취소 조건을 입력해 주세요.`;
    }
    if (desc.length > 500) {
      return `${i + 1}번째 규칙: 환불·취소 조건은 500자 이하로 입력해 주세요.`;
    }
  }
  return null;
}
