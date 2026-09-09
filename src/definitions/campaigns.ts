import type { CampaignPreview } from "@/lib/types";

export const campaigns: readonly CampaignPreview[] = [
  {
    key: "one_product_three_scenes",
    name: "한 상품, 세 장면",
    goal: "대표 상품 하나를 세 가지 사용 장면으로 보여 줘 구매 후 모습을 상상하게 한다",
    duration_days: 5,
    channels: ["Instagram 피드", "캐러셀", "스토리"],
    image: null,
    schedule: [
      { day: 1, channel: "Instagram", format: "Feed", purpose: "대표 상품 소개" },
      { day: 2, channel: "Instagram", format: "Feed · Story", purpose: "첫 번째 사용 장면" },
      { day: 3, channel: "Instagram", format: "Feed · Story", purpose: "두 번째 사용 장면" },
      { day: 4, channel: "Instagram", format: "Feed · Story", purpose: "세 번째 사용 장면" },
      { day: 5, channel: "Instagram", format: "Carousel", purpose: "세 장면 정리" },
    ],
  },
  {
    key: "signature_grid",
    name: "시그니처 그리드",
    goal: "브랜드가 한눈에 읽히는 인스타그램 프로필 만들기",
    duration_days: 9,
    channels: ["Instagram"],
    image: "/campaigns/signature-grid/card-thumbnail.png",
    schedule: Array.from({ length: 9 }, (_, index) => ({
      day: index + 1,
      channel: "Instagram",
      format: "피드",
      purpose: "완성된 그리드의 업로드 순서에 따라 게시",
    })),
  },
];
