/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_NODE_ENV: string;
  readonly VITE_PUBLIC_API_DOMAIN: string;
  readonly VITE_PUBLIC_GOOGLE_CLIENT_ID: string;
  readonly VITE_PUBLIC_KAKAO_RESTAPI_KEY: string;
  /** 네이버 로그인 Client ID(손님과 같은 앱). 없으면 네이버 버튼을 숨긴다 */
  readonly VITE_PUBLIC_NAVER_CLIENT_ID?: string;
  readonly VITE_PUBLIC_GITHUB_SHA: string;
  readonly VITE_PUBLIC_POSTHOG_KEY: string;
  readonly VITE_PUBLIC_POSTHOG_HOST: string;
  readonly VITE_PUBLIC_SENTRY_DSN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
