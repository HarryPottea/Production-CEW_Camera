create table if not exists public.equipment (
  id text primary key,
  brand text not null,
  model text not null,
  category text not null,
  announced_at date not null,
  release_date date,
  status text not null,
  summary text not null,
  official_url text,
  manual_url text,
  firmware_url text,
  featured boolean not null default false,
  is_published boolean not null default true,
  source_title text,
  created_at timestamptz not null default now()
);

create index if not exists equipment_announced_at_idx on public.equipment (announced_at desc);
create index if not exists equipment_brand_idx on public.equipment (brand);
create index if not exists equipment_status_idx on public.equipment (status);
