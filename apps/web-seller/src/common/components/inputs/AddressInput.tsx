import React, { useState, useEffect } from "react";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { BaseInput as Input } from "@/apps/web-seller/common/components/inputs/BaseInput";
import { Label } from "@/apps/web-seller/common/components/labels/Label";
import { openAddressSearch } from "@/apps/web-seller/common/utils/kakao-address.util";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { AddressSearchSheet } from "@/apps/web-seller/common/components/inputs/AddressSearchSheet";
import type { StoreAddressDto } from "@/apps/web-seller/features/store/types/store.dto";

interface AddressInputProps {
  required?: boolean;
  value: Omit<StoreAddressDto, "detailAddress">;
  onChange: (data: Omit<StoreAddressDto, "detailAddress">) => void;
  error?: string;
}

/**
 * 카카오 주소 검색을 사용하는 주소 입력 컴포넌트
 * Daum 우편번호 서비스를 사용하여 주소를 검색하고 선택할 수 있습니다.
 * PC는 새 창, 휴대폰 화면(휴대폰 틀 안, 앱 웹뷰 포함)은 화면 안 창(AddressSearchSheet, SC-67)으로 연다.
 */
export const AddressInput: React.FC<AddressInputProps> = ({
  required = true,
  value,
  onChange,
  error,
}) => {
  const [displayAddress, setDisplayAddress] = useState<string>("");
  const inFrame = useInMobileFrame();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    // 도로명 주소가 있으면 도로명 주소를, 없으면 지번 주소를 표시
    setDisplayAddress(value.roadAddress || value.address || "");
  }, [value]);

  const apply = (data: Omit<StoreAddressDto, "detailAddress">) =>
    onChange({
      address: data.address,
      roadAddress: data.roadAddress,
      zonecode: data.zonecode,
      latitude: data.latitude,
      longitude: data.longitude,
    });

  const handleAddressSearch = async () => {
    if (inFrame) {
      setSheetOpen(true);
      return;
    }
    await openAddressSearch(apply);
  };

  return (
    <div className="space-y-2">
      <Label className={required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ""}>
        스토어 주소
      </Label>
      <div className="flex gap-2">
        <Input
          placeholder="주소 검색을 눌러 골라 주세요"
          value={displayAddress}
          readOnly
          className={error ? "border-destructive" : ""}
        />
        {/* 휴대폰 틀 안: 입력 칸 바로 옆 버튼은 칸과 같은 48(디자인 기준 Field) */}
        <Button
          type="button"
          variant="outline"
          size={inFrame ? "lg" : undefined}
          onClick={handleAddressSearch}
        >
          주소 검색
        </Button>
      </div>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      {inFrame ? (
        <AddressSearchSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSelect={apply} />
      ) : null}
    </div>
  );
};
