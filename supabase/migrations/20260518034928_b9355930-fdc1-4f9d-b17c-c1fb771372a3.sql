create table public.compliance_audit_runs (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  run_by uuid references auth.users(id) on delete set null,
  system_version text not null,
  i18n_version text,
  totals jsonb not null,
  per_authority jsonb not null,
  diff jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.compliance_audit_runs enable row level security;

create policy "Admins can read compliance audit runs"
  on public.compliance_audit_runs for select
  using (public.is_admin());

create policy "Admins can insert compliance audit runs"
  on public.compliance_audit_runs for insert
  with check (public.is_admin());

create index idx_compliance_audit_runs_run_at on public.compliance_audit_runs(run_at desc);