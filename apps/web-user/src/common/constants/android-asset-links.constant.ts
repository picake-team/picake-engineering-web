import { NODE_ENV, type NodeEnv } from "@/apps/web-user/common/constants/environment.constants";

/**
 * Android App Links용 Digital Asset Links 설정.
 *
 * - 검증: `https://staging.picakes.com/.well-known/assetlinks.json`
 * - 상용: `https://picakes.com/.well-known/assetlinks.json`
 * - 알림톡 WL 버튼(`https://#{도메인}/order/...`)이 앱으로 열리려면
 *   해당 도메인에 이 파일이 노출되고, Android 앱의 intent-filter에 autoVerify가 있어야 합니다.
 *
 * `sha256_cert_fingerprints`에는 그 앱을 서명한 키의 SHA-256을 모두 넣습니다(하나라도 맞으면 됨).
 * - 상용: Play로 받는 앱은 Google이 다시 서명하므로 Play Console > 테스트 및 출시 > 설정 >
 *   앱 무결성 > 앱 서명의 "앱 서명 키 인증서" SHA-256(키를 바꾼 적이 있으면 이전 키도).
 *   업로드 키 지문이 아니다.
 * - 검증: 직접 만든 APK라 그 APK를 서명한 키(`apksigner verify --print-certs <apk>`로 확인).
 * 확인: 앱 레포 `docs/release.md` §2 "앱 링크 지문".
 */
export type AndroidAssetLinkStatement = {
  relation: ["delegate_permission/common.handle_all_urls"];
  target: {
    namespace: "android_app";
    package_name: string;
    sha256_cert_fingerprints: string[];
  };
};

/** 환경별 Android 패키지·서명 지문. 지문이 비어 있으면 해당 환경 응답에서 제외됩니다. */
export const ANDROID_ASSET_LINKS_BY_ENV: Record<
  typeof NODE_ENV.STAGING | typeof NODE_ENV.PRODUCTION,
  AndroidAssetLinkStatement[]
> = {
  [NODE_ENV.STAGING]: [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.pickage.package.staging",
        sha256_cert_fingerprints: [
          // 업로드 키(2026-11-24~, 앱 레포 key.properties가 있으면 검증 APK도 이 키로 서명)
          "D5:E6:9B:51:82:67:47:17:6A:5F:CF:96:9F:F5:88:70:E0:C2:F9:D6:77:4C:44:4E:29:B3:48:D8:DE:AC:50:B2",
          // 운영자 맥 debug 키(key.properties가 없던 때 만든 검증 APK — 2026-11-21 APK)
          "23:8D:90:B9:32:04:EF:0A:ED:C6:75:53:1D:BC:D3:DF:45:92:1A:6C:6A:01:4F:E9:34:39:0A:A9:28:D0:AF:95",
          // 예전부터 있던 지문(어느 키인지 기록 없음 — 남겨 둠)
          "26:C8:BC:50:8C:09:90:78:4B:0B:0F:2B:C1:5C:6C:A6:45:9E:41:91:36:74:19:CA:42:DF:F5:FC:20:AC:0E:CB",
        ],
      },
    },
  ],
  [NODE_ENV.PRODUCTION]: [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.pickage.package",
        sha256_cert_fingerprints: [
          // Play 앱 서명 키(지금, "기존 키") — 2026-11-25 Play Console 앱 서명 화면에서 확인
          "ED:CC:3C:91:71:CB:03:33:4A:83:30:2B:C2:93:4E:84:E5:81:7A:C3:F4:20:F0:AA:DF:88:AD:BC:15:7F:CF:14",
          // Play 앱 서명 키(지금, "양자 내성 암호화 키" 베타) — 같은 화면
          "69:AD:BB:DD:04:C1:78:37:2B:56:BA:8A:30:EA:67:E4:5A:E3:F9:89:C7:0F:F4:CD:D2:49:1D:F9:65:B0:AF:D2",
          // Play 앱 서명 키(이전, 2026-08-13 키 업그레이드 전) — 같은 화면의 "디지털 애셋 링크 JSON"이 권하는 지문
          "72:35:DD:39:8E:BD:EF:FA:35:65:E8:63:9E:68:78:BB:28:7D:EF:27:83:8F:9D:BD:D9:A3:46:6D:E6:23:6E:50",
          // 예전부터 있던 지문(Play 키들과 다름, 어느 키인지 기록 없음 — 남겨 둠)
          "B8:35:F0:0F:3F:4D:19:89:15:31:5D:E9:A0:02:30:D4:BD:F8:8D:EF:6B:40:7C:4C:16:AC:FB:1B:F4:9F:2F:8F",
        ],
      },
    },
  ],
};

/** `NEXT_PUBLIC_NODE_ENV` 기준으로 노출할 assetlinks 목록을 반환합니다. */
export function getAndroidAssetLinks(nodeEnv?: string | null): AndroidAssetLinkStatement[] {
  const env = (nodeEnv ?? process.env.NEXT_PUBLIC_NODE_ENV ?? "") as NodeEnv;
  const statements =
    env === NODE_ENV.PRODUCTION
      ? ANDROID_ASSET_LINKS_BY_ENV[NODE_ENV.PRODUCTION]
      : ANDROID_ASSET_LINKS_BY_ENV[NODE_ENV.STAGING];

  return statements.filter((statement) => statement.target.sha256_cert_fingerprints.length > 0);
}
