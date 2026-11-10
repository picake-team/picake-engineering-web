import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { OptionRow, useScrollSelectedIntoView } from "@/apps/web-seller/common/ui/OptionSheet";

/*
 * 휴대폰 틀(MobileFrame) 안에서는 PC 펼침 목록 대신 앱 목록 창(OptionSheet와 같은 모양)으로 고른다.
 * 쓰는 쪽 코드(Select · SelectTrigger · SelectValue · SelectContent · SelectItem)는 PC와 같다.
 * 창 제목은 Select의 sheetTitle(없으면 "골라 주세요").
 */
interface FrameSelectState {
  value: string | undefined;
  pick: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled: boolean;
  title: string;
  labels: Record<string, React.ReactNode>;
  register: (value: string, label: React.ReactNode) => void;
}

const FrameSelectContext = React.createContext<FrameSelectState | null>(null);
/** 닫혀 있을 때 숨겨 그린 목록: 줄은 이름만 알려 주고 보이지 않는다 */
const RegisterOnlyContext = React.createContext(false);

type SelectProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> & {
  /** 휴대폰 틀 안 목록 창 제목 */
  sheetTitle?: string;
};

function FrameSelectRoot({
  value: controlled,
  defaultValue,
  onValueChange,
  disabled = false,
  sheetTitle,
  children,
}: SelectProps) {
  const [inner, setInner] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [labels, setLabels] = React.useState<Record<string, React.ReactNode>>({});
  const value = controlled !== undefined ? controlled : inner;
  const register = React.useCallback((v: string, label: React.ReactNode) => {
    setLabels((prev) => (prev[v] === label ? prev : { ...prev, [v]: label }));
  }, []);
  const state: FrameSelectState = {
    value,
    pick: (v) => {
      if (controlled === undefined) setInner(v);
      onValueChange?.(v);
    },
    open,
    setOpen,
    disabled,
    title: sheetTitle ?? "골라 주세요",
    labels,
    register,
  };
  return <FrameSelectContext.Provider value={state}>{children}</FrameSelectContext.Provider>;
}

function Select({ sheetTitle, ...props }: SelectProps) {
  const inFrame = useInMobileFrame();
  if (inFrame) return <FrameSelectRoot sheetTitle={sheetTitle} {...props} />;
  return <SelectPrimitive.Root {...props} />;
}

const SelectValue = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Value>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>(({ placeholder, ...props }, ref) => {
  const frame = React.useContext(FrameSelectContext);
  if (frame) {
    const label = frame.value !== undefined ? frame.labels[frame.value] : undefined;
    return label !== undefined ? (
      <span className="min-w-0 truncate">{label}</span>
    ) : (
      <span className="min-w-0 truncate text-ink-500">{placeholder}</span>
    );
  }
  return <SelectPrimitive.Value ref={ref} placeholder={placeholder} {...props} />;
});
SelectValue.displayName = SelectPrimitive.Value.displayName;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    className?: string;
    children?: React.ReactNode;
  }
>(({ className, children, ...props }, ref) => {
  // 휴대폰 틀 안: 고르는 칸도 입력 칸과 같은 48 · 모서리 12 · 15(디자인 A66b 은행·환불 규정)
  const inFrame = useInMobileFrame();
  const frame = React.useContext(FrameSelectContext);
  if (frame) {
    return (
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={props["aria-label"]}
        disabled={frame.disabled || props.disabled}
        onClick={() => frame.setOpen(true)}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-2 rounded-control border border-ink-200 bg-white px-4 text-left font-app text-body text-ink-900 focus-visible:border-[1.5px] focus-visible:border-ink-900 focus-visible:outline-none disabled:bg-ink-50 disabled:text-ink-600",
          className,
        )}
      >
        {children}
        <ChevronDown aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-ink-600" />
      </button>
    );
  }
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        inFrame &&
          "h-12 rounded-control border-ink-200 bg-white px-4 font-app text-body text-ink-900 shadow-none focus:border-[1.5px] focus:border-ink-900 focus:ring-0",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown
          className={cn(
            "h-4 w-4 opacity-50",
            inFrame && "h-[18px] w-[18px] text-ink-600 opacity-100",
          )}
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton> & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton> & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    className?: string;
    children?: React.ReactNode;
  }
>(({ className, children, position = "popper", ...props }, ref) => {
  const frame = React.useContext(FrameSelectContext);
  if (frame) return <FrameSelectContent frame={frame}>{children}</FrameSelectContent>;
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
          )}
        >
          {children as React.ReactNode}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

function FrameSelectContent({
  frame,
  children,
}: {
  frame: FrameSelectState;
  children?: React.ReactNode;
}) {
  const listRef = useScrollSelectedIntoView(frame.open, frame.value);
  return (
    <>
      {/* 닫혀 있어도 줄 이름을 알아야 칸에 고른 값을 보인다 */}
      <RegisterOnlyContext.Provider value>
        <div hidden>{children}</div>
      </RegisterOnlyContext.Provider>
      <BottomSheet
        open={frame.open}
        onClose={() => frame.setOpen(false)}
        showClose
        title={frame.title}
      >
        <div
          ref={listRef}
          role="radiogroup"
          aria-label={frame.title}
          className="-mt-2 flex flex-col"
        >
          {children}
        </div>
      </BottomSheet>
    </>
  );
}

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const frame = React.useContext(FrameSelectContext);
  const registerOnly = React.useContext(RegisterOnlyContext);
  const register = frame?.register;
  React.useEffect(() => {
    if (register && registerOnly) register(props.value, children);
  }, [register, registerOnly, props.value, children]);
  if (frame) {
    if (registerOnly) return null;
    return (
      <OptionRow
        selected={frame.value === props.value}
        disabled={props.disabled}
        onClick={() => {
          frame.pick(props.value);
          frame.setOpen(false);
        }}
      >
        {children}
      </OptionRow>
    );
  }
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;

export {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
