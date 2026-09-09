-- 캠페인 목록에서 자기 캠페인을 지울 수 있게 한다. assets 행은 FK cascade로 함께 지워진다.
create policy runs_delete_own
on public.runs for delete
to authenticated
using (
  exists (
    select 1 from public.brands
    where brands.id = runs.brand_id
      and brands.user_id = (select auth.uid())
  )
);

create policy assets_objects_delete_own
on storage.objects for delete
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
