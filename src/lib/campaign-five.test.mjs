import assert from "node:assert/strict";
import test from "node:test";
import { campaignProductKey } from "./campaign-product.ts";
import { campaignFivePlanSchema, campaignFiveRequestSchema } from "./types.ts";

const primary = {
  name: "대표 재킷",
  image_url: "https://shop.example/products/jacket.jpg",
  description: null,
  price: "120,000원",
};
const companion = { ...primary, name: "함께 입는 셔츠" };
const base = {
  brand_id: "f19b4d55-508a-4818-bae0-71a1b357d339",
  product_key: campaignProductKey(primary),
  companion_product_keys: [campaignProductKey(companion)],
};

test("대표 상품 하나와 서로 다른 동반 상품 1~10개만 받는다", () => {
  assert.equal(campaignFiveRequestSchema.safeParse(base).success, true);
  assert.equal(
    campaignFiveRequestSchema.safeParse({ ...base, companion_product_keys: [] }).success,
    false,
  );
  assert.equal(
    campaignFiveRequestSchema.safeParse({
      ...base,
      companion_product_keys: Array(11).fill(campaignProductKey(companion)),
    }).success,
    false,
  );
  assert.equal(
    campaignFiveRequestSchema.safeParse({ ...base, companion_product_keys: [base.product_key] })
      .success,
    false,
  );
  assert.equal(
    campaignFiveRequestSchema.safeParse({
      ...base,
      companion_product_keys: [base.companion_product_keys[0], base.companion_product_keys[0]],
    }).success,
    false,
  );
  assert.equal(
    campaignFiveRequestSchema.safeParse({ ...base, prompt: "상품 변경" }).success,
    false,
  );
});

test("기획 결과는 11개 이미지 브리프와 5개 캡션 및 상품 주소를 요구한다", () => {
  const plan = {
    concept: "완성된 조합",
    image_briefs: Array.from({ length: 11 }, (_, index) => `이미지 ${index + 1}`),
    captions: ["1", "2", "3", "4", "5"],
    product_links: [
      { key: base.product_key, url: "https://shop.example/products/jacket" },
      { key: base.companion_product_keys[0], url: null },
    ],
  };
  assert.equal(campaignFivePlanSchema.safeParse(plan).success, true);
  assert.equal(
    campaignFivePlanSchema.safeParse({ ...plan, image_briefs: plan.image_briefs.slice(1) }).success,
    false,
  );
  assert.equal(campaignFivePlanSchema.safeParse({ ...plan, captions: [] }).success, false);
  assert.equal(
    campaignFivePlanSchema.safeParse({
      ...plan,
      product_links: [{ key: base.product_key, url: "javascript:alert(1)" }],
    }).success,
    false,
  );
});
