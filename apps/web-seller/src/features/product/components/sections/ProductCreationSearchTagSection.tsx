import React, { useState, useRef, KeyboardEvent } from "react";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { X } from "lucide-react";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";

export interface ProductCreationSearchTagSectionProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

/** 검색 태그 설정 */
export const ProductCreationSearchTagSection: React.FC<ProductCreationSearchTagSectionProps> = ({
  value = [],
  onChange,
  disabled = false,
}) => {
  const inFrame = useInMobileFrame();
  const [inputValue, setInputValue] = useState("");
  const pendingAddRef = useRef(false);

  const handleAddTag = (valueOverride?: string) => {
    const valueToAdd = (valueOverride ?? inputValue).trim();
    if (!valueToAdd || disabled) return;

    // 입력값에서 # 제거 (자동으로 추가할 예정이므로)
    const tagText = valueToAdd.replace(/^#+/, "");
    if (!tagText) return;

    // 이미 존재하는 태그인지 확인
    const tagWithHash = `#${tagText}`;
    if (value.includes(tagWithHash)) {
      setInputValue("");
      return;
    }

    // 새 태그 추가
    onChange([...value, tagWithHash]);
    setInputValue("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (disabled) return;
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // 한국어/일본어/중국어 IME 조합 중에는 처리하지 않음 (마지막 글자 중복 등록 방지)
      if (e.nativeEvent.isComposing) {
        pendingAddRef.current = true;
        return;
      }
      handleAddTag();
    }
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    if (pendingAddRef.current) {
      pendingAddRef.current = false;
      const target = e.currentTarget as HTMLInputElement;
      handleAddTag(target.value);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4">
        <p className={inFrame ? "text-caption text-ink-600" : "text-sm text-muted-foreground"}>
          손님이 검색할 때 쓰는 말 (예: 생일케이크, 레터링)
        </p>

        {/* 기존 태그 표시 */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((tag, index) => (
              <div
                key={index}
                className={
                  inFrame
                    ? // 휴대폰 틀 안: 앱 칩(흰 바탕 + 회색 테두리, 36)과 같은 모양
                      "inline-flex h-9 items-center gap-1 rounded-full border border-ink-200 bg-white pl-3.5 pr-1.5 font-app text-sub font-bold text-ink-700"
                    : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/60 text-sm text-foreground border border-border/80"
                }
              >
                <span>{tag}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className={
                      inFrame
                        ? "inline-flex size-7 items-center justify-center rounded-full text-ink-400 active:bg-ink-50"
                        : "ml-1 hover:bg-muted rounded-full p-0.5 transition-colors"
                    }
                    aria-label={`${tag} 태그 제거`}
                  >
                    <X
                      className={
                        inFrame
                          ? "h-4 w-4"
                          : "h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                      }
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 태그 입력 필드 */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="태그를 쓰고 추가를 눌러 주세요"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionEnd={handleCompositionEnd}
            disabled={disabled}
            className="flex-1"
          />
          {/* 휴대폰 틀 안: 입력 칸 바로 옆 버튼은 흰 보조 48(디자인 기준 Field) */}
          <Button
            type="button"
            onClick={() => handleAddTag()}
            disabled={disabled || !inputValue.trim()}
            variant={inFrame ? "outline" : undefined}
            size={inFrame ? "lg" : undefined}
          >
            {inFrame ? "추가" : "확인"}
          </Button>
        </div>
      </div>
    </div>
  );
};
