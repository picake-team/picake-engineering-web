"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { Input } from "@/apps/web-user/common/components/inputs/Input";

interface NameEditBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting?: boolean;
  onSubmit?: (name: string) => void;
}

export function NameEditBottomSheet({
  isOpen,
  onClose,
  isSubmitting = false,
  onSubmit,
}: NameEditBottomSheetProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) setName("");
  }, [isOpen]);

  const trimmed = name.trim();
  const isValid = trimmed.length > 0;

  const handleSubmit = () => {
    if (!isValid || isSubmitting) return;
    onSubmit?.(trimmed);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="이름 수정"
      footer={
        <div className="flex gap-2 px-5 py-4">
          <span className="flex-1">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
          </span>
          <span className="flex-[2]">
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!isValid}
              loading={isSubmitting}
            >
              {isSubmitting ? "수정 중…" : "수정"}
            </Button>
          </span>
        </div>
      }
    >
      <div className="px-5 pt-6 pb-10">
        <p className="text-sm font-bold text-gray-900 mb-2">이름</p>
        <Input
          variant="register"
          placeholder="이름을 입력해주세요."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
    </BottomSheet>
  );
}
