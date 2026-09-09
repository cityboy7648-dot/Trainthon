import { z } from "zod";
import type { ErrorCode } from "./errors";

export type ErrorNoticeData = { code: ErrorCode; cause?: string };

export type SessionUser = {
  name: string;
  email: string;
};

export type AppSidebarProps = {
  user: SessionUser | null;
};

export type AppAccessProps = {
  user: SessionUser | null;
  children: import("react").ReactNode;
};

export type NavUserProps = {
  user: SessionUser;
  compact?: boolean;
};

export type UsageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type UrlFormProps = {
  authenticated: boolean;
};

export type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type HomeHeaderProps = {
  user: SessionUser | null;
};

export type HomePromptProps = {
  user: SessionUser | null;
  canSubmitUrl: boolean;
};

export type PrimaryNavKey = "dashboard" | "campaigns" | "brands";

export type UrlSubmission =
  { kind: "authenticate" } | { kind: "invalid" } | { kind: "navigate"; href: string };

export type SignInResult = { email: string; cause?: string } | null;

export type SignUpResult = { name: string; email: string; cause?: string } | null;

const nullableTextSchema = z.string().trim().min(1).nullable();
const httpUrlSchema = z
  .string()
  .trim()
  .pipe(z.url())
  .refine((value) => /^https?:\/\//i.test(value), "HTTP 또는 HTTPS 주소여야 한다.");

// 로컬 mock 이미지는 http가 아니다.
const mockAssetUrlSchema = z.string().regex(/^\/mock\/brand-assets\/[A-Za-z0-9._/-]+$/);
const brandImageUrlSchema = z.union([
  httpUrlSchema,
  mockAssetUrlSchema,
  z
    .string()
    .max(3_000_000)
    .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/),
]);

export const brandProductSchema = z.object({
  name: z.string().trim().min(1),
  image_url: brandImageUrlSchema.nullable(),
  description: nullableTextSchema,
  price: nullableTextSchema,
});

export const brandProfileSchema = z.object({
  name: z.string().trim(),
  address: nullableTextSchema.optional(),
  tagline: nullableTextSchema,
  industry: nullableTextSchema,
  logo_url: brandImageUrlSchema.nullable(),
  palette: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)),
  font_feel: nullableTextSchema,
  voice: nullableTextSchema,
  mood_keywords: z.array(z.string().trim().min(1)),
  products: z.array(brandProductSchema),
  target_audience: nullableTextSchema,
  source_url: httpUrlSchema,
  analyzed_at: z.iso.datetime(),
});

export const brandAnalysisRequestSchema = z.object({
  url: httpUrlSchema,
});

export const brandProfileDraftSchema = brandProfileSchema.omit({
  source_url: true,
  analyzed_at: true,
});

const modelUrlSchema = z.string().trim().min(1).nullable();
const brandProductModelSchema = brandProductSchema.extend({
  image_url: modelUrlSchema,
});
const brandProfileModelSchema = brandProfileDraftSchema.extend({
  name: nullableTextSchema,
  address: nullableTextSchema,
  logo_url: modelUrlSchema,
  products: z.array(brandProductModelSchema),
});

export const brandEvidenceSchema = brandProfileModelSchema.extend({
  name: nullableTextSchema,
});

export const brandAnalysisOutputSchema = z.object({
  profile: brandProfileModelSchema,
  collection_complete: z.boolean(),
  incomplete_reason: nullableTextSchema,
});

export type BrandProduct = z.infer<typeof brandProductSchema>;
export type BrandProfileData = z.infer<typeof brandProfileSchema>;
export type BrandProfileDraft = z.infer<typeof brandProfileDraftSchema>;
export type BrandEvidence = z.infer<typeof brandEvidenceSchema>;
export type BrandAnalysisOutput = z.infer<typeof brandAnalysisOutputSchema>;

export const tokenUsageSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  calls: z.number().int().nonnegative(),
});

export type TokenUsage = z.infer<typeof tokenUsageSchema>;

export type UserUsage = {
  brandCount: number;
  inputTokens: number;
  outputTokens: number;
};

export type UserUsageResult = { ok: true; usage: UserUsage } | { ok: false; cause?: string };

export type CollectedPage = {
  url: string;
  title: string | null;
  markdown: string;
  links: string[];
  images: string[];
};

export type CollectedSite = {
  branding: unknown;
  pages: CollectedPage[];
  dynamicCatalog: string;
};

export type BrandProfileProps = {
  profile: BrandProfileData;
  onChange?: (profile: BrandProfileData) => void;
};

export type BrandProfileRouteProps = {
  searchParams: Promise<{ url?: string }>;
};

export type AnalysisProgressProps = {
  url: string;
};

export type BrandProfileResultProps = {
  url: string;
};

export type BrandProfileRequestResult =
  | { ok: true; profile: BrandProfileData; questions: BrandCompletionQuestion[] }
  | { ok: false; cause?: string };

export type BrandCompletionQuestion = {
  field:
    | "name"
    | "address"
    | "industry"
    | "tagline"
    | "logo_url"
    | "palette"
    | "mood_keywords"
    | "font_feel"
    | "voice"
    | "target_audience"
    | "products"
    | `products.${number}.price`;
  title: string;
  suggestions: string[];
  kind: "text" | "logo" | "colors" | "list" | "products";
  optional: boolean;
};

export type EditableBrandValueProps = {
  profile: BrandProfileData;
  question: BrandCompletionQuestion;
  value: string | null;
  cause: string;
  onChange?: (profile: BrandProfileData) => void;
  className?: string;
};

export type EditableBrandLogoProps = BrandProfileProps;

export type BrandMoodKeywordProps = BrandProfileProps & { index: number };

export type MissingBrandValueProps = { cause: string };

export type BrandSummaryProps = BrandProfileProps;

export type BrandPaletteProps = {
  palette: BrandProfileData["palette"];
};

export type BrandMoodProps = BrandProfileProps;

export type ProductCatalogProps = Pick<BrandProfileProps, "profile">;

export type CampaignPreview = {
  key: string;
  name: string;
  goal: string;
  duration_days: number;
  channels: string[];
  image: string;
  schedule: {
    day: number;
    channel: string;
    format: string;
    purpose: string;
  }[];
};

export type CampaignStatus = "processing" | "done" | "draft";

export type CreatedCampaignPreview = {
  id: string;
  status: CampaignStatus;
  campaign: CampaignPreview;
};

export type CampaignStatusCounts = Record<CampaignStatus, number>;

export type CampaignOverviewState =
  | { mode: "create" }
  | {
      mode: "gallery";
      status: CampaignStatus;
      campaigns: CreatedCampaignPreview[];
      counts: CampaignStatusCounts;
    };

export type CampaignOverviewProps = {
  searchParams: Promise<{ status?: string }>;
};

export type CampaignGalleryProps = {
  status: CampaignStatus;
  campaigns: CreatedCampaignPreview[];
  counts: CampaignStatusCounts;
};

export type CampaignGalleryCardsProps = {
  campaigns: CreatedCampaignPreview[];
};

export type CampaignCardProps = {
  campaign: CampaignPreview;
  selected: boolean;
  transitioning?: boolean;
  onSelect: () => void;
  onPreview: () => void;
};

export type CampaignBriefProps = {
  campaign: CampaignPreview;
};

export type CampaignDetailsProps = {
  campaign: CampaignPreview | undefined;
  onClose: () => void;
  onSelect?: () => void;
};
