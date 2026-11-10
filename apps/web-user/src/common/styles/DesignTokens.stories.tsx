import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  colors,
  customerFontSize,
  customerRadius,
  motionDuration,
  motionEasing,
  motionStaggerMs,
} from "@picake/design-tokens";

/**
 * 손님 화면 디자인 값 모음 (packages/design-tokens).
 * tailwind 이름(`bg-gray-900`, `text-sm`, `rounded-xl` …)과 실제 값을 한눈에 본다.
 * 이 파일은 tailwind가 읽는 src 안에 있어 화면 CSS에 클래스가 더해지지 않도록 style 속성만 쓴다.
 */
const meta: Meta = {
  title: "Common/디자인 값",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
손님 웹(web-user)과 정보 사이트(web-info)가 같이 쓰는 디자인 값입니다. 값은 \`packages/design-tokens\`에 있습니다.

- 새 화면은 글자 크기 숫자(15px)나 색 코드(#FF653E)를 클래스 대괄호 안에 직접 쓰지 않고 여기 있는 이름을 씁니다.
- 판매자 휴대폰 화면은 손님 화면보다 한 단계 작은 자기 값을 씁니다(web-seller Storybook "판매자 앱/부품").
- 움직임 시간·곡선은 두 앱이 같이 씁니다(\`duration-base\`, \`ease-enter\`, \`animate-sheet-in\` …).
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const ink = colors.gray[900];
const sub = colors.gray[600];
const line = colors.gray[100];

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ margin: "24px 0 12px", fontSize: 16, fontWeight: 700, color: ink }}>{children}</h3>
  );
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ width: 120 }}>
      <div
        style={{ height: 48, borderRadius: 8, background: value, border: `1px solid ${line}` }}
      />
      <div style={{ marginTop: 6, fontSize: 12, lineHeight: "16px", color: ink }}>{name}</div>
      <div style={{ fontSize: 12, lineHeight: "16px", color: sub }}>{value}</div>
    </div>
  );
}

export const 색: Story = {
  render: () => (
    <div>
      {Object.entries(colors).map(([group, shades]) => (
        <section key={group}>
          <Title>{group}</Title>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {Object.entries(shades).map(([shade, value]) => (
              <Swatch
                key={shade}
                name={shade === "DEFAULT" ? group : `${group}-${shade}`}
                value={value}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
};

export const 글자_크기: Story = {
  name: "글자 크기",
  render: () => (
    <div>
      {Object.entries(customerFontSize).map(([name, [size, lineHeight]]) => (
        <div
          key={name}
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            padding: "8px 0",
            borderBottom: `1px solid ${line}`,
          }}
        >
          <span style={{ width: 160, fontSize: 12, color: sub }}>
            text-{name} · {size} / {lineHeight}
          </span>
          <span style={{ fontSize: size, lineHeight, color: ink }}>
            오늘 픽업할 케이크를 골라요
          </span>
        </div>
      ))}
    </div>
  ),
};

export const 모서리: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      {Object.entries(customerRadius).map(([name, value]) => (
        <div key={name} style={{ width: 96 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: value,
              background: colors.primary[50],
              border: `1px solid ${colors.primary[200]}`,
            }}
          />
          <div style={{ marginTop: 6, fontSize: 12, color: ink }}>
            {name === "DEFAULT" ? "rounded" : `rounded-${name}`}
          </div>
          <div style={{ fontSize: 12, color: sub }}>{value}</div>
        </div>
      ))}
    </div>
  ),
};

/** 움직임: 눌러서 곡선마다 같은 거리를 움직여 본다 */
function EasingRow({ name, value }: { name: string; value: string }) {
  const dot = React.useRef<HTMLDivElement>(null);
  const play = () =>
    dot.current?.animate([{ transform: "translateX(0)" }, { transform: "translateX(220px)" }], {
      duration: motionDuration.slower,
      easing: value,
      fill: "both",
    });
  return (
    <button
      type="button"
      onClick={play}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        width: "100%",
        padding: "10px 0",
        border: "none",
        borderBottom: `1px solid ${line}`,
        background: "none",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ width: 220, fontSize: 12, color: sub }}>
        ease-{name} · {value}
      </span>
      <span style={{ position: "relative", width: 240, height: 20 }}>
        <div
          ref={dot}
          style={{ width: 20, height: 20, borderRadius: 10, background: colors.primary.DEFAULT }}
        />
      </span>
    </button>
  );
}

export const 움직임: Story = {
  render: () => (
    <div>
      <Title>시간 (duration-이름)</Title>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {Object.entries(motionDuration).map(([name, value]) => (
          <div key={name} style={{ width: 120, fontSize: 12, color: ink }}>
            duration-{name}
            <div style={{ color: sub }}>{value}ms</div>
          </div>
        ))}
        <div style={{ width: 160, fontSize: 12, color: ink }}>
          줄 사이(차례로)
          <div style={{ color: sub }}>{motionStaggerMs}ms</div>
        </div>
      </div>
      <Title>곡선 (줄을 눌러 보기)</Title>
      {Object.entries(motionEasing).map(([name, value]) => (
        <EasingRow key={name} name={name} value={value} />
      ))}
    </div>
  ),
};
