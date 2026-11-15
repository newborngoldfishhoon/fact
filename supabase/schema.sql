create table public.claim_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  claim text not null check (char_length(claim) between 3 and 500),
  created_at timestamptz not null default now()
);

create index claim_history_user_created_idx
  on public.claim_history (user_id, created_at desc);

alter table public.claim_history enable row level security;

grant select, insert on table public.claim_history to authenticated;

create policy "Users can read their own claim history"
  on public.claim_history
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add to their own claim history"
  on public.claim_history
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
