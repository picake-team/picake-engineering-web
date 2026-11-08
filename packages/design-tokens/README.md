# @picake/design-tokens

Picake 웹 앱들이 같이 쓰는 디자인 값입니다(2026-11-08). 빌드하지 않는 TS 패키지라, 쓰는 쪽(tailwind 설정·Vite·Storybook)이 `src/index.ts`를 그대로 읽습니다. 값은 모두 `src/index.ts` 한 파일에 있습니다(Storybook이 tailwind 설정을 Node로 읽을 때 확장자 없는 상대 import를 경고해서 나누지 않음).

## 무엇이 들어 있나

| 이름                                                   | 내용                                                                                     | 쓰는 앱                                                                                        |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `colors`                                               | Picake 색 원본 (`gray`, `primary`, `blue`, `green`, `red`, `yellow` …)                   | web-user, web-info (tailwind 색 이름 그대로), web-seller (`ink-*`·`brand`가 이 값을 가져다 씀) |
| `customerPreset` (`customerFontSize`·`customerRadius`) | 손님 화면 tailwind preset: 글자 크기 8개, 모서리, 색, 움직임(accordion·slide-up·탭 전환) | web-user, web-info                                                                             |

넣지 않은 것과 이유:

- **판매자 휴대폰 화면 값**(글자 `text-title`…, 모서리 `rounded-control`…, 판매자만 쓰는 색 #767672·#8C8C88·#B5401C)은 손님 화면보다 한 단계 작게 정한 판매자 앱 값이라 `apps/web-seller/src/common/ui/tokens.ts`에 둡니다.
- **부품(버튼·입력 칸 등)**은 앱마다 크기·규칙이 다르고 React 버전도 다릅니다(web-user 19, web-seller 18). 각 앱에 둡니다.
- **글꼴**은 web-user·web-info가 `globals.css`의 `body`에서 정합니다(CSS라 여기서 가져갈 수 없음).

**규칙: 두 앱 이상이 같은 값을 쓸 때만 여기에 둡니다.** 한 앱만 쓰는 값은 그 앱에 둡니다.

## 쓰는 법

```ts
// apps/web-user/tailwind.config.ts
import { customerPreset } from "@picake/design-tokens";

const config: Config = {
  presets: [customerPreset],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  // content·safelist·plugins는 앱마다 다르니 앱 설정에 둔다
};
```

```ts
// 코드에서 색 값이 필요할 때 (예: web-seller common/ui/tokens.ts, 아이콘 색)
import { colors } from "@picake/design-tokens";
colors.gray[900]; // "#1F1F1E"
```

값과 tailwind 이름은 web-user Storybook **"Common/디자인 값"**(`yarn web-user:storybook`)에서 한눈에 봅니다.

## 값을 바꿀 때

- 여기 값을 바꾸면 **web-user·web-info·web-seller 화면이 같이 바뀝니다.** 세 앱을 모두 빌드해 확인합니다.
- 새 앱이 이 패키지를 쓰려면 그 앱 `package.json`에 `"@picake/design-tokens": "workspace:*"`를 더합니다(`corepack yarn workspace @picake/<앱> add "@picake/design-tokens@workspace:*"`).
- 이 패키지가 바뀌면 PR 검사(`test-web`)가 test가 있는 모든 앱(web-user·web-seller·web-info)을 돌립니다.
- Next 앱의 화면 코드(Storybook 말고)에서 직접 import한 적은 아직 없습니다. 처음 쓸 때 `next build`로 확인하고, TS를 못 읽으면 `next.config.ts`의 `transpilePackages`에 더합니다.
