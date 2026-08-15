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

-- Recordatorios (calendario): titulo, materia opcional, tipo y fecha
-- Pegar en Supabase → SQL Editor → Run
create table if not exists public.recordatorios (
  id uuid primary key,
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  titulo text not null,
  materia_id text,
  tipo text not null default 'otro',
  fecha date not null,
  descripcion text not null default '',
  created_at timestamptz not null default now()
);

alter table public.recordatorios enable row level security;

create policy "lectura propia" on public.recordatorios
  for select using (auth.uid() = perfil_id);

create policy "insercion propia" on public.recordatorios
  for insert with check (auth.uid() = perfil_id);

create policy "actualizacion propia" on public.recordatorios
  for update using (auth.uid() = perfil_id) with check (auth.uid() = perfil_id);

create policy "borrado propio" on public.recordatorios
  for delete using (auth.uid() = perfil_id);

create index if not exists recordatorios_fecha_idx on public.recordatorios (perfil_id, fecha);

-- Acento del tema personalizado (se sincroniza entre dispositivos)
-- Pegar en Supabase → SQL Editor → Run
alter table public.perfiles
  add column if not exists accento text;
