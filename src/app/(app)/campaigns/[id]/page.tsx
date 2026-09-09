import { CampaignWorkspaceResult } from "@/components/campaigns/campaign-workspace-result";

export const maxDuration = 300;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignWorkspaceResult id={id} />;
}
