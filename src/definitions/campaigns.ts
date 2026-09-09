import type { CampaignPreview } from "@/lib/types";

export const campaigns: readonly CampaignPreview[] = [
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
