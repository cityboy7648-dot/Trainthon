import { copy } from "./copy.ts";
import {
  brandProfileSchema,
  type BrandCompletionQuestion,
  type BrandProfileData,
} from "./types.ts";

export function getBrandCompletionQuestions(profile: BrandProfileData): BrandCompletionQuestion[] {
  const questions: BrandCompletionQuestion[] = [];
  const fields = [
    "name",
    "address",
    "industry",
    "tagline",
    "logo_url",
    "palette",
    "mood_keywords",
    "font_feel",
    "voice",
    "target_audience",
    "products",
  ] as const;
  for (const field of fields) {
    const value = profile[field];
    if (Array.isArray(value) ? value.length > 0 : Boolean(value)) continue;
    questions.push(createBrandQuestion(profile, field));
  }
  profile.products.forEach((product, index) => {
    if (!product.price)
      questions.push({
        field: `products.${index}.price`,
        title: copy.brandCompletion.price(product.name),
        suggestions: [],
        kind: "text",
        optional: true,
      });
  });
  return questions;
}

function createBrandQuestion(
  profile: BrandProfileData,
  field: Exclude<BrandCompletionQuestion["field"], `products.${number}.price`>,
): BrandCompletionQuestion {
  const suggestions =
    field === "tagline" && profile.name
      ? copy.brandCompletion.suggestions.tagline(profile.name)
      : field === "mood_keywords" ||
          field === "font_feel" ||
          field === "voice" ||
          field === "target_audience"
        ? [...copy.brandCompletion.suggestions[field]]
        : [];
  return {
    field,
    title: copy.brandCompletion.titles[field],
    suggestions,
    kind:
      field === "logo_url"
        ? "logo"
        : field === "palette"
          ? "colors"
          : field === "mood_keywords"
            ? "list"
            : field === "products"
              ? "products"
              : "text",
    optional: field !== "name",
  };
}

const editableFields = new Set<string>([
  "name",
  "industry",
  "tagline",
  "logo_url",
  "mood_keywords",
  "font_feel",
  "voice",
  "target_audience",
]);

export function getBrandEditQuestion(
  profile: BrandProfileData,
  field: keyof BrandProfileData,
): BrandCompletionQuestion | undefined {
  if (!editableFields.has(field)) return undefined;
  return createBrandQuestion(
    profile,
    field as Exclude<BrandCompletionQuestion["field"], `products.${number}.price`>,
  );
}

export function updateBrandMoodKeyword(
  profile: BrandProfileData,
  index: number,
  value: string | null,
): BrandProfileData {
  const moodKeywords = profile.mood_keywords
    .map((keyword, current) => (current === index ? value?.trim() || null : keyword))
    .filter((keyword): keyword is string => keyword !== null);
  return brandProfileSchema.parse({ ...profile, mood_keywords: moodKeywords });
}

export function applyBrandCompletionAnswer(
  profile: BrandProfileData,
  question: BrandCompletionQuestion,
  answer: string,
): BrandProfileData {
  const value = answer.trim();
  if (!value && !question.optional) throw new Error(copy.brandCompletion.invalid);
  if (question.field.startsWith("products.")) {
    const index = Number(question.field.split(".")[1]);
    return brandProfileSchema.parse({
      ...profile,
      products: profile.products.map((product, i) =>
        i === index ? { ...product, price: value || null } : product,
      ),
    });
  }
  const next =
    question.kind === "products"
      ? value
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => {
            const [name, ...price] = line.split("|");
            return {
              name: name.trim(),
              price: price.join("|").trim() || null,
              description: null,
              image_url: null,
            };
          })
      : question.kind === "colors" || question.kind === "list"
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : value || null;
  return brandProfileSchema.parse({ ...profile, [question.field]: next });
}
