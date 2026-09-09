create table public.brands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_url text not null,
  profile jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, source_url)
);

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  campaign_key text not null,
  reference_key text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  created_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  kind text not null check (kind in ('image', 'caption', 'video')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  storage_path text,
  provider_request_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index runs_brand_id_idx on public.runs(brand_id);

create index assets_run_id_idx on public.assets(run_id);

alter table public.brands enable row level security;

alter table public.runs enable row level security;

alter table public.assets enable row level security;

revoke all on table public.brands, public.runs, public.assets from anon, authenticated;

grant select, insert, update on table public.brands, public.runs to authenticated;

grant select, insert, update on table public.assets to authenticated;

create policy brands_select_own
on public.brands for select
to authenticated
using ((select auth.uid()) = user_id);

create policy brands_insert_own
on public.brands for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy brands_update_own
on public.brands for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy runs_select_own
on public.runs for select
to authenticated
using (
  exists (
    select 1 from public.brands
    where brands.id = runs.brand_id
      and brands.user_id = (select auth.uid())
  )
);

create policy runs_insert_own
on public.runs for insert
to authenticated
with check (
  exists (
    select 1 from public.brands
    where brands.id = runs.brand_id
      and brands.user_id = (select auth.uid())
  )
);

create policy runs_update_own
on public.runs for update
to authenticated
using (
  exists (
    select 1 from public.brands
    where brands.id = runs.brand_id
      and brands.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.brands
    where brands.id = runs.brand_id
      and brands.user_id = (select auth.uid())
  )
);

create policy assets_select_own
on public.assets for select
to authenticated
using (
  exists (
    select 1
    from public.runs
    join public.brands on brands.id = runs.brand_id
    where runs.id = assets.run_id
      and brands.user_id = (select auth.uid())
  )
);

create policy assets_insert_own
on public.assets for insert
to authenticated
with check (
  exists (
    select 1
    from public.runs
    join public.brands on brands.id = runs.brand_id
    where runs.id = assets.run_id
      and brands.user_id = (select auth.uid())
  )
);

create policy assets_update_own
on public.assets for update
to authenticated
using (
  exists (
    select 1
    from public.runs
    join public.brands on brands.id = runs.brand_id
    where runs.id = assets.run_id
      and brands.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.runs
    join public.brands on brands.id = runs.brand_id
    where runs.id = assets.run_id
      and brands.user_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assets', 'assets', false, 10485760, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy assets_objects_select_own
on storage.objects for select
to authenticated
using (
  bucket_id = 'assets'
  and exists (
    select 1
    from public.assets
    join public.runs on runs.id = assets.run_id
    join public.brands on brands.id = runs.brand_id
    where assets.storage_path = storage.objects.name
      and brands.user_id = (select auth.uid())
  )
);

create policy assets_objects_insert_own
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'assets'
  and exists (
    select 1
    from public.assets
    join public.runs on runs.id = assets.run_id
    join public.brands on brands.id = runs.brand_id
    where assets.storage_path = storage.objects.name
      and brands.user_id = (select auth.uid())
  )
);
