// MOCK: 예시 데이터. 서버 연결 전 임시.
import type { BrandProfileData } from "@/lib/types";

export const incompleteBrandProfile: BrandProfileData = {
  name: "오후 커피",
  address: "서울시 성동구 연무장길 10",
  industry: "카페",
  tagline: null,
  logo_url: null,
  palette: ["#694A38", "#F5EFE6", "#879879"],
  mood_keywords: ["따뜻한", "차분한"],
  font_feel: "단정한 고딕",
  voice: "편안하고 친근한 말투",
  target_audience: "커피와 함께 잠깐의 휴식을 즐기는 사람",
  products: [
    { name: "아메리카노", price: null, image_url: null, description: "고소한 원두로 내린 커피" },
    {
      name: "버터 쿠키",
      price: "3,000원",
      image_url: null,
      description: "매장에서 구운 버터 쿠키",
    },
  ],
  source_url: "https://example.com/",
  analyzed_at: "2026-09-09T00:00:00Z",
};
