export function addCampaignBriefAnswer(
  answers: readonly string[],
  answer: string,
  questionCount: number,
) {
  const value = answer.trim();

  if (!value || answers.length >= questionCount) return answers;

  return [...answers, value];
}

export function getCampaignBriefProgress(questions: readonly string[], answers: readonly string[]) {
  const complete = answers.length >= questions.length;

  return {
    complete,
    currentQuestion: complete ? undefined : questions[answers.length],
    questionNumber: Math.min(answers.length + 1, questions.length),
    totalQuestions: questions.length,
  };
}
