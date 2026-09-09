// MOCK: 예시 데이터. 서버 연결 전 임시.
import type { OnboardingProgress, SessionUser } from "@/lib/types";

export const mockUser: SessionUser = {
  name: "다현",
  email: "dahyun@example.com",
};

export const mockOnboarding: OnboardingProgress = {
  done: 1,
  total: 4,
};
