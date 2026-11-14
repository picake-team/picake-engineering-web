/**
 * 케이크 디자인 모음(기획 I-112) 처음 콘텐츠 36장. 사진은 public/images/designs/.
 * 상업 사용·수정이 되는 무료 사진(Unsplash·Pexels·Pixabay)이고, "사진에서 읽은 것"과 채울 값은
 * AI로 미리 읽어 운영자가 확인한다(2026-11-14). 순서가 추천순이다.
 */
import type { Design } from "@/apps/web-user/features/design/types/design.type";
import { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";

export const DESIGNS: Design[] = [
  {
    id: "christmas-wreath-lettering",
    name: "크리스마스 리스",
    occasions: [
      ProductCategoryType.LETTERING,
      ProductCategoryType.FAMILY,
      ProductCategoryType.FRIEND,
    ],
    style: "크리스마스",
    seasonal: "CHRISTMAS",
    image: {
      file: "christmas-wreath-lettering.jpg",
      thumb: "christmas-wreath-lettering-s.jpg",
      width: 720,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Frederick Shaw",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/6zzIeGsMSCc",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "흰색",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "윗면에 초록 크림 리스, 빨간 점 열매",
      },
      {
        label: "글자",
        value: '"Merry Christmas" · 빨간 필기체',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "흰 크림",
      decoration: "초록 크림 리스와 빨간 점 열매",
      lettering: '빨간 필기체 "Merry Christmas" 레터링',
    },
    description:
      '사진처럼 흰 크림 원형 케이크 윗면에 초록 크림으로 리스를 짜고 빨간 점 열매를 올려 주세요. 옆에 빨간 필기체로 "Merry Christmas"라고 써 주세요.',
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '리스는 초록 짜기로, 글씨는 빨간색'이라고 적으면 사진에 더 가까워요",
    magazine: {
      order: 1,
      title: "크리스마스엔\n초록 리스",
      subtitle: "12월 예약은 미리 해 두세요",
    },
  },
  {
    id: "baegil-gold-lettering",
    name: "백일 레터링",
    occasions: [
      ProductCategoryType.FAMILY,
      ProductCategoryType.LETTERING,
      ProductCategoryType.ANNIVERSARY,
    ],
    style: "레터링",
    seasonal: null,
    image: {
      file: "baegil-gold-lettering.jpg",
      thumb: "baegil-gold-lettering-s.jpg",
      width: 720,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Caitlyn Way",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/j9deGo-PrNs",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "흰색",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "흰 장미 2송이와 짙은 초록 잎, 아래 흰 리본",
      },
      {
        label: "글자",
        value: '"백일" · 금색 세로 글씨',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "흰 바탕",
      decoration: "흰 장미 두 송이와 짙은 초록 잎",
      lettering: '금색 "백일" 세로 글씨',
    },
    description:
      '사진처럼 흰 원형 케이크 윗면 오른쪽에 금색으로 "백일"을 세로로 크게 써 주시고, 왼쪽에 흰 장미 두 송이와 짙은 초록 잎을 올려 주세요.',
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '글씨는 금색으로 크게, 세로로'라고 적으면 사진에 더 가까워요",
    magazine: {
      order: 2,
      title: "한글 레터링\n백일 케이크",
      subtitle: "백일·돌 글자만 바꿔서",
    },
  },
  {
    id: "vintage-pastel-rose",
    name: "파스텔 빈티지",
    occasions: [
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.FLOWER,
      ProductCategoryType.FRIEND,
    ],
    style: "빈티지",
    seasonal: null,
    image: {
      file: "vintage-pastel-rose.jpg",
      thumb: "vintage-pastel-rose-s.jpg",
      width: 918,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Beyza",
      site: "Pexels",
      pageUrl:
        "https://www.pexels.com/photo/vintage-floral-cake-on-rustic-background-with-candles-31009128/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "연노랑",
      },
      {
        label: "테두리",
        value: "윗면 하늘색 물결 테두리, 옆면 늘어진 줄 장식과 진주",
      },
      {
        label: "장식",
        value: "가운데 분홍·보라 장미와 초록 잎, 옆면 작은 꽃 짜기",
      },
      {
        label: "글자",
        value: null,
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 빈티지 케이크",
      color: "연노랑 크림",
      decoration: "하늘색 물결 테두리와 가운데 분홍·보라 장미",
      lettering: null,
    },
    description:
      "사진처럼 연노랑 크림 원형 케이크 윗면 둘레를 하늘색 물결 테두리로 짜고, 가운데에 분홍·보라 장미와 초록 잎을 모아 주세요. 옆면은 늘어진 줄 장식과 작은 꽃으로 꾸며 주세요.",
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '테두리는 하늘색, 장미는 분홍과 보라'라고 적으면 사진에 더 가까워요",
    magazine: {
      order: 3,
      title: "레트로 감성\n빈티지 케이크",
      subtitle: "파스텔 짜기 테두리",
    },
  },
  {
    id: "heart-pink-number",
    name: "하트 빈티지",
    occasions: [
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.LOVER,
      ProductCategoryType.SIMPLE,
    ],
    style: "하트",
    seasonal: null,
    image: {
      file: "heart-pink-number.jpg",
      thumb: "heart-pink-number-s.jpg",
      width: 1080,
      height: 720,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Kurt Harvey",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/m4uypz8-zHU",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "하트 1단",
      },
      {
        label: "크림 색",
        value: "연분홍",
      },
      {
        label: "테두리",
        value: "연분홍 조개 모양 짜기(위·아래)",
      },
      {
        label: "장식",
        value: "분홍 진주 알갱이, 윗면 반짝이",
      },
      {
        label: "글자",
        value: '"18" · 분홍 숫자',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "하트 모양 케이크",
      color: "연분홍 크림",
      decoration: "연분홍 조개 짜기 테두리와 분홍 진주 알갱이",
      lettering: '분홍 숫자 "18"',
    },
    description:
      '사진처럼 연분홍 크림 하트 모양 케이크 위아래 둘레를 연분홍 조개 모양으로 짜고 분홍 진주 알갱이를 올려 주세요. 윗면 가운데에 분홍색으로 "18"만 작게 넣어 주세요.',
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '숫자만 작게 가운데'라고 적으면 사진에 더 가까워요",
    magazine: {
      order: 4,
      title: "하트 모양\n빈티지",
      subtitle: "숫자 하나로 충분해요",
    },
  },
  {
    id: "bento-heart-dots-lettering",
    name: "하트 점 도시락",
    occasions: [
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.FRIEND,
      ProductCategoryType.LETTERING,
    ],
    style: "도시락",
    seasonal: null,
    image: {
      file: "bento-heart-dots-lettering.jpg",
      thumb: "bento-heart-dots-lettering-s.jpg",
      width: 810,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "sswwwetta",
      site: "Pexels",
      pageUrl: "https://www.pexels.com/photo/birthday-cake-in-box-16966131/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 도시락 케이크",
      },
      {
        label: "크림 색",
        value: "흰색",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "빨간 작은 하트 점",
      },
      {
        label: "글자",
        value: '"happy birthday" · 검은 필기체',
      },
      {
        label: "초·토퍼",
        value: "은색 초 1개(뚜껑 안)",
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "도시락 케이크",
      color: "흰 크림",
      decoration: "빨간 작은 하트 점",
      lettering: '검은 필기체 "happy birthday" 레터링',
    },
    description:
      '사진처럼 흰 크림 도시락 케이크 윗면에 검은 필기체로 "happy birthday"를 쓰고, 둘레에 빨간 작은 하트를 점처럼 찍어 주세요.',
    size: "LUNCHBOX",
    creams: [],
    requestNote: "사진처럼 초 1개",
    tip: "가게에 '하트는 빨간 점처럼 작게'라고 적으면 사진에 더 가까워요",
    magazine: {
      order: 5,
      title: "혼자 먹기 좋은\n도시락 케이크",
      subtitle: "1~2명이 딱 좋아요",
    },
  },
  {
    id: "strawberry-cream-garland",
    name: "딸기 빈티지",
    occasions: [
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.FAMILY,
      ProductCategoryType.SIMPLE,
    ],
    style: "딸기",
    seasonal: null,
    image: {
      file: "strawberry-cream-garland.jpg",
      thumb: "strawberry-cream-garland-s.jpg",
      width: 720,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Dana Garcia",
      site: "Pexels",
      pageUrl: "https://www.pexels.com/photo/32397279/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단(높은 편)",
      },
      {
        label: "크림 색",
        value: "아이보리",
      },
      {
        label: "테두리",
        value: "윗면 흰 크림 짜기, 옆면 흰 줄 장식, 아래 흰 구슬",
      },
      {
        label: "장식",
        value: "윗면에 딸기 4개",
      },
      {
        label: "글자",
        value: "윗면에 작은 금색 글씨 · 내용은 안 보임",
      },
      {
        label: "초·토퍼",
        value: "금색 긴 초 1개",
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "아이보리 크림",
      decoration: "흰 크림 테두리와 옆면 줄 장식, 딸기",
      lettering: null,
    },
    description:
      "사진처럼 아이보리 크림 원형 케이크 윗면 둘레를 흰 크림으로 짜고 딸기를 올려 주세요. 옆면은 흰 크림 줄을 늘어뜨리고 아래는 구슬 모양으로 둘러 주세요.",
    size: null,
    creams: [],
    requestNote: "사진처럼 초 1개",
    tip: "가게에 '옆면은 흰 크림 줄 장식으로'라고 적으면 사진에 더 가까워요",
    magazine: {
      order: 6,
      title: "언제나 옳은\n딸기 생크림",
      subtitle: "흰 크림에 딸기 몇 알",
    },
  },
  {
    id: "mint-cherry-piping",
    name: "민트 체리",
    occasions: [
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.FRIEND,
      ProductCategoryType.SIMPLE,
    ],
    style: "체리",
    seasonal: null,
    image: {
      file: "mint-cherry-piping.jpg",
      thumb: "mint-cherry-piping-s.jpg",
      width: 720,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Los Muertos Crew",
      site: "Pexels",
      pageUrl: "https://www.pexels.com/photo/a-cake-with-cherries-8478058/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "연민트",
      },
      {
        label: "테두리",
        value: "아래 연분홍 크림 짜기",
      },
      {
        label: "장식",
        value: "윗면 연분홍 크림 짜기와 체리 5개",
      },
      {
        label: "글자",
        value: null,
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "연민트 크림",
      decoration: "연분홍 크림 짜기와 체리",
      lettering: null,
    },
    description:
      "사진처럼 연민트 크림 원형 케이크 윗면에 연분홍 크림을 동그랗게 짜고 그 위에 체리를 올려 주세요. 아래 둘레도 연분홍 크림으로 짜 주세요.",
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '민트 바탕에 분홍 짜기, 체리는 꼭지째'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "pink-frill-lettering",
    name: "분홍 프릴",
    occasions: [
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.LETTERING,
      ProductCategoryType.FRIEND,
    ],
    style: "레터링",
    seasonal: null,
    image: {
      file: "pink-frill-lettering.jpg",
      thumb: "pink-frill-lettering-s.jpg",
      width: 608,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Zeynep Ladin Üstündağ",
      site: "Pexels",
      pageUrl: "https://www.pexels.com/photo/elegant-pink-birthday-cake-with-white-icing-29192489/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단(높은 편)",
      },
      {
        label: "크림 색",
        value: "흰색",
      },
      {
        label: "테두리",
        value: "연분홍 프릴 짜기(위·아래)",
      },
      {
        label: "장식",
        value: null,
      },
      {
        label: "글자",
        value: '"Happy Birthday" · 갈색 필기체',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "흰 크림",
      decoration: "연분홍 프릴 테두리",
      lettering: '갈색 필기체 "Happy Birthday" 레터링',
    },
    description:
      '사진처럼 흰 크림 원형 케이크 위아래 둘레를 연분홍 크림으로 프릴처럼 두툼하게 짜 주시고, 가운데에 갈색 필기체로 "Happy Birthday"라고 써 주세요.',
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '테두리는 연분홍 프릴로 두툼하게'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "rose-piping-top",
    name: "장미 플라워",
    occasions: [
      ProductCategoryType.FLOWER,
      ProductCategoryType.FAMILY,
      ProductCategoryType.BIRTHDAY,
    ],
    style: "플라워",
    seasonal: null,
    image: {
      file: "rose-piping-top.jpg",
      thumb: "rose-piping-top-s.jpg",
      width: 1080,
      height: 733,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Liana S",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/2pYoY2dsh9M",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "흰색",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "윗면 가운데 진분홍 장미와 초록 잎 한 묶음, 옆면 둘레 장미, 흰 진주 알갱이",
      },
      {
        label: "글자",
        value: null,
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "흰 크림",
      decoration: "가운데 진분홍 장미 묶음과 초록 잎, 옆면 장미",
      lettering: null,
    },
    description:
      "사진처럼 흰 크림 원형 케이크 윗면 가운데에 진분홍 장미와 초록 잎을 한 묶음으로 짜 주시고, 옆면 둘레에도 장미와 잎을 둘러 주세요.",
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '장미는 진분홍, 잎은 초록 짜기로'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "cherry-happy-day",
    name: "체리 그림",
    occasions: [
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.FRIEND,
      ProductCategoryType.LETTERING,
    ],
    style: "레터링",
    seasonal: null,
    image: {
      file: "cherry-happy-day.jpg",
      thumb: "cherry-happy-day-s.jpg",
      width: 1080,
      height: 607,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Yaqing Wei",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/aM2lAxNVQsM",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "흰색, 윗면 분홍 붓질",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "빨간 체리 그림(윗면·옆면)",
      },
      {
        label: "글자",
        value: '"Happy day" · 흰 필기체',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "흰 크림에 분홍 붓질",
      decoration: "빨간 체리 그림",
      lettering: '흰 필기체 "Happy day" 레터링',
    },
    description:
      '사진처럼 흰 크림 원형 케이크 윗면에 분홍 크림을 붓질하듯 바르고 흰 필기체로 "Happy day"를 써 주세요. 윗면과 옆면에 작은 빨간 체리를 그려 주세요.',
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '분홍은 붓질처럼, 체리는 작게 여러 개'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "carnation-pearl",
    name: "카네이션 진주",
    occasions: [
      ProductCategoryType.FLOWER,
      ProductCategoryType.FAMILY,
      ProductCategoryType.ANNIVERSARY,
    ],
    style: "플라워",
    seasonal: null,
    image: {
      file: "carnation-pearl.jpg",
      thumb: "carnation-pearl-s.jpg",
      width: 720,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "leyli sadeqian",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/CWburPtXtHM",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단(높은 편)",
      },
      {
        label: "크림 색",
        value: "흰색",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "분홍 카네이션·흰 꽃·안개꽃, 흰 진주 알갱이",
      },
      {
        label: "글자",
        value: null,
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "흰 크림",
      decoration: "분홍 카네이션과 안개꽃, 흰 진주 알갱이",
      lettering: null,
    },
    description:
      "사진처럼 흰 크림 원형 케이크 윗면 한쪽에 분홍 카네이션과 안개꽃을 모아 올리고 옆면에도 카네이션을 붙여 주세요. 흰 진주 알갱이를 흩뿌려 주세요.",
    size: null,
    creams: [],
    requestNote: "",
    tip: "꽃을 생화로 할지 크림으로 짤지 가게에 같이 적어 주세요",
    magazine: null,
  },
  {
    id: "heart-chapter-cherry",
    name: "체리 하트",
    occasions: [
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.LETTERING,
      ProductCategoryType.FRIEND,
    ],
    style: "하트",
    seasonal: null,
    image: {
      file: "heart-chapter-cherry.jpg",
      thumb: "heart-chapter-cherry-s.jpg",
      width: 825,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Beyza",
      site: "Pexels",
      pageUrl:
        "https://www.pexels.com/photo/heart-shaped-cake-with-cherry-garnish-and-chapter-30-28983230/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "하트 1단",
      },
      {
        label: "크림 색",
        value: "분홍",
      },
      {
        label: "테두리",
        value: "분홍 프릴 짜기",
      },
      {
        label: "장식",
        value: "빨간 체리, 흰 리본",
      },
      {
        label: "글자",
        value: '"Chapter 30" · 금색 필기체',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "하트 모양 케이크",
      color: "분홍 크림",
      decoration: "분홍 프릴 테두리와 빨간 체리, 흰 리본",
      lettering: '금색 필기체 "Chapter 30" 레터링',
    },
    description:
      '사진처럼 분홍 크림 하트 모양 케이크 둘레를 분홍 프릴로 짜고 빨간 체리와 흰 리본을 군데군데 올려 주세요. 가운데에 금색 필기체로 "Chapter 30"이라고 써 주세요.',
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '체리는 꼭지째, 리본은 흰색'이라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "black-ribbon-number",
    name: "검정 리본",
    occasions: [
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.FRIEND,
      ProductCategoryType.SIMPLE,
    ],
    style: "리본",
    seasonal: null,
    image: {
      file: "black-ribbon-number.jpg",
      thumb: "black-ribbon-number-s.jpg",
      width: 720,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Meryem Şahin",
      site: "Pexels",
      pageUrl:
        "https://www.pexels.com/photo/elegant-black-and-white-birthday-cake-in-istanbul-30637504/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "흰색",
      },
      {
        label: "테두리",
        value: "흰 조개 모양 짜기(위·아래), 옆면 검은 줄",
      },
      {
        label: "장식",
        value: "검정 리본 여러 개",
      },
      {
        label: "글자",
        value: '"29" · 검은 숫자',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "흰 크림",
      decoration: "흰 조개 짜기 테두리와 검정 리본, 옆면 검은 줄",
      lettering: '검은 숫자 "29"',
    },
    description:
      '사진처럼 흰 크림 원형 케이크 위아래 둘레를 흰 조개 모양으로 짜고 옆면에 검은 줄을 늘어뜨려 주세요. 검정 리본을 여러 개 둘러 묶고 윗면에 검은색으로 "29"를 써 주세요.',
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '검정 리본을 길게 늘어뜨려서'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "pink-ribbon-lettering",
    name: "분홍 리본",
    occasions: [
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.LETTERING,
      ProductCategoryType.FRIEND,
    ],
    style: "리본",
    seasonal: null,
    image: {
      file: "pink-ribbon-lettering.jpg",
      thumb: "pink-ribbon-lettering-s.jpg",
      width: 721,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Kateryna Hliznitsova",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/AY65b6SCSvQ",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "아이보리",
      },
      {
        label: "테두리",
        value: "아이보리 크림 짜기, 옆면 늘어진 줄 장식",
      },
      {
        label: "장식",
        value: "분홍 리본 여러 개",
      },
      {
        label: "글자",
        value: '"Happy Birthday" · 분홍 필기체',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "아이보리 크림",
      decoration: "아이보리 짜기 테두리와 분홍 리본",
      lettering: '분홍 필기체 "Happy Birthday" 레터링',
    },
    description:
      '사진처럼 아이보리 크림 원형 케이크 둘레를 크림으로 짜고 분홍 리본을 여러 개 묶어 늘어뜨려 주세요. 윗면에 분홍 필기체로 "Happy Birthday"라고 써 주세요.',
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '리본은 연분홍으로 여러 개 묶어서'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "bento-strawberry-pink",
    name: "딸기 도시락",
    occasions: [
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.FRIEND,
      ProductCategoryType.LETTERING,
    ],
    style: "도시락",
    seasonal: null,
    image: {
      file: "bento-strawberry-pink.jpg",
      thumb: "bento-strawberry-pink-s.jpg",
      width: 889,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Karley Kosmos",
      site: "Pexels",
      pageUrl: "https://www.pexels.com/photo/pink-summer-cake-with-strawberries-38330448/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 도시락 케이크",
      },
      {
        label: "크림 색",
        value: "분홍",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "딸기 그림, 흰 데이지 꽃, 흰 점",
      },
      {
        label: "글자",
        value: '"Pink Girl Summer" · 흰 필기체',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "도시락 케이크",
      color: "분홍 크림",
      decoration: "딸기 그림과 흰 데이지 꽃",
      lettering: '흰 필기체 "Pink Girl Summer" 레터링',
    },
    description:
      '사진처럼 분홍 크림 도시락 케이크 윗면에 작은 딸기와 흰 데이지 꽃을 그려 주시고, 가운데에 흰 필기체로 "Pink Girl Summer"라고 써 주세요.',
    size: "LUNCHBOX",
    creams: [],
    requestNote: "",
    tip: "가게에 '딸기와 데이지는 작게 여러 개'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "thank-you-flower",
    name: "땡큐 플라워",
    occasions: [
      ProductCategoryType.LETTERING,
      ProductCategoryType.FLOWER,
      ProductCategoryType.FAMILY,
    ],
    style: "플라워",
    seasonal: null,
    image: {
      file: "thank-you-flower.jpg",
      thumb: "thank-you-flower-s.jpg",
      width: 810,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Natalia S",
      site: "Pexels",
      pageUrl: "https://www.pexels.com/photo/34723394/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "연한 회녹색",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "파랑·흰 꽃과 초록 잎, 주황 작은 꽃 짜기",
      },
      {
        label: "글자",
        value: '"THANK you" · 아이보리 글씨',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "연한 회녹색 크림",
      decoration: "파랑·흰 꽃과 초록 잎, 주황 작은 꽃 짜기",
      lettering: '아이보리 "THANK you" 레터링',
    },
    description:
      '사진처럼 연한 회녹색 크림 원형 케이크 윗면 위아래에 파랑·흰 꽃과 초록 잎, 주황 작은 꽃을 둥글게 짜 주시고, 가운데에 아이보리색으로 "THANK you"라고 써 주세요.',
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '꽃은 파랑 위주로'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "heart-white-engaged",
    name: "흰 꽃 하트",
    occasions: [
      ProductCategoryType.LOVER,
      ProductCategoryType.ANNIVERSARY,
      ProductCategoryType.LETTERING,
    ],
    style: "하트",
    seasonal: null,
    image: {
      file: "heart-white-engaged.jpg",
      thumb: "heart-white-engaged-s.jpg",
      width: 810,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Beyza",
      site: "Pexels",
      pageUrl:
        "https://www.pexels.com/photo/heart-shaped-engagement-cake-with-floral-design-31009164/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "하트 1단",
      },
      {
        label: "크림 색",
        value: "아이보리",
      },
      {
        label: "테두리",
        value: "흰 크림 꽃과 조개 모양 짜기",
      },
      {
        label: "장식",
        value: "흰 진주 알갱이",
      },
      {
        label: "글자",
        value: '"engaged" · 금색 필기체',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "하트 모양 케이크",
      color: "아이보리 크림",
      decoration: "흰 크림 꽃 테두리와 진주 알갱이",
      lettering: '금색 필기체 "engaged" 레터링',
    },
    description:
      '사진처럼 아이보리 크림 하트 모양 케이크 둘레를 흰 크림 꽃과 짜기로 두르고 진주 알갱이를 흩뿌려 주세요. 가운데에 금색 필기체로 "engaged"라고 넣어 주세요.',
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '글씨는 금색, 테두리 꽃은 흰색'이라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "gold-cherry-vintage",
    name: "금색 체리",
    occasions: [ProductCategoryType.BIRTHDAY, ProductCategoryType.FRIEND],
    style: "빈티지",
    seasonal: null,
    image: {
      file: "gold-cherry-vintage.jpg",
      thumb: "gold-cherry-vintage-s.jpg",
      width: 810,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Karina Kungla",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/Cso77lQBrZQ",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "연분홍",
      },
      {
        label: "테두리",
        value: "연분홍 프릴 짜기, 옆면 늘어진 줄 장식",
      },
      {
        label: "장식",
        value: "금색 체리, 금색 진주 알갱이",
      },
      {
        label: "글자",
        value: null,
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 빈티지 케이크",
      color: "연분홍 크림",
      decoration: "연분홍 프릴 테두리와 금색 체리, 금색 진주 알갱이",
      lettering: null,
    },
    description:
      "사진처럼 연분홍 크림 원형 케이크 윗면 둘레를 프릴로 짜고 금색 체리를 빙 둘러 올려 주세요. 옆면은 늘어진 줄 장식과 금색 진주 알갱이로 꾸며 주세요.",
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '체리는 금색으로'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "bento-candle-lettering",
    name: "도시락 레터링",
    occasions: [
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.SIMPLE,
      ProductCategoryType.LETTERING,
    ],
    style: "도시락",
    seasonal: null,
    image: {
      file: "bento-candle-lettering.jpg",
      thumb: "bento-candle-lettering-s.jpg",
      width: 810,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Rehina Sultanova",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/rIiGJGOPLIw",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 도시락 케이크",
      },
      {
        label: "크림 색",
        value: "아이보리",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: null,
      },
      {
        label: "글자",
        value: '"happy birthday" · 검은 손글씨',
      },
      {
        label: "초·토퍼",
        value: "금색 꼬인 초 1개",
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "도시락 케이크",
      color: "아이보리 크림",
      decoration: null,
      lettering: '검은 손글씨 "happy birthday" 레터링',
    },
    description:
      '사진처럼 아이보리 크림 도시락 케이크 윗면에 다른 장식 없이 검은 손글씨로 "happy birthday"만 두 줄로 써 주세요.',
    size: "LUNCHBOX",
    creams: [],
    requestNote: "사진처럼 초 1개",
    tip: "가게에 '장식 없이 글씨만'이라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "heart-love-red",
    name: "러브 하트",
    occasions: [
      ProductCategoryType.LOVER,
      ProductCategoryType.LETTERING,
      ProductCategoryType.ANNIVERSARY,
    ],
    style: "하트",
    seasonal: null,
    image: {
      file: "heart-love-red.jpg",
      thumb: "heart-love-red-s.jpg",
      width: 720,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Emmanuel Boldo",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/pzgU6kFoQLY",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "하트 1단",
      },
      {
        label: "크림 색",
        value: "분홍",
      },
      {
        label: "테두리",
        value: "윗면 분홍·빨강 두 줄 짜기, 아래 빨강·아이보리·분홍 짜기",
      },
      {
        label: "장식",
        value: null,
      },
      {
        label: "글자",
        value: '"Love" · 흰 글씨',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "하트 모양 케이크",
      color: "분홍 크림",
      decoration: "분홍·빨강 짜기 테두리",
      lettering: '흰 글씨 "Love" 레터링',
    },
    description:
      '사진처럼 분홍 크림 하트 모양 케이크 윗면 둘레를 분홍과 빨강 두 줄로 짜고, 아래 둘레는 빨강·아이보리·분홍으로 짜 주세요. 가운데에 흰색으로 "Love"라고 써 주세요.',
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '테두리는 분홍과 빨강 두 줄로'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "lilac-rose-ribbon",
    name: "보라 장미 리본",
    occasions: [
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.FLOWER,
      ProductCategoryType.LETTERING,
    ],
    style: "플라워",
    seasonal: null,
    image: {
      file: "lilac-rose-ribbon.jpg",
      thumb: "lilac-rose-ribbon-s.jpg",
      width: 720,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Busenur Demirkan",
      site: "Pexels",
      pageUrl:
        "https://www.pexels.com/photo/floral-birthday-cake-with-pink-roses-and-ribbons-33100289/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "아이보리",
      },
      {
        label: "테두리",
        value: "윗면 둘레 연보라 장미와 분홍 꽃",
      },
      {
        label: "장식",
        value: "분홍 리본 2개, 아래 초록 잎, 윗면 동그란 결",
      },
      {
        label: "글자",
        value: '"happy birthday princess" · 금색 손글씨',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "아이보리 크림",
      decoration: "연보라 장미와 분홍 꽃 테두리, 분홍 리본",
      lettering: '금색 손글씨 "happy birthday princess" 레터링',
    },
    description:
      '사진처럼 아이보리 크림 원형 케이크 윗면 둘레에 연보라 장미와 분홍 꽃을 두르고 양옆에 분홍 리본을 묶어 주세요. 가운데에 금색으로 "happy birthday princess"라고 써 주세요.',
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '꽃은 연보라 장미 위주로'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "strawberry-carnation-petal",
    name: "딸기 카네이션",
    occasions: [
      ProductCategoryType.FAMILY,
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.SIMPLE,
    ],
    style: "딸기",
    seasonal: null,
    image: {
      file: "strawberry-carnation-petal.jpg",
      thumb: "strawberry-carnation-petal-s.jpg",
      width: 789,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Rayz Wong",
      site: "Pexels",
      pageUrl: "https://www.pexels.com/photo/32825146/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "흰색",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "윗면 둘레 딸기와 작은 흰 크림 짜기, 분홍 꽃잎, 가운데 동그란 결",
      },
      {
        label: "글자",
        value: null,
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "흰 크림",
      decoration: "윗면 둘레 딸기와 분홍 꽃잎",
      lettering: null,
    },
    description:
      "사진처럼 흰 크림 원형 케이크 윗면 가운데에 동그랗게 결을 내고, 둘레에 딸기와 작은 크림 짜기, 분홍 꽃잎을 번갈아 올려 주세요.",
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '딸기는 둘레에 한 줄로'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "flower-piping-bouquet",
    name: "꽃다발 플라워",
    occasions: [
      ProductCategoryType.FLOWER,
      ProductCategoryType.FAMILY,
      ProductCategoryType.BIRTHDAY,
    ],
    style: "플라워",
    seasonal: null,
    image: {
      file: "flower-piping-bouquet.jpg",
      thumb: "flower-piping-bouquet-s.jpg",
      width: 720,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Deva Williamson",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/OAWe8ULkxoQ",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단(높은 편)",
      },
      {
        label: "크림 색",
        value: "연분홍, 옆면 초록 무늬 띠",
      },
      {
        label: "테두리",
        value: "윗면 초록 덩굴 짜기",
      },
      {
        label: "장식",
        value: "한쪽에 주황·분홍·보라·파랑 꽃 짜기 묶음, 옆면 금색 테",
      },
      {
        label: "글자",
        value: null,
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "연분홍 크림",
      decoration: "주황·분홍·보라 꽃 짜기 묶음과 초록 덩굴",
      lettering: null,
    },
    description:
      "사진처럼 연분홍 크림 원형 케이크 윗면 한쪽에 주황·분홍·보라 꽃을 크게 모아 짜고 둘레에 초록 덩굴을 이어 주세요. 옆면은 초록 무늬 띠로 둘러 주세요.",
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '꽃은 한쪽에 크게 모아서'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "colorful-doodle-lettering",
    name: "알록달록 레터링",
    occasions: [
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.LETTERING,
      ProductCategoryType.FRIEND,
    ],
    style: "레터링",
    seasonal: null,
    image: {
      file: "colorful-doodle-lettering.jpg",
      thumb: "colorful-doodle-lettering-s.jpg",
      width: 810,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Nadiye Şamlı",
      site: "Pexels",
      pageUrl: "https://www.pexels.com/photo/colorful-birthday-cake-with-decorations-32191354/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "흰색",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "노란 해·하트·구름 그림",
      },
      {
        label: "글자",
        value: '"HAPPY BIRTHDAY", "30" · 분홍·노랑·보라·청록 손글씨',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "흰 크림",
      decoration: "노란 해와 하트, 구름 그림",
      lettering: '알록달록 손글씨 "HAPPY BIRTHDAY" 레터링',
    },
    description:
      '사진처럼 흰 크림 원형 케이크 윗면에 분홍·노랑·보라색 손글씨로 "HAPPY BIRTHDAY"를 쓰고, 구름 안에 "30", 노란 해와 하트를 그려 주세요.',
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '글자마다 색을 다르게'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "minimal-heart-doodle",
    name: "미니멀 하트",
    occasions: [ProductCategoryType.SIMPLE, ProductCategoryType.LOVER, ProductCategoryType.FRIEND],
    style: "심플",
    seasonal: null,
    image: {
      file: "minimal-heart-doodle.jpg",
      thumb: "minimal-heart-doodle-s.jpg",
      width: 720,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Alina Matveycheva",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/8iaUCQWilrQ",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "흰색",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "빨간 하트와 느낌표 그림",
      },
      {
        label: "글자",
        value: null,
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "흰 크림",
      decoration: "빨간 하트와 느낌표 그림",
      lettering: null,
    },
    description:
      "사진처럼 흰 크림 원형 케이크 윗면 가운데에 빨간 선으로 작은 하트와 느낌표만 그려 주세요.",
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '다른 장식 없이 하트 하나만'이라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "blue-shell-lettering",
    name: "파랑 레터링",
    occasions: [
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.LETTERING,
      ProductCategoryType.FRIEND,
    ],
    style: "레터링",
    seasonal: null,
    image: {
      file: "blue-shell-lettering.jpg",
      thumb: "blue-shell-lettering-s.jpg",
      width: 963,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Beyza",
      site: "Pexels",
      pageUrl:
        "https://www.pexels.com/photo/a-blue-cake-with-candles-and-a-candle-holder-27195940/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "파랑(윗면에 흰색이 섞임)",
      },
      {
        label: "테두리",
        value: "파랑 조개 모양 짜기",
      },
      {
        label: "장식",
        value: "금박 조각",
      },
      {
        label: "글자",
        value: '"happy birthday" · 금색 필기체',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "파랑 크림",
      decoration: "파랑 조개 짜기 테두리와 금박 조각",
      lettering: '금색 필기체 "happy birthday" 레터링',
    },
    description:
      '사진처럼 파랑 크림 원형 케이크 윗면을 흰색이 섞이게 바르고 둘레를 파랑 크림으로 짜 주세요. 가운데에 금색 필기체로 "happy birthday"라고 쓰고 금박을 조금 올려 주세요.',
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '윗면은 파랑과 흰색이 섞이게'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "christmas-cookie-house",
    name: "쿠키 하우스",
    occasions: [ProductCategoryType.FAMILY, ProductCategoryType.FRIEND],
    style: "크리스마스",
    seasonal: "CHRISTMAS",
    image: {
      file: "christmas-cookie-house.jpg",
      thumb: "christmas-cookie-house-s.jpg",
      width: 720,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Bruna Branco",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/569hhaYwXaQ",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "흰색",
      },
      {
        label: "테두리",
        value: "옆면 둘레 집 모양 쿠키",
      },
      {
        label: "장식",
        value: "윗면 집 모양 쿠키 2개, 체리, 로즈마리",
      },
      {
        label: "글자",
        value: null,
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "흰 크림",
      decoration: "집 모양 쿠키와 체리, 로즈마리",
      lettering: null,
    },
    description:
      "사진처럼 흰 크림 원형 케이크 옆면에 집 모양 쿠키를 빙 둘러 세우고, 윗면에 집 모양 쿠키 두 개와 체리, 로즈마리를 올려 주세요.",
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '옆면은 집 모양 쿠키로 둘러서'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "christmas-xmas-cookie",
    name: "쿠키 레터링",
    occasions: [
      ProductCategoryType.FAMILY,
      ProductCategoryType.FRIEND,
      ProductCategoryType.LETTERING,
    ],
    style: "크리스마스",
    seasonal: "CHRISTMAS",
    image: {
      file: "christmas-xmas-cookie.jpg",
      thumb: "christmas-xmas-cookie-s.jpg",
      width: 720,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Tim Douglas",
      site: "Pexels",
      pageUrl: "https://www.pexels.com/photo/6210935/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단(높은 편)",
      },
      {
        label: "크림 색",
        value: "흰색",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "윗면 빨간 열매와 로즈마리 나무 3개, 아래 둘레 빨간 열매·작은 솔방울",
      },
      {
        label: "글자",
        value: '"XMAS" · 옆면 쿠키 글자',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "높은 원형 케이크",
      color: "흰 크림",
      decoration: "빨간 열매와 로즈마리 나무",
      lettering: '옆면 쿠키 글자 "XMAS"',
    },
    description:
      '사진처럼 흰 크림 높은 원형 케이크 옆면에 쿠키 글자로 "XMAS"를 붙이고, 윗면에 빨간 열매를 뿌린 뒤 로즈마리를 나무처럼 세워 주세요.',
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '글자는 쿠키로 옆면에'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "christmas-strawberry-rosemary",
    name: "딸기 로즈마리",
    occasions: [ProductCategoryType.FAMILY, ProductCategoryType.FRIEND, ProductCategoryType.SIMPLE],
    style: "크리스마스",
    seasonal: "CHRISTMAS",
    image: {
      file: "christmas-strawberry-rosemary.jpg",
      thumb: "christmas-strawberry-rosemary-s.jpg",
      width: 720,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "光术 山影",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/xhASX4YuiTw",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "연분홍",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "흰 가루를 뿌린 딸기, 로즈마리",
      },
      {
        label: "글자",
        value: null,
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "연분홍 크림",
      decoration: "흰 가루 뿌린 딸기와 로즈마리",
      lettering: null,
    },
    description:
      "사진처럼 연분홍 크림 원형 케이크 윗면 가운데에 딸기를 모아 올리고 흰 가루를 살짝 뿌린 뒤, 로즈마리 가지를 둘러 주세요.",
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '딸기 위에 흰 가루, 로즈마리 장식'이라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "white-bow-gift",
    name: "선물 리본",
    occasions: [ProductCategoryType.BIRTHDAY, ProductCategoryType.FRIEND],
    style: "리본",
    seasonal: null,
    image: {
      file: "white-bow-gift.jpg",
      thumb: "white-bow-gift-s.jpg",
      width: 810,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Şeyda Nur Yüce",
      site: "Pexels",
      pageUrl: "https://www.pexels.com/photo/15601537/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단(높은 편)",
      },
      {
        label: "크림 색",
        value: "흰색",
      },
      {
        label: "테두리",
        value: "아래 흰 구슬",
      },
      {
        label: "장식",
        value: "위에서 늘어지는 큰 흰 리본",
      },
      {
        label: "글자",
        value: '"HAPPY BIRTHDAY" · 받침 위 은색 글씨',
      },
      {
        label: "초·토퍼",
        value: '은색 숫자 "21", 불꽃 초',
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "흰색",
      decoration: "위에서 늘어지는 큰 흰 리본과 흰 구슬 테두리",
      lettering: '은색 "HAPPY BIRTHDAY" 글씨',
    },
    description:
      '사진처럼 흰 원형 케이크를 큰 흰 리본으로 선물처럼 감싸고 아래를 흰 구슬로 둘러 주세요. 받침에 "HAPPY BIRTHDAY" 글씨와 은색 숫자 "21"을 놓아 주세요.',
    size: null,
    creams: [],
    requestNote: "사진처럼 숫자 장식과 불꽃 초",
    tip: "가게에 '리본이 위에서 옆으로 늘어지게'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "blueberry-white-cream",
    name: "블루베리",
    occasions: [
      ProductCategoryType.SIMPLE,
      ProductCategoryType.FAMILY,
      ProductCategoryType.BIRTHDAY,
    ],
    style: "과일",
    seasonal: null,
    image: {
      file: "blueberry-white-cream.jpg",
      thumb: "blueberry-white-cream-s.jpg",
      width: 720,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Natallia Nagorniak",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/tA3sJ4u09eU",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단(낮은 편)",
      },
      {
        label: "크림 색",
        value: "흰색",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "윗면 한쪽 블루베리·블랙베리, 옆면 거친 크림 결",
      },
      {
        label: "글자",
        value: null,
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "흰 크림",
      decoration: "한쪽에 모은 블루베리와 블랙베리",
      lettering: null,
    },
    description:
      "사진처럼 흰 크림 원형 케이크 옆면을 거친 결로 바르고, 윗면 한쪽에 블루베리와 블랙베리를 모아 올려 주세요.",
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '옆면은 매끈하지 않게 결을 살려서'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "white-wave-sparkler",
    name: "흰 물결",
    occasions: [ProductCategoryType.SIMPLE, ProductCategoryType.BIRTHDAY],
    style: "심플",
    seasonal: null,
    image: {
      file: "white-wave-sparkler.jpg",
      thumb: "white-wave-sparkler-s.jpg",
      width: 987,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "elnaz asadi",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/aYpioIlfL2A",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단(높은 편)",
      },
      {
        label: "크림 색",
        value: "흰색",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "옆면 가로 물결 결",
      },
      {
        label: "글자",
        value: null,
      },
      {
        label: "초·토퍼",
        value: "불꽃 초 1개",
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "높은 원형 케이크",
      color: "흰 크림",
      decoration: "옆면 가로 물결 결",
      lettering: null,
    },
    description:
      "사진처럼 흰 크림 높은 원형 케이크 옆면을 가로 물결 결로 바르고, 다른 장식 없이 깔끔하게 만들어 주세요.",
    size: null,
    creams: [],
    requestNote: "사진처럼 불꽃 초 1개",
    tip: "가게에 '장식 없이 옆면 물결 결만'이라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "flower-crescent",
    name: "반달 꽃",
    occasions: [
      ProductCategoryType.FLOWER,
      ProductCategoryType.FAMILY,
      ProductCategoryType.ANNIVERSARY,
    ],
    style: "플라워",
    seasonal: null,
    image: {
      file: "flower-crescent.jpg",
      thumb: "flower-crescent-s.jpg",
      width: 720,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Kelsey Curtis",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/CSN56aQ1NRE",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "아이보리",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "흰 장미·연보라 꽃·연두 꽃을 반달 모양으로",
      },
      {
        label: "글자",
        value: null,
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "아이보리 크림",
      decoration: "반달 모양으로 올린 흰 장미와 연보라 꽃",
      lettering: null,
    },
    description:
      "사진처럼 아이보리 크림 원형 케이크 윗면 한쪽에 흰 장미와 연보라 꽃, 연두 꽃을 반달 모양으로 둘러 올려 주세요.",
    size: null,
    creams: [],
    requestNote: "",
    tip: "꽃을 생화로 할지 크림으로 짤지 가게에 같이 적어 주세요",
    magazine: null,
  },
  {
    id: "palette-knife-pastel",
    name: "팔레트 나이프",
    occasions: [
      ProductCategoryType.SIMPLE,
      ProductCategoryType.FRIEND,
      ProductCategoryType.BIRTHDAY,
    ],
    style: "파스텔",
    seasonal: null,
    image: {
      file: "palette-knife-pastel.jpg",
      thumb: "palette-knife-pastel-s.jpg",
      width: 720,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Diliara Garifullina",
      site: "Unsplash",
      pageUrl: "https://unsplash.com/photos/x_7yi-MBqzk",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "아이보리 바탕에 분홍·하늘·민트·보라",
      },
      {
        label: "테두리",
        value: null,
      },
      {
        label: "장식",
        value: "팔레트 나이프로 바른 꽃잎 무늬, 진주 알갱이",
      },
      {
        label: "글자",
        value: null,
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "분홍·하늘·민트 파스텔 크림",
      decoration: "팔레트 나이프로 바른 꽃잎 무늬와 진주 알갱이",
      lettering: null,
    },
    description:
      "사진처럼 아이보리 크림 원형 케이크에 분홍·하늘·민트·보라 크림을 팔레트 나이프로 꽃잎처럼 덧발라 주시고, 진주 알갱이를 몇 개 올려 주세요.",
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '팔레트 나이프로, 파스텔 색'이라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "sprinkle-mint-lettering",
    name: "스프링클 레터링",
    occasions: [
      ProductCategoryType.BIRTHDAY,
      ProductCategoryType.LETTERING,
      ProductCategoryType.FRIEND,
    ],
    style: "레터링",
    seasonal: null,
    image: {
      file: "sprinkle-mint-lettering.jpg",
      thumb: "sprinkle-mint-lettering-s.jpg",
      width: 719,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "JillWellington",
      site: "Pixabay",
      pageUrl: "https://pixabay.com/photos/birthday-cake-happy-birthday-dessert-6591720/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 1단",
      },
      {
        label: "크림 색",
        value: "연민트",
      },
      {
        label: "테두리",
        value: "분홍 뾰족 짜기",
      },
      {
        label: "장식",
        value: "알록달록 스프링클, 윗면 흰 원판",
      },
      {
        label: "글자",
        value: '"Happy Birthday" · 금색 필기체(흰 원판 위)',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "원형 케이크",
      color: "연민트 크림",
      decoration: "분홍 짜기 테두리와 알록달록 스프링클",
      lettering: '흰 원판 위 금색 필기체 "Happy Birthday" 레터링',
    },
    description:
      '사진처럼 연민트 크림 원형 케이크 둘레를 분홍 크림으로 뾰족하게 짜고 옆면과 테두리에 알록달록 스프링클을 뿌려 주세요. 가운데 흰 원판에 금색 필기체로 "Happy Birthday"라고 써 주세요.',
    size: null,
    creams: [],
    requestNote: "",
    tip: "가게에 '스프링클은 파스텔 색으로'라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
  {
    id: "bento-papa-tictactoe",
    name: "틱택토 도시락",
    occasions: [ProductCategoryType.FAMILY, ProductCategoryType.LETTERING],
    style: "도시락",
    seasonal: null,
    image: {
      file: "bento-papa-tictactoe.jpg",
      thumb: "bento-papa-tictactoe-s.jpg",
      width: 1080,
      height: 1080,
    },
    credit: {
      kind: "FREE_PHOTO",
      author: "Cristina Porrani",
      site: "Pexels",
      pageUrl:
        "https://www.pexels.com/photo/decorative-father-s-day-cake-with-heart-design-35729083/",
      checkedAt: "2026-11-14",
    },
    read: [
      {
        label: "모양",
        value: "원형 도시락 케이크",
      },
      {
        label: "크림 색",
        value: "흰색",
      },
      {
        label: "테두리",
        value: "흰 크림 짜기",
      },
      {
        label: "장식",
        value: "검은 틱택토 칸, 빨간 하트",
      },
      {
        label: "글자",
        value: '"PA" "PA" "PÁ" · 검은 글씨(틱택토 칸 안)',
      },
      {
        label: "초·토퍼",
        value: null,
      },
      {
        label: "크림 종류",
        value: null,
      },
    ],
    parts: {
      shape: "도시락 케이크",
      color: "흰 크림",
      decoration: "흰 짜기 테두리와 빨간 하트",
      lettering: '검은 틱택토 칸 속 "PAPÁ" 글씨',
    },
    description:
      '사진처럼 흰 크림 도시락 케이크 둘레를 흰 크림으로 짜고, 윗면에 검은 선으로 틱택토 칸을 그려 "PA" "PA" "PÁ"를 넣고 빨간 하트를 그려 주세요.',
    size: "LUNCHBOX",
    creams: [],
    requestNote: "",
    tip: "가게에 '틱택토 칸은 검은 선, 하트는 빨강'이라고 적으면 사진에 더 가까워요",
    magazine: null,
  },
];
