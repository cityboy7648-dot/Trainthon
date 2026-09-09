create unique index assets_image_retry_once
on public.assets (run_id, (meta ->> 'retryOf'))
where kind = 'image' and meta ->> 'stage' = 'image' and meta ->> 'retryOf' is not null;
