import assert from "node:assert/strict";
import test from "node:test";

import { addCampaignBriefAnswer, getCampaignBriefProgress } from "./campaign-brief.ts";

const questions = ["첫 번째 질문", "두 번째 질문", "세 번째 질문"];

test("빈 답변은 캠페인 질문을 진행시키지 않는다", () => {
  const answers = addCampaignBriefAnswer([], "   ", questions.length);

  assert.deepEqual(answers, []);
  assert.deepEqual(getCampaignBriefProgress(questions, answers), {
    complete: false,
    currentQuestion: "첫 번째 질문",
    questionNumber: 1,
    totalQuestions: 3,
  });
});

test("답변을 추가하면 다음 캠페인 질문으로 이동한다", () => {
  const firstAnswers = addCampaignBriefAnswer([], "대표 상품은 재킷", questions.length);
  const secondAnswers = addCampaignBriefAnswer(
    firstAnswers,
    "차분한 도시 분위기",
    questions.length,
  );

  assert.deepEqual(secondAnswers, ["대표 상품은 재킷", "차분한 도시 분위기"]);
  assert.deepEqual(getCampaignBriefProgress(questions, secondAnswers), {
    complete: false,
    currentQuestion: "세 번째 질문",
    questionNumber: 3,
    totalQuestions: 3,
  });
});

test("모든 답변을 받으면 캠페인 질문이 완료된다", () => {
  const answers = ["첫 답변", "둘째 답변", "셋째 답변"];

  assert.deepEqual(getCampaignBriefProgress(questions, answers), {
    complete: true,
    currentQuestion: undefined,
    questionNumber: 3,
    totalQuestions: 3,
  });
  assert.strictEqual(addCampaignBriefAnswer(answers, "초과 답변", questions.length), answers);
});
