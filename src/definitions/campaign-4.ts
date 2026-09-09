export const campaign4 = {
  number: 4,
  key: "real_usage",
  name: "리얼 사용기",
  goal: "상품을 직접 입고 쓰는 장면과 디테일을 5일 동안 보여 준다",
  image:
    "https://deucsyzcrllgnvbxlqlq.supabase.co/storage/v1/object/public/campaign-covers/real-usage/approved-20260910.png",
  channels: ["Instagram 피드"],
  outputs: "피드 이미지 5장(4:5), 캡션 5개, 업로드 순서",
  requiredInputs: "브랜드, 대표 상품",
  duration_days: 5,
  channel: "Instagram",
  format: "feed",
  aspect: "4:5",
  referenceKey: "real_usage_approved_20260909",
  references: [
    "outfit-and-shoes-collage.jpg",
    "cardigan-daily-outfit.jpg",
    "denim-worn-detail.jpg",
  ],
  schedule: [
    { day: 1, purpose: "첫인상·언박싱" },
    { day: 2, purpose: "착용 또는 사용" },
    { day: 3, purpose: "일상 장면" },
    { day: 4, purpose: "핏·질감·기능 디테일" },
    { day: 5, purpose: "사용 장면 모음과 구매 연결" },
  ],
} as const;
