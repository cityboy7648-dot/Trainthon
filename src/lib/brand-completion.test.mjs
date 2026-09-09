import assert from "node:assert/strict";
import test from "node:test";
import {
  getBrandCompletionQuestions,
  getBrandEditQuestion,
  applyBrandCompletionAnswer,
  updateBrandMoodKeyword,
} from "./brand-completion.ts";

const profile = {
  name: "Example",
  address: "서울",
  industry: "카페",
  tagline: null,
  logo_url: null,
  palette: ["#112233"],
  mood_keywords: [],
  font_feel: "고딕",
  voice: "친근한",
  target_audience: "직장인",
  source_url: "https://example.com/",
  analyzed_at: "2026-09-09T00:00:00Z",
  products: [{ name: "커피", price: null, image_url: null, description: null }],
};

test("누락 항목만 질문하고 사실 정보에는 제안을 만들지 않는다", () => {
  const questions = getBrandCompletionQuestions(profile);
  assert.deepEqual(
    questions.map((item) => item.field),
    ["tagline", "logo_url", "mood_keywords", "products.0.price"],
  );
  assert.equal(questions.find((item) => item.field === "tagline").suggestions.length, 3);
  assert.equal(questions.find((item) => item.field === "mood_keywords").suggestions.length, 3);
  assert.deepEqual(questions.find((item) => item.field === "logo_url").suggestions, []);
  assert.deepEqual(questions.find((item) => item.field === "products.0.price").suggestions, []);
});

test("가격 입력과 없음 선택은 원래 추출된 정보를 보존한다", () => {
  const question = getBrandCompletionQuestions(profile).find(
    (item) => item.field === "products.0.price",
  );
  const next = applyBrandCompletionAnswer(profile, question, "4,500원");
  assert.equal(next.products[0].price, "4,500원");
  assert.equal(profile.products[0].price, null);
  assert.equal(next.address, profile.address);
  assert.equal(applyBrandCompletionAnswer(profile, question, "").products[0].price, null);
});

test("잘못된 로고 주소와 색상, 빈 브랜드명을 거부한다", () => {
  const questions = getBrandCompletionQuestions({ ...profile, name: "", palette: [] });
  for (const [field, input] of [
    ["logo_url", "javascript:alert(1)"],
    ["palette", "red"],
    ["name", ""],
  ]) {
    assert.throws(() =>
      applyBrandCompletionAnswer(
        profile,
        questions.find((item) => item.field === field),
        input,
      ),
    );
  }
});

test("누락이 없으면 보완 질문 없이 진행한다", () => {
  assert.deepEqual(
    getBrandCompletionQuestions({
      ...profile,
      tagline: "소개",
      logo_url: "https://example.com/logo.png",
      mood_keywords: ["차분한"],
      products: [{ ...profile.products[0], price: "4,500원" }],
    }),
    [],
  );
});

test("값이 이미 있어도 편집하고 주소·색상·제품·사이트 URL은 제외한다", () => {
  const fields = [
    "name",
    "industry",
    "tagline",
    "logo_url",
    "mood_keywords",
    "font_feel",
    "voice",
    "target_audience",
  ];
  assert.deepEqual(
    fields.map((field) => getBrandEditQuestion(profile, field)?.field),
    fields,
  );
  assert.equal(getBrandEditQuestion(profile, "address"), undefined);
  assert.equal(getBrandEditQuestion(profile, "source_url"), undefined);
  assert.equal(getBrandEditQuestion(profile, "palette"), undefined);
  assert.equal(getBrandEditQuestion(profile, "products"), undefined);
});

test("분위기 키워드를 수정하거나 삭제한다", () => {
  const withKeywords = { ...profile, mood_keywords: ["차분한", "따뜻한"] };
  assert.deepEqual(updateBrandMoodKeyword(withKeywords, 0, "선명한").mood_keywords, [
    "선명한",
    "따뜻한",
  ]);
  assert.deepEqual(updateBrandMoodKeyword(withKeywords, 1, null).mood_keywords, ["차분한"]);
});
