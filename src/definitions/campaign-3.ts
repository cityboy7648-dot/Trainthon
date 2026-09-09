export const campaign3 = {
  number: 3,
  key: "drop_week",
  name: "드롭 위크",
  goal: "신상품을 티저부터 공개·디테일·사용 장면까지 7일 동안 순서대로 알린다",
  image:
    "https://deucsyzcrllgnvbxlqlq.supabase.co/storage/v1/object/public/campaign-covers/drop-week/card-thumbnail-soft.png",
  channels: ["Instagram 피드", "Instagram 스토리"],
  outputs: "피드 이미지 7장(4:5), 스토리 이미지 3장(9:16), 캡션 7개, 업로드 순서",
  requiredInputs: "공개일, 대상 상품",
  duration_days: 7,
  channel: "Instagram",
  referenceKey: "drop_week_approved_20260909",
  references: [
    { file: "paris-elysees-teaser.jpg", mime: "image/jpeg" },
    { file: "rhode-product-reveal.png", mime: "image/png" },
    { file: "glossier-shades-texture.png", mime: "image/png" },
  ],
  schedule: [
    { key: "minus3", offset: -3, purpose: "디테일 티저", story: true },
    { key: "minus2", offset: -2, purpose: "분위기", story: false },
    { key: "minus1", offset: -1, purpose: "첫 공개", story: false },
    { key: "launch", offset: 0, purpose: "공개일 대표 피드", story: true },
    { key: "plus1", offset: 1, purpose: "소재·기능", story: false },
    { key: "plus2", offset: 2, purpose: "사용 장면", story: false },
    { key: "plus3", offset: 3, purpose: "정리와 구매 연결", story: true },
  ],
} as const;
