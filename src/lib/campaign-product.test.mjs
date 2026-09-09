import assert from "node:assert/strict";
import test from "node:test";
import { campaignProductKey, resolveCampaignProduct } from "./campaign-product.ts";
import { campaignTwoRequestSchema, campaignTwoPlanSchema } from "./types.ts";

const product = {
  name: "대표 상품",
  image_url: "https://example.com/product.jpg",
  description: null,
  price: "10,000원",
};

test("선택한 상품을 순서가 바뀌어도 같은 상품으로 찾는다", () => {
  const other = { ...product, name: "다른 상품" };
  const key = campaignProductKey(product);
  assert.deepEqual(resolveCampaignProduct({ products: [other, product] }, key), product);
  assert.notEqual(key, campaignProductKey(other));
});

test("선택 이후 가격 또는 이미지가 바뀌면 생성을 거부한다", () => {
  const key = campaignProductKey(product);
  for (const changed of [
    { ...product, price: "20,000원" },
    { ...product, image_url: "https://example.com/other.jpg" },
  ]) {
    assert.throws(() => resolveCampaignProduct({ products: [changed] }, key), /생성하지 못했어요/);
  }
  assert.throws(() => resolveCampaignProduct({ products: [] }, key));
});

test("이미지 없는 상품은 생성을 거부한다", () => {
  const withoutImage = { ...product, image_url: null };
  assert.throws(() =>
    resolveCampaignProduct({ products: [withoutImage] }, campaignProductKey(withoutImage)),
  );
});

test("생성 요청은 상품 본문이나 프롬프트를 받지 않는다", () => {
  const request = {
    brand_id: "f19b4d55-508a-4818-bae0-71a1b357d339",
    product_key: campaignProductKey(product),
  };
  assert.equal(campaignTwoRequestSchema.safeParse(request).success, true);
  assert.equal(campaignTwoRequestSchema.safeParse({ ...request, product }).success, false);
  assert.equal(campaignTwoRequestSchema.safeParse({ ...request, prompt: "변경" }).success, false);
  assert.equal(campaignTwoRequestSchema.safeParse({ ...request, product_key: "" }).success, false);
});

test("기획 결과는 장면 3개와 캡션 5개가 있어야 한다", () => {
  const plan = {
    concept: "상품 사용 장면",
    product_brief: "상품 사진",
    scenes: Array.from({ length: 3 }, (_, i) => ({ name: String(i), image_brief: "장면 사진" })),
    captions: ["1", "2", "3", "4", "5"],
  };
  assert.equal(campaignTwoPlanSchema.safeParse(plan).success, true);
  assert.equal(
    campaignTwoPlanSchema.safeParse({ ...plan, scenes: plan.scenes.slice(1) }).success,
    false,
  );
  assert.equal(campaignTwoPlanSchema.safeParse({ ...plan, captions: [] }).success, false);
});
