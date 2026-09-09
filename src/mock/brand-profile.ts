// MOCK: 예시 데이터. 서버 연결 전 임시.
import type { BrandProfileData } from "@/lib/types";

const mockBrandProfile = {
  name: "빈앤블룸",
  tagline: "매일 구운 빵과 직접 로스팅한 커피를 만드는 동네 카페",
  industry: "카페 · 베이커리",
  logo_url: "/mock/brand-assets/logo.svg",
  palette: ["#26352A", "#D97745", "#F2E8D5", "#FFFDF8", "#252525"],
  font_feel: "따뜻하고 단정한 산세리프",
  voice: "친근하고 담백함",
  mood_keywords: ["따뜻한", "정직한", "동네의", "수제"],
  products: [
    {
      name: "아메리카노",
      image_url: "/mock/brand-assets/coffee-black.svg",
      description: "깔끔하고 고소한 원두의 풍미",
      price: "₩4,500",
    },
    {
      name: "카페라테",
      image_url: "/mock/brand-assets/coffee-milk.svg",
      description: "부드러운 우유와 에스프레소의 조화",
      price: "₩5,000",
    },
    {
      name: "플랫화이트",
      image_url: "/mock/brand-assets/coffee-milk.svg",
      description: "진한 커피와 부드러운 우유의 균형",
      price: "₩5,000",
    },
    {
      name: "바닐라빈 라테",
      image_url: "/mock/brand-assets/coffee-milk.svg",
      description: "바닐라빈이 들어간 달콤한 라테",
      price: "₩5,800",
    },
    {
      name: "버터 크루아상",
      image_url: "/mock/brand-assets/pastry.svg",
      description: "프랑스산 버터로 구운 클래식 크루아상",
      price: "₩4,200",
    },
    {
      name: "소금빵",
      image_url: "/mock/brand-assets/pastry.svg",
      description: "겉은 바삭하고 속은 촉촉한 인기 메뉴",
      price: "₩3,500",
    },
    {
      name: "초콜릿 쿠키",
      image_url: "/mock/brand-assets/dessert.svg",
      description: "진한 초콜릿이 가득한 수제 쿠키",
      price: "₩3,800",
    },
    {
      name: "레몬 파운드",
      image_url: "/mock/brand-assets/dessert.svg",
      description: "상큼한 레몬 글레이즈를 올린 파운드 케이크",
      price: "₩4,500",
    },
    {
      name: "원두 200g",
      image_url: "/mock/brand-assets/coffee-package.svg",
      description: "빈앤블룸의 시그니처 블렌드 원두",
      price: "₩16,000",
    },
    {
      name: "드립백 세트",
      image_url: "/mock/brand-assets/coffee-package.svg",
      description: "언제 어디서나 즐기는 간편한 드립백",
      price: "₩12,000",
    },
    {
      name: "브런치 플레이트",
      image_url: "/mock/brand-assets/brunch.svg",
      description: "신선한 재료로 만든 든든한 브런치",
      price: "₩14,000",
    },
    {
      name: "커피 클래스",
      image_url: "/mock/brand-assets/coffee-class.svg",
      description: "홈카페를 위한 원데이 커피 클래스",
      price: "₩45,000",
    },
  ],
  target_audience: "좋은 커피와 갓 구운 빵을 찾는 20–40대 지역 고객",
  source_url: "https://beanandbloom.coffee",
  analyzed_at: "2026-09-09T10:30:00Z",
} satisfies BrandProfileData;

const MOCK_ANALYSIS_DELAY_MS = 1200;

export async function getMockBrandProfile(sourceUrl: string): Promise<BrandProfileData> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_ANALYSIS_DELAY_MS));

  return {
    ...mockBrandProfile,
    source_url: sourceUrl,
  };
}
