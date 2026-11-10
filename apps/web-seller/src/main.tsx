import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/apps/web-seller/App.tsx";
import { initSentry } from "@/apps/web-seller/common/config/sentry.config";
import { installChunkReload } from "@/apps/web-seller/common/utils/chunk-reload.util";
import "@/apps/web-seller/common/styles/globals.css";

initSentry();
// 새 버전 배포 뒤 옛 화면 조각을 못 받으면 한 번 새로고침
installChunkReload();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
