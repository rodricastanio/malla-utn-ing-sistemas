-- Perfiles por usuario (crea la tabla + seguridad RLS)
-- Pegar en Supabase → SQL Editor → Run
create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  intentos jsonb not null default '{}'::jsonb,
  notas jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.perfiles enable row level security;

create policy "lectura propia" on public.perfiles
  for select using (auth.uid() = id);

create policy "insercion propia" on public.perfiles
  for insert with check (auth.uid() = id);

create policy "actualizacion propia" on public.perfiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
