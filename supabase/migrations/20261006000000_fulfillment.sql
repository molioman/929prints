-- Brands, fulfillment routing settings, and incoming orders split into
-- fulfillment jobs. Only the server (secret key) reads and writes these
-- tables: row level security is on and no policies grant other roles access.

create table public.brands (
  slug text primary key,  -- matches `slug` in src/lib/brands.ts
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.brands (slug, name) values
  ('dachshund', 'Dachshund brand (name TBD)'),
  ('929prints', '929 Prints');

-- Global switches. Exactly one row.
create table public.fulfillment_settings (
  id boolean primary key default true check (id),
  outsourcing_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.fulfillment_settings default values;

-- Outside producers: Printful, local vendors, etc. Disabling one hides its
-- outsourced-only products and sends `both` products in-house.
create table public.fulfillment_providers (
  id text primary key,  -- e.g. 'printful'
  name text not null,
  -- api: orders are submitted automatically; manual: you place the order.
  kind text not null check (kind in ('api', 'manual')),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.fulfillment_providers (id, name, kind) values
  ('printful', 'Printful', 'api');

create type public.fulfillment_mode as enum ('inhouse', 'outsourced', 'both');
create type public.fulfillment_route as enum ('inhouse', 'outsourced');

-- How each Shopify product is produced. Products without a row are held
-- when ordered.
create table public.product_fulfillment (
  brand_slug text not null references public.brands (slug),
  shopify_product_id text not null,  -- numeric id, e.g. '8123456789012'
  mode public.fulfillment_mode not null default 'inhouse',
  -- Only used when mode = 'both'.
  preferred_route public.fulfillment_route not null default 'inhouse',
  provider_id text references public.fulfillment_providers (id),
  notes text,
  updated_at timestamptz not null default now(),
  primary key (brand_slug, shopify_product_id),
  constraint provider_required_when_outsourcing
    check (mode = 'inhouse' or provider_id is not null)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  brand_slug text not null references public.brands (slug),
  shopify_order_id text not null,
  shopify_order_name text,  -- e.g. '#1001'
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (brand_slug, shopify_order_id)
);

create table public.fulfillment_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  route text not null check (route in ('inhouse', 'outsourced', 'hold')),
  provider_id text references public.fulfillment_providers (id),
  status text not null check (
    status in ('queued', 'on_hold', 'submitted', 'in_production', 'shipped', 'cancelled')
  ),
  hold_reason text,
  items jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_matches_route
    check ((route = 'outsourced') = (provider_id is not null))
);

create index fulfillment_jobs_order_id_idx on public.fulfillment_jobs (order_id);
create index fulfillment_jobs_status_idx on public.fulfillment_jobs (status);

alter table public.brands enable row level security;
alter table public.fulfillment_settings enable row level security;
alter table public.fulfillment_providers enable row level security;
alter table public.product_fulfillment enable row level security;
alter table public.orders enable row level security;
alter table public.fulfillment_jobs enable row level security;

-- Saves an order and its jobs in one transaction. Returns the new order id,
-- or null when the order was already saved (Shopify redelivered it).
create function public.ingest_shopify_order(
  p_brand_slug text,
  p_shopify_order_id text,
  p_shopify_order_name text,
  p_payload jsonb,
  p_jobs jsonb
) returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_order_id uuid;
begin
  insert into public.orders (brand_slug, shopify_order_id, shopify_order_name, payload)
  values (p_brand_slug, p_shopify_order_id, p_shopify_order_name, p_payload)
  on conflict (brand_slug, shopify_order_id) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    return null;
  end if;

  insert into public.fulfillment_jobs (order_id, route, provider_id, status, hold_reason, items)
  select
    v_order_id,
    job ->> 'route',
    job ->> 'provider_id',
    case when job ->> 'route' = 'hold' then 'on_hold' else 'queued' end,
    job ->> 'hold_reason',
    job -> 'items'
  from jsonb_array_elements(p_jobs) as job;

  return v_order_id;
end;
$$;

revoke execute on function public.ingest_shopify_order(text, text, text, jsonb, jsonb)
  from public, anon, authenticated;
