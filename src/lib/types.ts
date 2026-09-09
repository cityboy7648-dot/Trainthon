import { z } from "zod";

export type SessionUser = {
  name: string;
  email: string;
};

export type AppSidebarProps = {
  user: SessionUser | null;
};

export type NavUserProps = {
  user: SessionUser;
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

export const brandProductSchema = z.object({
  name: z.string().trim().min(1),
  image_url: httpUrlSchema.nullable(),
  description: nullableTextSchema,
  price: nullableTextSchema,
});

export const brandProfileSchema = z.object({
  name: z.string().trim().min(1),
  tagline: nullableTextSchema,
  industry: nullableTextSchema,
  logo_url: httpUrlSchema.nullable(),
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
};

export type BrandProfileRouteProps = {
  searchParams: Promise<{ url?: string }>;
};

export type BrandSummaryProps = {
  name: BrandProfileData["name"];
  industry: BrandProfileData["industry"];
  tagline: BrandProfileData["tagline"];
  logoUrl: BrandProfileData["logo_url"];
  sourceUrl: BrandProfileData["source_url"];
};

export type BrandPaletteProps = {
  palette: BrandProfileData["palette"];
};

export type BrandMoodProps = Pick<
  BrandProfileData,
  "font_feel" | "voice" | "mood_keywords" | "target_audience"
>;

export type ProductCatalogProps = {
  products: BrandProfileData["products"];
};

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
  onSelect: () => void;
  onPreview: () => void;
};

export type CampaignDetailsProps = {
  campaign: CampaignPreview | undefined;
  onClose: () => void;
};
