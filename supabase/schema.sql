begin;

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  area text not null check (area in ('A区', 'B区', 'C区')),
  "deviceType" text not null check ("deviceType" in ('电脑', '打印机', '投影仪')),
  description text not null check (char_length(description) between 5 and 1000),
  status text not null default '待处理' check (status in ('待处理', '处理中', '已完成')),
  suggestions jsonb not null default '[]'::jsonb check (jsonb_typeof(suggestions) = 'array'),
  "suggestionSource" text not null default 'guide' check ("suggestionSource" in ('deepseek', 'guide')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists repair_tickets_created_at on public.tickets ("createdAt" desc, id desc);
alter table public.tickets enable row level security;
revoke all on public.tickets from anon, authenticated;
grant select, insert, update on public.tickets to service_role;

commit;
