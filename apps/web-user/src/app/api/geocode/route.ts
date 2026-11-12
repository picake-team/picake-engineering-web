import { NextRequest, NextResponse } from "next/server";

const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || "";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const latitude = searchParams.get("latitude");
  const longitude = searchParams.get("longitude");

  const lat = Number(latitude);
  const lng = Number(longitude);
  // 숫자가 아닌 값이 카카오 주소에 그대로 붙지 않게(다른 파라미터를 끼워 넣지 못하게) 숫자만 받는다
  if (!latitude || !longitude || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "latitude, longitude 파라미터가 필요합니다." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      // 우리나라 밖 좌표(해외·에뮬레이터 기본 위치)는 오류가 아니라 "지역 없음"(운영 오류 기록에 남던 것, 11-12)
      if (response.status === 400 && errorData?.code === -2) {
        return NextResponse.json({ documents: [] });
      }
      console.error("카카오 API 호출 실패:", response.status, errorData);
      return NextResponse.json(
        { error: "카카오 API 호출 실패", status: response.status, detail: errorData },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("역지오코딩 API 오류:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
