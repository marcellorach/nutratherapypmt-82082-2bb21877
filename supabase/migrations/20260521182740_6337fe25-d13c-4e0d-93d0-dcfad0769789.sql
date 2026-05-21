
create table if not exists public.ai_task_invocations (
  id uuid primary key default gen_random_uuid(),
  task_id text not null,
  model_id text not null,
  prompt_version_id uuid references public.ai_prompt_versions(id) on delete set null,
  caller_function text,
  latency_ms int,
  tokens_in int,
  tokens_out int,
  cost_estimate numeric,
  ok boolean not null default true,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_task_invocations_task_created on public.ai_task_invocations(task_id, created_at desc);
create index if not exists idx_ai_task_invocations_caller on public.ai_task_invocations(caller_function, created_at desc);

alter table public.ai_task_invocations enable row level security;

create policy "Admins can read ai_task_invocations"
on public.ai_task_invocations for select
to authenticated
using (public.is_admin());

create table if not exists public.ai_task_status (
  task_id text primary key,
  last_run_at timestamptz,
  last_latency_ms int,
  last_model_id text,
  last_error text,
  ok boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.ai_task_status enable row level security;

create policy "Admins can read ai_task_status"
on public.ai_task_status for select
to authenticated
using (public.is_admin());
