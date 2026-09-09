import { Campaign4Planner } from "@/components/campaigns/campaign-4-planner";
import { ErrorState } from "@/components/error-state";
import { getCampaign4Products } from "@/lib/data/campaign-4";
import { AppError } from "@/lib/errors";
import type { Campaign4ProductOptions } from "@/lib/types";

export async function Campaign4Setup() {
  let brands: Campaign4ProductOptions;
  try {
    brands = await getCampaign4Products();
  } catch (error) {
    const failure = error instanceof AppError ? error : new AppError("network");
    return (
      <div data-source="server" className="mt-8">
        <ErrorState code={failure.code} cause={failure.cause} />
      </div>
    );
  }
  return <Campaign4Planner brands={brands} />;
}
