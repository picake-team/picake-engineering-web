import fs from "node:fs";
import path from "node:path";
import { API, AUTH_DIR, AUTH_FILE, TEST_SELLER_REVIEW_CODE, WEB } from "./helpers";

/**
 * 사장님 심사용 로그인(테스트 코드)으로 출입증을 받아 브라우저 저장소(localStorage.accessToken)로 둔다.
 * 심사용 로그인은 예시 주문을 처음 상태로 되돌리므로 돌릴 때마다 같은 상태에서 시작한다.
 */
export default async function globalSetup() {
  const res = await fetch(`${API}/v1/seller/auth/review-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: TEST_SELLER_REVIEW_CODE }),
  });
  if (!res.ok) {
    throw new Error(
      `심사용 로그인 실패 ${res.status}: 서버에 SELLER_REVIEW_LOGIN_CODE_SHA256(테스트 코드)이 있는지, ` +
        "1시간 5번 한도에 걸리지 않았는지(서버를 다시 켜면 풀림) 확인해 주세요",
    );
  }
  const token: string = (await res.json()).data.accessToken;
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(path.join(AUTH_DIR, "token.txt"), token);
  fs.writeFileSync(
    AUTH_FILE,
    JSON.stringify({
      cookies: [],
      origins: [{ origin: WEB, localStorage: [{ name: "accessToken", value: token }] }],
    }),
  );
}
