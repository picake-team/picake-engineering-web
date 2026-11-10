import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Common/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
공통 버튼 컴포넌트

## 기본 스타일
- **너비**: 100% (부모 요소에서 크기 조절)
- **패딩**: 좌우 10px
- **폰트**: bold
- **모서리**: rounded-xl (12px)
- **트랜지션**: 200ms

## 사용 예시
\`\`\`tsx
// 기본 버튼
<Button>확인</Button>

// 50% 버튼 2개 (wrapper로 크기 조절)
<div className="flex gap-[8px]">
  <span className="w-1/2"><Button variant="outline">취소</Button></span>
  <span className="w-1/2"><Button>확인</Button></span>
</div>

// flex 레이아웃
<div className="flex gap-[8px]">
  <span className="w-[100px]"><Button variant="outline">취소</Button></span>
  <span className="flex-1"><Button>선택완료</Button></span>
</div>
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
  args: {
    children: "버튼",
  },
  argTypes: {
    variant: {
      options: ["primary", "secondary", "outline"],
      control: { type: "select" },
      description: "버튼 스타일",
      table: {
        defaultValue: { summary: "primary" },
      },
    },
    size: {
      options: ["sm", "md", "lg"],
      control: { type: "select" },
      description: "버튼 크기 (sm: 40px, md: 48px, lg: 52px)",
      table: {
        defaultValue: { summary: "lg" },
      },
    },
    disabled: {
      control: { type: "boolean" },
      description: "비활성화 여부",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "300px" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Button>;

// ==================== 기본 ====================

export const Default: Story = {
  args: {
    children: "Btn",
  },
};

// ==================== Variant ====================

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Btn",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Btn",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline Btn",
  },
};

// ==================== Size ====================

export const SizeSmall: Story = {
  args: {
    size: "sm",
    children: "Small (40px)",
  },
};

export const SizeMedium: Story = {
  args: {
    size: "md",
    children: "Medium (48px)",
  },
};

export const SizeLarge: Story = {
  args: {
    size: "lg",
    children: "Large (52px)",
  },
};

// ==================== 레이아웃 예시 ====================

export const HalfWidthButtons: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "8px", width: "400px" }}>
      <span style={{ width: "50%" }}>
        <Button variant="outline">취소</Button>
      </span>
      <span style={{ width: "50%" }}>
        <Button>확인</Button>
      </span>
    </div>
  ),
};

export const FlexLayout: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "8px", width: "400px" }}>
      <span style={{ width: "100px" }}>
        <Button variant="outline">취소</Button>
      </span>
      <span style={{ flex: 1 }}>
        <Button>선택완료</Button>
      </span>
    </div>
  ),
};

export const ThreeButtons: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "8px", width: "400px" }}>
      <span style={{ flex: 1 }}>
        <Button variant="outline" size="sm">
          1
        </Button>
      </span>
      <span style={{ flex: 1 }}>
        <Button variant="secondary" size="sm">
          2
        </Button>
      </span>
      <span style={{ flex: 1 }}>
        <Button size="sm">3</Button>
      </span>
    </div>
  ),
};

// ==================== 상태 ====================

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "비활성화 버튼",
  },
};

/** 서버를 기다리는 중: 색은 그대로, 동그라미 + 글자, 다시 눌리지 않음 */
export const Loading: Story = {
  args: {
    loading: true,
    children: "보내는 중…",
  },
};

export const AllVariantsDisabled: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "8px", width: "400px" }}>
      <span style={{ flex: 1 }}>
        <Button variant="primary" disabled>
          Primary
        </Button>
      </span>
      <span style={{ flex: 1 }}>
        <Button variant="secondary" disabled>
          Secondary
        </Button>
      </span>
      <span style={{ flex: 1 }}>
        <Button variant="outline" disabled>
          Outline
        </Button>
      </span>
    </div>
  ),
};
