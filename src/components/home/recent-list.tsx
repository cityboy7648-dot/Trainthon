"use client";

import Link from "next/link";
import { FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { copy } from "@/lib/copy";
import { formatRelativeTime } from "@/lib/format";
import type { RecentItem } from "@/lib/types";

type RecentListProps = {
  brands: RecentItem[];
  campaigns: RecentItem[];
  source: "mock" | "server";
};

export function RecentList({ brands, campaigns, source }: RecentListProps) {
  return (
    <Tabs defaultValue="brands" data-source={source}>
      <div className="flex items-center justify-between">
        <TabsList className="h-9 gap-1 bg-transparent p-0">
          <TabsTrigger
            value="brands"
            className="data-active:bg-muted rounded-full px-3 data-active:shadow-none"
          >
            {copy.home.recent.brands}
          </TabsTrigger>
          <TabsTrigger
            value="campaigns"
            className="data-active:bg-muted rounded-full px-3 data-active:shadow-none"
          >
            {copy.home.recent.campaigns}
          </TabsTrigger>
        </TabsList>
        <Button variant="ghost" size="xs" nativeButton={false} render={<Link href="/brands" />}>
          {copy.home.recent.viewAll}
        </Button>
      </div>
      <TabsContent value="brands">
        <RecentRows items={brands} hrefBase="/brands" empty={copy.brands} />
      </TabsContent>
      <TabsContent value="campaigns">
        <RecentRows items={campaigns} hrefBase="/campaigns" empty={copy.campaigns} />
      </TabsContent>
    </Tabs>
  );
}

type RecentRowsProps = {
  items: RecentItem[];
  hrefBase: string;
  empty: { emptyTitle: string; emptyDescription: string };
};

function RecentRows({ items, hrefBase, empty }: RecentRowsProps) {
  if (items.length === 0) {
    return <EmptyState title={empty.emptyTitle} description={empty.emptyDescription} />;
  }
  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`${hrefBase}/${item.id}`}
            className="hover:bg-muted flex h-9 items-center gap-3 rounded-md px-2 text-sm"
          >
            <FileIcon className="text-muted-foreground size-4 shrink-0" />
            <span className="flex-1 truncate">{item.name}</span>
            <span className="text-muted-foreground w-24 text-right text-xs tabular-nums">
              {copy.home.recent.assetCount(item.assetCount)}
            </span>
            <span className="text-muted-foreground w-24 text-right text-xs">
              {formatRelativeTime(item.updatedAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
