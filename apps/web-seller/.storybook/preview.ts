import { createElement } from "react";
import type { Preview } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../src/common/styles/globals.css";

// 아래 탭(채팅 숫자)처럼 서버 숫자를 읽는 부품도 그릴 수 있게. 이야기에서는 서버를 부르지 않는다
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, enabled: false } },
});

const preview: Preview = {
  decorators: [
    (Story) => createElement(QueryClientProvider, { client: queryClient }, createElement(Story)),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      test: "todo",
    },
  },
};

export default preview;
