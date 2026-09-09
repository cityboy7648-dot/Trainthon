import { copy } from "@/lib/copy";

export function CampaignCreationHeader() {
  return (
    <header className="mb-campaign-heading-gap">
      <h1 className="text-shell-ink text-2xl leading-9 font-semibold tracking-tight">
        {copy.campaigns.heading}
      </h1>
      <p className="text-campaign-muted text-2xl leading-9 font-semibold tracking-tight">
        {copy.campaigns.description}
      </p>
    </header>
  );
}
