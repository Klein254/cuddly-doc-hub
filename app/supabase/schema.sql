-- Vector Doc Hub schema. Run once in Supabase → SQL Editor.
-- Then add each staff member: create them under Authentication → Users,
-- and insert their email into public.team_members (see bottom of file).

-- Only emails in this table can read or write documents.
create table if not exists public.team_members (
  email text primary key
);
alter table public.team_members enable row level security;

create or replace function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- One row per document. Line items, recipient etc. live in `data`.
-- updated_at is written by the client and used for last-write-wins merging.
create table if not exists public.documents (
  id uuid primary key,
  type text not null check (type in ('quotation', 'invoice', 'delivery', 'statement')),
  number text not null,
  year int not null,
  seq int not null,
  data jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
create unique index if not exists documents_type_year_seq on public.documents (type, year, seq);
create index if not exists documents_updated_at on public.documents (updated_at);

-- Company details, numbering prefix, default VAT etc. Single row with id 'company'.
create table if not exists public.settings (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.documents enable row level security;
alter table public.settings enable row level security;

drop policy if exists "team read documents" on public.documents;
drop policy if exists "team insert documents" on public.documents;
drop policy if exists "team update documents" on public.documents;
create policy "team read documents" on public.documents for select to authenticated using (public.is_team_member());
create policy "team insert documents" on public.documents for insert to authenticated with check (public.is_team_member());
create policy "team update documents" on public.documents for update to authenticated using (public.is_team_member()) with check (public.is_team_member());

drop policy if exists "team read settings" on public.settings;
drop policy if exists "team insert settings" on public.settings;
drop policy if exists "team update settings" on public.settings;
create policy "team read settings" on public.settings for select to authenticated using (public.is_team_member());
create policy "team insert settings" on public.settings for insert to authenticated with check (public.is_team_member());
create policy "team update settings" on public.settings for update to authenticated using (public.is_team_member()) with check (public.is_team_member());

-- Live sync: push every change to connected devices.
alter table public.documents replica identity full;
alter table public.settings replica identity full;
do $$
begin
  begin
    alter publication supabase_realtime add table public.documents;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.settings;
  exception when duplicate_object then null;
  end;
end $$;

-- Add your team (edit and run):
-- insert into public.team_members (email) values ('vectortech254@gmail.com');
