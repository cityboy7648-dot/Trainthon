import { QuickActions } from "@/components/home/quick-actions";
import { RecentList } from "@/components/home/recent-list";
import { UrlForm } from "@/components/home/url-form";
import { copy } from "@/lib/copy";
import { mockRecentBrands, mockRecentCampaigns } from "@/mock/recent"; // MOCK
import { mockUser } from "@/mock/session"; // MOCK

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pt-16 pb-28">
      <div className="flex w-full max-w-3xl flex-col gap-3">
        <h1 className="font-heading mb-3 text-center text-4xl font-normal tracking-tight">
          {copy.home.greeting(mockUser.name)}
        </h1>
        <UrlForm />
        <QuickActions />
        <div className="mt-12">
          <RecentList brands={mockRecentBrands} campaigns={mockRecentCampaigns} source="mock" />
        </div>
      </div>
    </div>
  );
}
