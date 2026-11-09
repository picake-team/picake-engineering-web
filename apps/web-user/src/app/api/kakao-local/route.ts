import { NextRequest, NextResponse } from "next/server";

/**
 * 견적 요청서(기획 I-46)의 동네·가게 찾기용 카카오 로컬 검색.
 * 키는 서버에만 두고, 화면은 필요한 값만 받는다. 기기 좌표는 동네로 바꾸는 데만 쓰고 저장하지 않는다.
 *
 * - type=area&query=연남동            → 동네 목록(이름·시도·중심 좌표)
 * - type=coord&latitude=&longitude=  → 그 좌표의 동네(중심 좌표로 바꿔서 돌려줌)
 * - type=place&query=&latitude=&longitude= → 가게(카카오 장소) 목록, 좌표가 있으면 가까운 순
 * - type=count&latitude=&longitude=&radius= → 반경 안 "주문제작 케이크" 가게 수(대략)
 */
const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || "";
const KAKAO_LOCAL = "https://dapi.kakao.com/v2/local";
const PLACE_KEYWORD = "주문제작 케이크";

/** 카카오가 긴 이름으로 주는 시·도를 앱에서 쓰는 짧은 이름으로 */
const SIDO_SHORT: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원",
  강원도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전북특별자치도: "전북",
  전라북도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};
const shortSido = (name: string) => SIDO_SHORT[name] ?? name;

async function kakao(path: string, params: Record<string, string>) {
  const url = `${KAKAO_LOCAL}${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`kakao ${path} ${res.status}`);
  return res.json();
}

type KakaoAddressDoc = {
  address_name: string;
  address_type: string;
  x: string;
  y: string;
  address?: {
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
    region_3depth_h_name: string;
  } | null;
};

type KakaoRegionDoc = {
  region_type: string;
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  x: number;
  y: number;
};

type KakaoPlaceDoc = {
  id: string;
  place_name: string;
  road_address_name: string;
  address_name: string;
  x: string;
  y: string;
  phone: string;
  place_url: string;
};

/** 검색어는 50자까지, 좌표는 한국 근처 숫자만 받는다(키를 다른 용도로 쓰지 못하게) */
const cleanQuery = (q: string | null) => (q || "").trim().slice(0, 50);
const isCoord = (lat: string | null, lng: string | null) => {
  const a = Number(lat);
  const b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && a > 30 && a < 45 && b > 120 && b < 135;
};

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const type = p.get("type");

  try {
    if (type === "area") {
      const query = cleanQuery(p.get("query"));
      if (!query) return NextResponse.json({ items: [] });
      const data = await kakao("/search/address.json", { query, size: "10" });
      const items = (data.documents as KakaoAddressDoc[])
        .filter((d) => d.address_type === "REGION" && d.address)
        .map((d) => {
          const a = d.address!;
          const name = a.region_3depth_name || a.region_3depth_h_name || a.region_2depth_name;
          return {
            name,
            fullName: d.address_name,
            sido: shortSido(a.region_1depth_name),
            latitude: Number(d.y),
            longitude: Number(d.x),
          };
        })
        .filter((item) => item.name);
      return NextResponse.json({ items });
    }

    if (type === "coord") {
      const latitude = p.get("latitude");
      const longitude = p.get("longitude");
      if (!isCoord(latitude, longitude)) return NextResponse.json({ items: [] }, { status: 400 });
      const data = await kakao("/geo/coord2regioncode.json", { x: longitude!, y: latitude! });
      const doc = (data.documents as KakaoRegionDoc[]).find((d) => d.region_type === "B");
      const items = doc
        ? [
            {
              name: doc.region_3depth_name || doc.region_2depth_name,
              fullName: doc.address_name,
              sido: shortSido(doc.region_1depth_name),
              latitude: Number(doc.y),
              longitude: Number(doc.x),
            },
          ]
        : [];
      return NextResponse.json({ items });
    }

    if (type === "place") {
      const query = cleanQuery(p.get("query"));
      if (!query) return NextResponse.json({ items: [] });
      const latitude = p.get("latitude");
      const longitude = p.get("longitude");
      const params: Record<string, string> = { query, size: "15" };
      if (isCoord(latitude, longitude)) {
        params.x = longitude!;
        params.y = latitude!;
        params.sort = "distance";
      }
      const data = await kakao("/search/keyword.json", params);
      const items = (data.documents as KakaoPlaceDoc[]).map((d) => ({
        kakaoPlaceId: d.id,
        name: d.place_name,
        address: d.road_address_name || d.address_name,
        latitude: Number(d.y),
        longitude: Number(d.x),
        phone: d.phone,
        placeUrl: d.place_url,
      }));
      return NextResponse.json({ items });
    }

    if (type === "count") {
      const latitude = p.get("latitude");
      const longitude = p.get("longitude");
      const radius = Math.min(Math.max(Number(p.get("radius")) || 3000, 100), 20000);
      if (!isCoord(latitude, longitude)) return NextResponse.json({ count: null }, { status: 400 });
      const data = await kakao("/search/keyword.json", {
        query: PLACE_KEYWORD,
        x: longitude!,
        y: latitude!,
        radius: String(Math.round(radius)),
        size: "1",
      });
      return NextResponse.json({ count: data.meta?.total_count ?? null });
    }

    return NextResponse.json({ error: "type이 필요합니다." }, { status: 400 });
  } catch (error) {
    console.error("카카오 로컬 검색 오류:", error);
    return NextResponse.json(
      { items: [], count: null, error: "검색하지 못했어요." },
      { status: 502 },
    );
  }
}
