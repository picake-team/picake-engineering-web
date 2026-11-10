import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/apps/web-seller/common/components/selects/Select";
import { Label } from "@/apps/web-seller/common/components/labels/Label";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export interface SelectBoxProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  error?: string;
  required?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
}

export const SelectBox: React.FC<SelectBoxProps> = ({
  label,
  value,
  onChange,
  options,
  error,
  required = false,
  fullWidth = true,
  disabled = false,
}) => {
  return (
    <div className={fullWidth ? "w-full" : ""}>
      <Label className={required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ""}>
        {label}
      </Label>
      <Select
        sheetTitle={label}
        value={value === "" ? undefined : value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger className={error ? "border-destructive" : ""}>
          <SelectValue placeholder={`${label} 고르기`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
};
